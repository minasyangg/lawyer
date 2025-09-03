"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { readFile } from 'fs/promises'

const prisma = new PrismaClient()

export interface GetFileResult {
  success: boolean
  file?: {
    buffer: Buffer
    mimeType: string
    filename: string
    size: number
  }
  error?: string
}

/**
 * Получить файл для скачивания/просмотра
 * @param fileId ID файла
 */
export async function getFile(fileId: number): Promise<GetFileResult> {
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

    // Читаем файл с диска
    const buffer = await readFile(file.path)

    return {
      success: true,
      file: {
        buffer,
        mimeType: file.mimeType,
        filename: file.originalName,
        size: file.size
      }
    }

  } catch (error) {
    console.error('File access error:', error)
    return { success: false, error: 'Failed to access file' }
  }
}
