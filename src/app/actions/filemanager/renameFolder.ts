"use server"

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import { createClient } from '@supabase/supabase-js'
import { renameFolderSchema } from '@/lib/validations/folder'
import { invalidateCache } from '@/lib/redis'

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
      // Получаем все файлы в переименовываемой папке рекурсивно
      const getAllFilesInFolder = async (folderId: number) => {
        const allFiles: { id: number; path: string; filename: string; originalName: string }[] = []

        const directFiles = await prisma.file.findMany({
          where: { folderId: folderId }
        })
        allFiles.push(...directFiles)

        const childFolders = await prisma.folder.findMany({
          where: { parentId: folderId }
        })

        for (const childFolder of childFolders) {
          const childFiles = await getAllFilesInFolder(childFolder.id)
          allFiles.push(...childFiles)
        }

        return allFiles
      }

      const allFiles = await getAllFilesInFolder(folderId)

      if (allFiles.length === 0) {
        return true
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Перемещаем каждый файл в новое место (copy + remove вместо move для большей надежности)
      const movePromises = allFiles.map(async (file) => {
        const storagePath = file.path
        const newStoragePath = storagePath.replace(oldPath, newPath)

        const { data: copyData, error: copyError } = await supabase.storage
          .from('AlexSiteStoragePublic')
          .copy(storagePath, newStoragePath)

        if (copyError) {
          console.error(`Failed to copy file ${storagePath} to ${newStoragePath}:`, copyError)
          throw copyError
        }

        const { error: removeError } = await supabase.storage
          .from('AlexSiteStoragePublic')
          .remove([storagePath])

        if (removeError) {
          console.error(`Failed to remove old file ${storagePath}:`, removeError)
          // Не прерываем выполнение, так как файл уже скопирован
        }

        await prisma.file.update({
          where: { id: file.id },
          data: { path: newStoragePath }
        })

        return copyData
      })

      await Promise.all(movePromises)
      return true
    } catch (error) {
      console.error('Error moving Supabase folder:', error)
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

      await updateChildrenPaths(child.id, newChildPath)
    }
  }

  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!user?.id) {
      return { success: false, error: 'User not found' }
    }

    // Валидируем данные с помощью Zod
    const validationResult = renameFolderSchema.safeParse({
      id: folderId,
      name: newName.trim()
    })

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || 'Недопустимое название папки'
      return { success: false, error: errorMessage }
    }

    const validatedName = validationResult.data.name

    // Находим папку в базе данных
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        parent: true,
        children: true,
        files: true
      }
    })

    if (!folder) {
      return { success: false, error: 'Folder not found' }
    }

    // Проверяем права доступа — ADMIN может переименовывать любые папки,
    // остальные роли только свои (та же модель прав, что и в listFiles.ts)
    if (user.userRole !== 'ADMIN' && folder.ownerId !== user.id) {
      return { success: false, error: 'Access denied' }
    }

    // Формируем новый путь
    const oldPath = folder.path
    let newPath: string

    if (folder.parent) {
      // Если есть родительская папка, создаем путь относительно неё
      newPath = `${folder.parent.path}/${validatedName}`
    } else {
      // Если это корневая папка, добавляем префикс владельца
      newPath = `user_${folder.ownerId}/${validatedName}`
    }

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
      } catch (fsError) {
        console.error('Failed to rename folder in filesystem:', fsError)
        return { success: false, error: 'Failed to rename folder on filesystem' }
      }
    } else {
      // Для облачного хранилища выполняем физическое перемещение файлов
      const moveSuccess = await moveSupabaseFolder(oldPath, newPath, folderId)
      if (!moveSuccess) {
        return { success: false, error: 'Failed to move files in cloud storage' }
      }
    }

    // Обновляем запись в базе данных (имя и путь для всех типов хранилища)
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        name: validatedName,
        path: newPath
      }
    })

    // Обновляем пути всех дочерних папок
    await updateChildrenPaths(folderId, newPath)

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

    await invalidateCache('files:*')
    await invalidateCache('files:tree:*')

    return {
      success: true,
      folder: folderResult
    }
  } catch (error) {
    console.error('Rename folder error:', error)
    return { success: false, error: 'Failed to rename folder' }
  }
}
