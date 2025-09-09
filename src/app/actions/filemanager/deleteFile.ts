"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { checkFileUsage } from './checkFileUsage'
import { deleteFile as deleteFileFromStorage } from '@/lib/utils/universal-file-utils'

const prisma = new PrismaClient()

export interface DeleteFileResult {
  success: boolean
  error?: string
  isUsed?: boolean
  usedIn?: Array<{ id: number; title: string; type: 'content' | 'document' }>
}

/**
 * Удалить файл
 * @param fileId ID файла для удаления
 * @param force принудительное удаление без проверки использования
 */
export async function deleteFile(fileId: number, force: boolean = false): Promise<DeleteFileResult> {
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

    // Находим файл в базе данных
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return { success: false, error: 'File not found' }
    }

    // Проверяем права доступа
    if (file.uploadedBy !== user.id) {
      return { success: false, error: 'Access denied' }
    }

    // Проверяем использование файла в статьях (если не принудительное удаление)
    if (!force) {
      const usage = await checkFileUsage(fileId)
      if (usage.isUsed) {
        return {
          success: false,
          error: 'File is used in articles',
          isUsed: true,
          usedIn: usage.usedIn
        }
      }
    }

    // Удаляем физический файл через универсальную систему
    try {
      // Извлекаем путь файла для удаления
      let filePath = file.path;
      
      // Если это URL, извлекаем относительный путь
      if (filePath.startsWith('/uploads/')) {
        filePath = filePath.substring(9); // убираем '/uploads/'
      } else if (filePath.startsWith('uploads/')) {
        filePath = filePath.substring(8); // убираем 'uploads/'
      } else if (filePath.startsWith('https://')) {
        // Для S3/Supabase URL извлекаем путь
        const urlParts = filePath.split('/');
        const userIndex = urlParts.findIndex(part => part.startsWith('user_'));
        if (userIndex !== -1) {
          filePath = urlParts.slice(userIndex).join('/');
        }
      }
      
      console.log('Deleting file from storage:', filePath);
      const deleteResult = await deleteFileFromStorage(filePath);
      
      if (!deleteResult.success) {
        console.warn('Failed to delete file from storage:', deleteResult.error);
        // Продолжаем удаление из БД даже если физический файл не удален
      }
    } catch (storageError) {
      console.error('Failed to delete file from storage:', storageError);
      // Продолжаем удаление из БД даже если физический файл не удален
    }

    // Удаляем запись из базы данных
    await prisma.file.delete({
      where: { id: fileId }
    })

    return { success: true }

  } catch (error) {
    console.error('File deletion error:', error)
    return { success: false, error: 'Failed to delete file' }
  }
}
