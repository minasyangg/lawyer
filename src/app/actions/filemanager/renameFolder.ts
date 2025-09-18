"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { updateChildrenVirtualPaths, generateVirtualPath } from '@/lib/virtualPaths'

const prisma = new PrismaClient()

export interface RenameFolderResult {
  success: boolean
  folder?: {
    id: number
    originalName: string
    filename: string
    mimeType: string
    size: number
    createdAt: string
    url: string
    isFolder: boolean
    path: string
  }
  error?: string
}

/**
 * Переименовать папку
 * @param folderId ID папки для переименования
 * @param newName новое имя папки
 */
export async function renameFolder(folderId: number, newName: string): Promise<RenameFolderResult> {
  try {
    console.log('🔍 RenameFolder: Starting rename process', { folderId, newName })
    
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      console.log('❌ RenameFolder: No session cookie')
      return { success: false, error: 'Unauthorized' }
    }

    const user = JSON.parse(sessionCookie.value)

    if (!user?.id) {
      console.log('❌ RenameFolder: No user ID in session')
      return { success: false, error: 'User not found' }
    }

    console.log('👤 RenameFolder: User info', { id: user.id, email: user.email })

    if (!newName.trim()) {
      console.log('❌ RenameFolder: Empty folder name')
      return { success: false, error: 'Folder name required' }
    }

    // Находим папку в базе данных
    console.log('🔍 RenameFolder: Looking for folder in database', { folderId })
    
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        parent: true,
        children: true,
        files: true
      }
    })

    console.log('📁 RenameFolder: Found folder', { 
      found: !!folder,
      folderId: folder?.id,
      name: folder?.name,
      ownerId: folder?.ownerId,
      path: folder?.path
    })

    if (!folder) {
      console.log('❌ RenameFolder: Folder not found in database')
      return { success: false, error: 'Folder not found' }
    }

    // Проверяем права доступа
    console.log('🔐 RenameFolder: Checking access rights', { 
      folderOwnerId: folder.ownerId, 
      userId: user.id,
      match: folder.ownerId === user.id 
    })
    
    if (folder.ownerId !== user.id) {
      console.log('❌ RenameFolder: Access denied')
      return { success: false, error: 'Access denied' }
    }

    // Формируем новый путь
    const oldPath = folder.path
    let newPath: string
    
    console.log('🛤️ RenameFolder: Calculating new path', { oldPath, newName: newName.trim() })
    
    if (folder.parent) {
      // Если есть родительская папка, создаем путь относительно неё
      newPath = `${folder.parent.path}/${newName.trim()}`
      console.log('📂 RenameFolder: Subfolder path', { parentPath: folder.parent.path, newPath })
    } else {
      // Если это корневая папка пользователя, добавляем префикс пользователя
      newPath = `user_${user.id}/${newName.trim()}`
      console.log('🏠 RenameFolder: Root folder path', { userId: user.id, newPath })
    }

    // Для облачного хранилища (Supabase) мы не переименовываем физическую папку
    // Вместо этого обновляем только записи в базе данных
    // Файлы в Supabase Storage хранятся по уникальным путям и не требуют физического переименования
    
    console.log('📁 Folder rename: Updating database records only (cloud storage)')
    
    // Проверяем, какой провайдер хранилища используется
    const storageProvider = process.env.STORAGE_PROVIDER || 'local'
    
    if (storageProvider === 'local') {
      // Только для локального хранилища пытаемся переименовать физическую папку
      try {
        const { rename } = await import('fs/promises')
        const { join } = await import('path')
        
        const oldAbsolutePath = join(process.cwd(), 'public', 'uploads', oldPath)
        const newAbsolutePath = join(process.cwd(), 'public', 'uploads', newPath)
        await rename(oldAbsolutePath, newAbsolutePath)
        console.log('📁 Local folder renamed successfully')
      } catch (fsError) {
        console.error('Failed to rename folder in filesystem:', fsError)
        return { success: false, error: 'Failed to rename folder on filesystem' }
      }
    } else {
      console.log('📁 Cloud storage: Skipping physical folder rename')
    }

    // Функция для рекурсивного обновления путей всех дочерних папок
    const updateChildrenPaths = async (parentId: number, newParentPath: string) => {
      const children = await prisma.folder.findMany({
        where: { parentId: parentId }
      })

      for (const child of children) {
        const newChildPath = `${newParentPath}/${child.name}`
        await prisma.folder.update({
          where: { id: child.id },
          data: { path: newChildPath }
        })
        
        // Рекурсивно обновляем пути дочерних папок
        await updateChildrenPaths(child.id, newChildPath)
      }
    }

    // Обновляем запись в базе данных
    console.log('💾 RenameFolder: Updating database record', { 
      folderId, 
      newName: newName.trim(), 
      newPath 
    })
    
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        name: newName.trim(),
        path: newPath
      }
    })

    console.log('✅ RenameFolder: Database updated successfully', { 
      id: updatedFolder.id,
      name: updatedFolder.name,
      path: updatedFolder.path
    })

    // Генерируем новый виртуальный путь для переименованной папки
    const newVirtualPath = await generateVirtualPath(folderId)
    
    // Обновляем виртуальный путь переименованной папки
    await prisma.folder.update({
      where: { id: folderId },
      data: {
        virtualPath: newVirtualPath
      }
    })

    // Обновляем пути всех дочерних папок
    await updateChildrenPaths(folderId, newPath)

    // Обновляем пути файлов в этой папке
    const filesInFolder = await prisma.file.findMany({
      where: { folderId: folderId }
    })
    
    for (const file of filesInFolder) {
      // Создаем новый путь для файла
      const fileName = file.path.split('/').pop() || file.filename
      const newFilePath = `uploads/${newPath}/${fileName}`
      
      await prisma.file.update({
        where: { id: file.id },
        data: { 
          path: newFilePath,
          virtualPath: newVirtualPath // Обновляем и виртуальный путь файла
        }
      })
    }

    // Возвращаем папку в формате FileItem
    const folderResult = {
      id: updatedFolder.id,
      originalName: updatedFolder.name,
      filename: updatedFolder.name,
      mimeType: 'folder',
      size: 0,
      createdAt: updatedFolder.createdAt.toISOString(),
      url: `/uploads/${updatedFolder.path}`,
      isFolder: true,
      path: updatedFolder.path
    }

    // Автоматически обновляем виртуальные пути всех дочерних папок и файлов
    await updateChildrenVirtualPaths(folderId, newVirtualPath)

    return {
      success: true,
      folder: folderResult
    }

  } catch (error) {
    console.error('Rename folder error:', error)
    return { success: false, error: 'Failed to rename folder' }
  }
}
