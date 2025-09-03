"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import fs from 'fs/promises'
import path from 'path'

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
 * Получить файл для скачивания/просмотра по ID
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
      where: { id: fileId },
      include: { folder: true }
    })

    if (!file) {
      return { success: false, error: 'File not found' }
    }

    // Проверяем права доступа
    if (file.uploadedBy !== user.id) {
      return { success: false, error: 'Access denied' }
    }

    // Получаем физический путь к файлу
    const filePath = path.join(process.cwd(), 'uploads', file.path)
    
    try {
      // Проверяем существование файла
      await fs.access(filePath)
      
      // Читаем файл
      const buffer = await fs.readFile(filePath)

      return {
        success: true,
        file: {
          buffer,
          mimeType: file.mimeType,
          filename: file.originalName,
          size: file.size
        }
      }
      
    } catch (fileError) {
      console.error('File access error:', fileError)
      return { success: false, error: 'File not accessible' }
    }

  } catch (error) {
    console.error('File access error:', error)
    return { success: false, error: 'Failed to access file' }
  }
}

/**
 * Получить файл по виртуальному ID
 * @param virtualId Виртуальный ID файла
 */
export async function getFileByVirtualId(virtualId: string): Promise<GetFileResult> {
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

    // Теперь используем virtualId для поиска
    const file = await prisma.file.findUnique({
      where: { virtualId },
      include: { folder: true }
    })

    if (!file) {
      return { success: false, error: 'File not found' }
    }

    // Проверяем права доступа
    if (file.uploadedBy !== user.id) {
      return { success: false, error: 'Access denied' }
    }

    // Получаем физический путь к файлу
    const filePath = path.join(process.cwd(), 'uploads', file.path)
    
    try {
      // Проверяем существование файла
      await fs.access(filePath)
      
      // Читаем файл
      const buffer = await fs.readFile(filePath)

      return {
        success: true,
        file: {
          buffer,
          mimeType: file.mimeType,
          filename: file.originalName,
          size: file.size
        }
      }
      
    } catch (fileError) {
      console.error('File access error:', fileError)
      return { success: false, error: 'File not accessible' }
    }
    
  } catch (error) {
    console.error('Error serving file by virtual ID:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Создать виртуальную ссылку для использования в JSON документах статей
 * @param fileId ID файла
 */
export async function createVirtualFileLink(fileId: number): Promise<string> {
  return `virtual://file-${fileId}`
}

/**
 * Создать виртуальную ссылку для папки
 * @param folderId ID папки
 */
export async function createVirtualFolderLink(folderId: number): Promise<string> {
  return `virtual://folder-${folderId}`
}
