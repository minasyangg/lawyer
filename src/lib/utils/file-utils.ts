import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'
import { uploadToS3, generateS3Key } from './s3-utils'

export const UPLOAD_DIR = join(process.cwd(), 'public/uploads')
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop()
  const timestamp = Date.now()
  const random = crypto.randomBytes(6).toString('hex')
  return `${timestamp}_${random}.${ext}`
}

export function isAllowedFileType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType) || ALLOWED_DOCUMENT_TYPES.includes(mimeType)
}

export function isImageFile(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType)
}

export async function saveFile(buffer: Buffer, filename: string, userId: number, folderPath?: string): Promise<string> {
  // Строим путь к папке пользователя
  let targetDir = join(UPLOAD_DIR, `user_${userId}`)
  let relativeDir = `uploads/user_${userId}`
  
  // Если указан путь к подпапке, добавляем его
  if (folderPath) {
    targetDir = join(targetDir, folderPath)
    relativeDir = join(relativeDir, folderPath).replace(/\\/g, '/')
  }
  
  // Создаем все необходимые папки
  await mkdir(targetDir, { recursive: true })
  
  const filePath = join(targetDir, filename)
  await writeFile(filePath, buffer)
  
  // Возвращаем относительный путь от public для статических файлов
  const relativePath = `${relativeDir}/${filename}`.replace(/\\/g, '/')
  return relativePath
}

/**
 * Проверяет, доступно ли S3 хранилище
 */
function isS3Available(): boolean {
  return !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_BUCKET_NAME &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY
  )
}

/**
 * Универсальная функция сохранения файла
 * В продакшене загружает в S3, локально - в файловую систему
 */
export async function saveFileUniversal(
  buffer: Buffer, 
  filename: string, 
  userId: number, 
  mimeType: string,
  folderPath?: string
): Promise<string> {
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    S3_ENDPOINT: !!process.env.S3_ENDPOINT,
    S3_BUCKET_NAME: !!process.env.S3_BUCKET_NAME,
    S3_ACCESS_KEY_ID: !!process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: !!process.env.S3_SECRET_ACCESS_KEY,
    isS3Available: isS3Available()
  })

  // Используем S3 если это продакшн И S3 настроен
  if (process.env.NODE_ENV === 'production' && isS3Available()) {
    console.log('Using S3 storage for file upload')
    try {
      const s3Key = generateS3Key(userId, filename, folderPath)
      const s3Url = await uploadToS3(buffer, s3Key, mimeType)
      console.log('S3 upload successful:', s3Url)
      return s3Url
    } catch (error) {
      console.error('S3 upload failed:', error)
      throw error
    }
  } else {
    // Локально используем существующую логику
    console.log('Using local filesystem for file upload')
    return await saveFile(buffer, filename, userId, folderPath)
  }
}

export function getUserUploadPath(userId: number): string {
  return join(UPLOAD_DIR, `user_${userId}`)
}

/**
 * Получает физический путь к папке по её ID
 */
export async function getFolderPhysicalPath(folderId: number | null): Promise<string | null> {
  if (!folderId) return null
  
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    const pathParts: string[] = []
    let currentFolderId: number | null = folderId
    
    while (currentFolderId) {
      const folder: { name: string; parentId: number | null } | null = await prisma.folder.findUnique({
        where: { id: currentFolderId },
        select: { name: true, parentId: true }
      })
      
      if (!folder) break
      
      pathParts.unshift(folder.name)
      currentFolderId = folder.parentId
    }
    
    return pathParts.length > 0 ? pathParts.join('/') : null
  } finally {
    await prisma.$disconnect()
  }
}

export function getPublicFileUrl(filePath: string): string {
  // Если это уже полный URL (S3), возвращаем как есть
  if (filePath.startsWith('https://') || filePath.startsWith('http://')) {
    return filePath
  }
  
  // Если путь уже относительный (начинается с uploads/), просто добавляем слеш
  if (filePath.startsWith('uploads/')) {
    return '/' + filePath
  }
  
  // Если абсолютный путь, преобразуем в относительный
  const publicDir = join(process.cwd(), 'public')
  let relativePath = filePath.replace(publicDir, '')
  
  // Убираем начальный слеш если есть и добавляем правильный
  relativePath = relativePath.replace(/^[\\/]/, '')
  
  // Заменяем Windows backslashes на forward slashes
  const url = '/' + relativePath.replace(/\\/g, '/')
  
  return url
}