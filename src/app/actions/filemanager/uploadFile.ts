"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { saveFileUniversalWithDetails, generateFileName, getFolderPhysicalPath, MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from '@/lib/utils/file-utils'
import { generateVirtualPath, createVirtualFileUrl } from '@/lib/virtualPaths'
import { invalidateCache } from '@/lib/redis'

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

    console.log('🔍 Upload: User from session:', { id: user.id, email: user.email })

    // Проверяем, что пользователь существует в базе данных
    // Ищем по email, так как ID мог измениться после пересоздания БД
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, email: true, userRole: true }
    })

    console.log('🔍 Upload: User from database:', dbUser)

    if (!dbUser) {
      return { success: false, files: [], error: 'User not found in database' }
    }

    // Если ID в сессии не совпадает с ID в БД, обновляем сессию
    if (user.id !== dbUser.id) {
      console.log('🔄 Upload: Updating session with correct user ID:', dbUser.id)
      const updatedUser = { ...user, id: dbUser.id }
      const cookieStore = await cookies()
      cookieStore.set('admin-session', JSON.stringify(updatedUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    const folderIdRaw = formData.get('folderId')
    const folderId = folderIdRaw ? Number(folderIdRaw) : null
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return { success: false, files: [], error: 'No files provided' }
    }

    // Простая серверная валидация файлов перед загрузкой
    const validationErrors: string[] = []
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
    
    for (const file of files) {
      // Проверка размера
      if (file.size > MAX_FILE_SIZE) {
        validationErrors.push(`Файл "${file.name}" слишком большой. Максимальный размер: 10MB, размер файла: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      }
      
      // Проверка типа
      if (!allowedTypes.includes(file.type)) {
        validationErrors.push(`Тип файла "${file.type}" не поддерживается для файла "${file.name}"`)
      }
    }

    if (validationErrors.length > 0) {
      return { 
        success: false, 
        files: [], 
        error: `Ошибки валидации файлов:\n${validationErrors.join('\n')}` 
      }
    }

    // Проверяем существование папки если указана
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          ownerId: dbUser.id
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
      const fileDetails = await saveFileUniversalWithDetails(buffer, filename, dbUser.id, file.type, folderPhysicalPath || undefined)
      
      // Генерируем виртуальный путь для файла
      const virtualPath = folderId ? await generateVirtualPath(folderId) : `/user_${dbUser.id}`
      
      // Генерируем уникальный virtualId
      const { randomBytes } = await import('crypto')
      const virtualId = randomBytes(12).toString('base64url')
      
      // Создаем запись в базе данных
      console.log('🔍 Upload: Creating file record with uploadedBy:', dbUser.id)
      const dbFile = await prisma.file.create({
        data: {
          originalName: file.name,
          filename: filename,
          path: fileDetails.path,    // Логический путь в storage (без домена)
          virtualPath: virtualPath,
          virtualId: virtualId,
          mimeType: file.type,
          size: file.size,
          uploadedBy: dbUser.id,
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

    // Invalidate cache after successful upload
    await invalidateCache(`files:*`)
    await invalidateCache(`files:tree:*`)

    return { success: true, files: savedFiles }

  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, files: [], error: 'Failed to upload files' }
  }
}
