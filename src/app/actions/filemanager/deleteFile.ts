"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { unlink } from 'fs/promises'
import { join } from 'path'

const prisma = new PrismaClient()

export interface DeleteFileResult {
  success: boolean
  error?: string
}

/**
 * Удалить файл
 * @param fileId ID файла для удаления
 */
export async function deleteFile(fileId: number): Promise<DeleteFileResult> {
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

    // Удаляем физический файл
    try {
      const absolutePath = file.path.startsWith('uploads/') 
        ? join(process.cwd(), 'public', file.path)
        : file.path
      await unlink(absolutePath)
    } catch (fsError) {
      console.error('Failed to delete file from filesystem:', fsError)
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
