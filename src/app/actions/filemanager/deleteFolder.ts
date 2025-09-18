"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { rmdir } from 'fs/promises'
import { join } from 'path'
import { deleteFile } from '@/lib/utils/universal-file-utils'
import { getStorageInfo } from '@/lib/utils/universal-file-utils'

const prisma = new PrismaClient()

/**
 * Рекурсивно проверяет, есть ли защищенные файлы в папке
 */
async function checkForProtectedFiles(folderId: number): Promise<boolean> {
  // Проверяем файлы в текущей папке
  const protectedFiles = await prisma.file.findFirst({
    where: { 
      folderId: folderId,
      isProtected: true
    }
  })
  
  if (protectedFiles) {
    return true
  }
  
  // Проверяем дочерние папки
  const childFolders = await prisma.folder.findMany({
    where: { parentId: folderId },
    select: { id: true }
  })
  
  for (const child of childFolders) {
    const hasProtected = await checkForProtectedFiles(child.id)
    if (hasProtected) {
      return true
    }
  }
  
  return false
}

export interface DeleteFolderResult {
  success: boolean
  error?: string
}

/**
 * Удалить папку и все её содержимое рекурсивно
 * @param folderId ID папки для удаления
 * @param force если true, удаляет папку со всем содержимым
 */
export async function deleteFolder(folderId: number, force: boolean = false): Promise<DeleteFolderResult> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = JSON.parse(sessionCookie.value)

    if (!user?.id) {
      return { success: false, error: 'User not found' }
    }

    // Находим папку в базе данных с её содержимым
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        files: true,
        children: {
          include: {
            files: true,
            children: true
          }
        }
      }
    })

    if (!folder) {
      return { success: false, error: 'Folder not found' }
    }

    // Проверяем права доступа
    if (user.userRole === 'EDITOR') {
      // EDITOR может удалять только свои папки
      if (folder.ownerId !== user.id) {
        return { success: false, error: 'Access denied: You can only delete your own folders' }
      }
      
      // Проверяем, есть ли защищенные файлы в папке (рекурсивно)
      const hasProtectedFiles = await checkForProtectedFiles(folderId)
      if (hasProtectedFiles && !force) {
        return { 
          success: false, 
          error: 'Cannot delete folder containing protected files. Protected files can only be deleted by an administrator.' 
        }
      }
    } else if (user.userRole === 'ADMIN') {
      // ADMIN может удалять любые папки, но лучше показать предупреждение для защищенных файлов
      const hasProtectedFiles = await checkForProtectedFiles(folderId)
      if (hasProtectedFiles && !force) {
        return {
          success: false,
          error: 'This folder contains protected files. Use force=true to delete it anyway.'
        }
      }
    } else {
      // Пользователи USER не должны иметь доступ к удалению папок
      return { success: false, error: 'Access denied: Insufficient permissions' }
    }

    // Если force не установлен, проверяем, что папка пустая
    if (!force && (folder.files.length > 0 || folder.children.length > 0)) {
      return { success: false, error: 'Folder is not empty. Use force=true to delete with contents.' }
    }

    // Рекурсивная функция для удаления всех файлов и папок
    const deleteRecursively = async (currentFolderId: number) => {
      // Получаем все файлы в текущей папке
      const files = await prisma.file.findMany({
        where: { folderId: currentFolderId }
      })

      // Удаляем все файлы через универсальную систему
      for (const file of files) {
        // Если пользователь EDITOR и файл защищен, пропускаем его (не должно произойти из-за проверки выше)
        if (user.userRole === 'EDITOR' && file.isProtected && !force) {
          console.warn(`Skipping protected file ${file.id} for EDITOR user`)
          continue
        }
        
        try {
          // Используем универсальную систему удаления файлов
          await deleteFile(file.path);
        } catch (storageError) {
          console.error('Failed to delete file from storage:', storageError)
          // Продолжаем удаление даже если файл не удален из хранилища
        }
        
        // Удаляем запись из БД
        await prisma.file.delete({
          where: { id: file.id }
        })
      }

      // Получаем все дочерние папки
      const children = await prisma.folder.findMany({
        where: { parentId: currentFolderId }
      })

      // Рекурсивно удаляем дочерние папки
      for (const child of children) {
        await deleteRecursively(child.id)
      }

      // Удаляем саму папку из базы данных
      await prisma.folder.delete({
        where: { id: currentFolderId }
      })
    }

    // Удаляем рекурсивно
    await deleteRecursively(folderId)

    // Удаляем физическую папку только для локального провайдера
    // В Supabase Storage папки удаляются автоматически при удалении всех файлов
    const storageInfo = getStorageInfo();
    
    if (storageInfo.isLocal) {
      try {
        const absolutePath = join(process.cwd(), 'public', 'uploads', folder.path)
        await rmdir(absolutePath, { recursive: true })
        console.log('Physical folder deleted from local storage')
      } catch (fsError) {
        console.error('Failed to delete folder from local filesystem:', fsError)
        // Не возвращаем ошибку, так как данные уже удалены из БД
      }
    } else {
      console.log('Skipping physical folder deletion (cloud storage)')
    }

    return { success: true }

  } catch (error) {
    console.error('Folder deletion error:', error)
    return { success: false, error: 'Failed to delete folder' }
  }
}
