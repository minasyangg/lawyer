import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'
import { uploadFile, createUserFilePath, generateUniqueFileName, getStorageInfo } from './universal-file-utils'

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

// Сохранение файла (устаревшая локальная версия, сохранена для совместимости)
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
 * Универсальная функция сохранения файла
 * Автоматически выбирает провайдер хранения в зависимости от конфигурации
 * Возвращает объект с логическим path и полным url
 */
export async function saveFileUniversalWithDetails(
  buffer: Buffer, 
  filename: string, 
  userId: number, 
  mimeType: string,
  folderPath?: string
): Promise<{ path: string; url: string }> {
  const storageInfo = getStorageInfo();
  console.log('saveFileUniversalWithDetails called with storage provider:', storageInfo.provider);
  
  try {
    // Создаем File объект из buffer через Uint8Array
    const uint8Array = new Uint8Array(buffer);
    const file = new File([uint8Array], filename, { type: mimeType });
    
    // Формируем логический путь для файла (БЕЗ домена)
    let logicalPath = createUserFilePath(userId, filename);
    
    // Если есть дополнительная папка, добавляем её
    if (folderPath) {
      logicalPath = `user_${userId}/${folderPath}/${generateUniqueFileName(filename)}`;
    }
    
    console.log('Uploading file to logical path:', logicalPath);
    
    // Загружаем файл через универсальную систему
    const result = await uploadFile(file, logicalPath);
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    
    console.log('File uploaded successfully, full URL:', result.url);
    
    return {
      path: logicalPath, // Логический путь без домена (для БД)
      url: result.url || result.path || '' // Полный URL для доступа
    };
    
  } catch (error) {
    console.error('saveFileUniversalWithDetails error:', error);
    
    // Fallback: если новая система не работает, используем старую логику
    if (storageInfo.isLocal) {
      console.log('Falling back to legacy saveFile method');
      const relativePath = await saveFile(buffer, filename, userId, folderPath);
      return {
        path: relativePath.replace(/^\/uploads\//, ''), // Убираем префикс для логического пути
        url: `/${relativePath}`
      };
    }
    
    throw error;
  }
}

/**
 * Универсальная функция сохранения файла (старая версия для обратной совместимости)
 * Автоматически выбирает провайдер хранения в зависимости от конфигурации
 */
export async function saveFileUniversal(
  buffer: Buffer, 
  filename: string, 
  userId: number, 
  mimeType: string,
  folderPath?: string
): Promise<string> {
  const result = await saveFileUniversalWithDetails(buffer, filename, userId, mimeType, folderPath);
  return result.url;
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