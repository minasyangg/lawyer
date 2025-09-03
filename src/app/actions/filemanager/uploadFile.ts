"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { generateFileName, saveFile, getPublicFileUrl } from '@/lib/utils/file-utils'

const prisma = new PrismaClient()

export interface UploadResult {
  success: boolean
  files: {
    id: number
    originalName: string
    filename: string
    url: string
    size: number
    mimeType: string
    createdAt: string
  }[]
  error?: string
}

/**
 * Загрузка файлов в папку пользователя
 * @param formData FormData с файлами и folderId
 */
export async function uploadFile(formData: FormData): Promise<UploadResult> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return { success: false, files: [], error: 'Unauthorized' }
    }

    const user = JSON.parse(sessionCookie.value)

    if (!user?.id) {
      return { success: false, files: [], error: 'User not found' }
    }

    const folderIdRaw = formData.get('folderId')
    const folderId = folderIdRaw ? Number(folderIdRaw) : null
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return { success: false, files: [], error: 'No files provided' }
    }

    // Проверяем существование папки если указана
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          ownerId: user.id
        }
      })

      if (!folder) {
        return { success: false, files: [], error: 'Folder not found' }
      }
    }

    const savedFiles = []

    for (const file of files) {
      // Генерируем уникальное имя файла
      const filename = generateFileName(file.name)
      
      // Сохраняем файл на диск
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const relativePath = await saveFile(buffer, filename, user.id)
      
      // Создаем запись в базе данных
      const dbFile = await prisma.file.create({
        data: {
          originalName: file.name,
          filename: filename,
          path: relativePath,
          mimeType: file.type,
          size: file.size,
          uploadedBy: user.id,
          folderId: folderId,
        },
      })

      savedFiles.push({
        id: dbFile.id,
        originalName: dbFile.originalName,
        filename: dbFile.filename,
        url: getPublicFileUrl(dbFile.path),
        size: dbFile.size,
        mimeType: dbFile.mimeType,
        createdAt: dbFile.createdAt.toISOString(),
      })
    }

    return { success: true, files: savedFiles }

  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, files: [], error: 'Failed to upload files' }
  }
}
