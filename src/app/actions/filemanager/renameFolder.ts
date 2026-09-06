"use server"

import { PrismaClient } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@supabase/supabase-js'
import { renameFolderSchema } from '@/lib/validations/folder'
import { invalidateCache } from '@/lib/redis'

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
  // Функция для физического переименования папки в Supabase Storage
  const moveSupabaseFolder = async (oldPath: string, newPath: string, folderId: number): Promise<boolean> => {
    try {
      console.log('🔄 Moving Supabase folder physically:', { oldPath, newPath, folderId })
      
      // Получаем все файлы в переименовываемой папке рекурсивно
      const getAllFilesInFolder = async (folderId: number) => {
        const allFiles: {id: number, path: string, filename: string, originalName: string}[] = []
        
        // Получаем файлы напрямую в этой папке
        const directFiles = await prisma.file.findMany({
          where: { folderId: folderId }
        })
        allFiles.push(...directFiles)
        
        // Получаем все дочерние папки
        const childFolders = await prisma.folder.findMany({
          where: { parentId: folderId }
        })
        
        // Рекурсивно получаем файлы из дочерних папок
        for (const childFolder of childFolders) {
          const childFiles = await getAllFilesInFolder(childFolder.id)
          allFiles.push(...childFiles)
        }
        
        return allFiles
      }
      
      const allFiles = await getAllFilesInFolder(folderId)
      
      console.log(`📂 Found ${allFiles.length} files to move recursively`)
      
      if (allFiles.length === 0) {
        console.log('✅ No files to move, folder rename successful')
        return true
      }
      
      // Создаем supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      // Перемещаем каждый файл в новое место
      const movePromises = allFiles.map(async (file) => {
        // Для Supabase Storage путь файла уже корректный (user_X/...)
        // Не нужно убирать префикс uploads/, его нет в облачном хранилище
        const storagePath = file.path
        
        // Формируем новый путь для файла в хранилище
        const newStoragePath = storagePath.replace(oldPath, newPath)
        
        console.log(`🔄 Moving file:`, {
          originalPath: file.path,
          storagePath,
          newStoragePath,
          oldPath,
          newPath
        })
        
        // Перемещаем файл в Supabase Storage
        // Используем copy + remove вместо move для большей надежности
        console.log(`📋 Copying file from ${storagePath} to ${newStoragePath}`)
        const { data: copyData, error: copyError } = await supabase.storage
          .from('AlexSiteStoragePublic')
          .copy(storagePath, newStoragePath)
        
        if (copyError) {
          console.error(`❌ Failed to copy file ${storagePath} to ${newStoragePath}:`, copyError)
          throw copyError
        }
        
        console.log(`✅ File copied successfully, now removing old file ${storagePath}`)
        // Удаляем старый файл
        const { error: removeError } = await supabase.storage
          .from('AlexSiteStoragePublic')
          .remove([storagePath])
        
        if (removeError) {
          console.error(`❌ Failed to remove old file ${storagePath}:`, removeError)
          // Не прерываем выполнение, так как файл уже скопирован
        } else {
          console.log(`✅ Old file removed successfully: ${storagePath}`)
        }
        
        // Обновляем путь файла в базе данных
        // Для Supabase Storage путь уже правильный, не добавляем uploads/
        await prisma.file.update({
          where: { id: file.id },
          data: { path: newStoragePath }
        })
        
        console.log(`✅ Successfully moved file: ${file.filename}`)
        return copyData
      })
      
      // Ждем завершения всех операций перемещения
      await Promise.all(movePromises)
      
      console.log('✅ All files moved successfully in Supabase Storage')
      return true
      
    } catch (error) {
      console.error('❌ Error moving Supabase folder:', error)
      return false
    }
  }

  // Функция для рекурсивного обновления физических путей всех дочерних папок
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

  try {
    console.log('🔍 RenameFolder: Starting rename process', { folderId, newName })
    
    const user = await getCurrentUser()

    if (!user) {
      console.log('❌ RenameFolder: No session cookie')
      return { success: false, error: 'Unauthorized' }
    }

    if (!user?.id) {
      console.log('❌ RenameFolder: No user ID in session')
      return { success: false, error: 'User not found' }
    }

    console.log('👤 RenameFolder: User info', { id: user.id, email: user.email })

    // Валидируем данные с помощью Zod
    console.log('🔍 RenameFolder: Input data before validation', { folderId, newName })
    const validationResult = renameFolderSchema.safeParse({
      id: folderId,
      name: newName.trim()
    })

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || 'Недопустимое название папки'
      console.log('❌ RenameFolder: Validation failed', { error: errorMessage })
      return { success: false, error: errorMessage }
    }

    const validatedName = validationResult.data.name
    console.log('✅ RenameFolder: Validation successful', { 
      originalInput: newName.trim(), 
      validatedName 
    })


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

    // EDITOR может переименовывать свои папки, даже если в них есть используемые файлы
    // (переименование не влияет на использование файлов)

    // Формируем новый путь
    const oldPath = folder.path
    let newPath: string
    
    console.log('🛤️ RenameFolder: Calculating new path', { oldPath, newName: validatedName })
    
    if (folder.parent) {
      // Если есть родительская папка, создаем путь относительно неё
      newPath = `${folder.parent.path}/${validatedName}`
      console.log('📂 RenameFolder: Subfolder path', { parentPath: folder.parent.path, newPath })
    } else {
      // Если это корневая папка пользователя, добавляем префикс пользователя
      newPath = `user_${user.id}/${validatedName}`
      console.log('🏠 RenameFolder: Root folder path', { userId: user.id, newPath })
    }

    // Для облачного хранилища (Supabase) обновляем только виртуальные пути
    // Физические пути (path) остаются неизменными для предотвращения битых ссылок
    
    console.log('📁 Folder rename: Updating virtual paths for cloud storage')
    
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
      console.log('📁 Cloud storage: Performing physical folder move')
      
      // Для облачного хранилища выполняем физическое перемещение файлов
      const moveSuccess = await moveSupabaseFolder(oldPath, newPath, folderId)
      if (!moveSuccess) {
        return { success: false, error: 'Failed to move files in cloud storage' }
      }
    }

    // Обновляем запись в базе данных
    console.log('💾 RenameFolder: Updating database record', { 
      folderId, 
      newName: validatedName, 
      newPath,
      isCloudStorage: process.env.STORAGE_PROVIDER === 'supabase'
    })
    
    // Для всех типов хранилища обновляем и имя, и путь
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        name: validatedName,
        path: newPath
      }
    })

    console.log('✅ RenameFolder: Database updated successfully', { 
      id: updatedFolder.id,
      name: updatedFolder.name,
      path: updatedFolder.path
    })

    // Обновляем пути всех дочерних папок для всех типов хранилища
    await updateChildrenPaths(folderId, newPath)

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

    // Invalidate cache after successful rename
    await invalidateCache(`files:*`)
    await invalidateCache(`files:tree:*`)

    return {
      success: true,
      folder: folderResult
    }

  } catch (error) {
    console.error('Rename folder error:', error)
    return { success: false, error: 'Failed to rename folder' }
  }
}
