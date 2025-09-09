"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { saveFileUniversalWithDetails, generateFileName, getFolderPhysicalPath } from '@/lib/utils/file-utils'
import { generateVirtualPath, createVirtualFileUrl } from '@/lib/virtualPaths'

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
      
      // Получаем физический путь к папке для сохранения
      const folderPhysicalPath = await getFolderPhysicalPath(folderId)
      
      // Сохраняем файл на диск с учетом структуры папок
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const fileDetails = await saveFileUniversalWithDetails(buffer, filename, user.id, file.type, folderPhysicalPath || undefined)
      
      // Генерируем виртуальный путь для файла
      const virtualPath = folderId ? await generateVirtualPath(folderId) : `/user_${user.id}`
      
      // Генерируем уникальный virtualId
      const { randomBytes } = await import('crypto')
      const virtualId = randomBytes(12).toString('base64url')
      
      // Создаем запись в базе данных
      const dbFile = await prisma.file.create({
        data: {
          originalName: file.name,
          filename: filename,
          path: fileDetails.path,    // Логический путь в storage (без домена)
          virtualPath: virtualPath,
          virtualId: virtualId,
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
        url: dbFile.virtualId ? createVirtualFileUrl(dbFile.virtualId) : `/api/files/${dbFile.id}`, // Используем виртуальный URL или API route
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
