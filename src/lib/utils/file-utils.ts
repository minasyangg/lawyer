import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'

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

export async function saveFile(buffer: Buffer, filename: string, userId: number): Promise<string> {
  const userDir = join(UPLOAD_DIR, `user_${userId}`)
  await mkdir(userDir, { recursive: true })
  
  const filePath = join(userDir, filename)
  await writeFile(filePath, buffer)
  
  // Возвращаем относительный путь от public для статических файлов
  const relativePath = `uploads/user_${userId}/${filename}`
  return relativePath
}

export function getUserUploadPath(userId: number): string {
  return join(UPLOAD_DIR, `user_${userId}`)
}

export function getPublicFileUrl(filePath: string): string {
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