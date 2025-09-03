import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Типы для виртуальных путей
export interface VirtualFileData {
  id: number
  virtualId?: string
  originalName: string
  virtualPath: string
  mimeType: string
  size: number
}

export interface VirtualFolderData {
  id: number
  virtualId?: string
  name: string
  virtualPath: string
}

/**
 * Генерирует виртуальный путь для папки на основе иерархии с учетом пользователя
 */
export async function generateVirtualPath(folderId: number | null, ownerId?: number): Promise<string> {
  if (!folderId) {
    if (ownerId) {
      return `/user_${ownerId}`
    }
    return '/'
  }
  
  const pathParts: string[] = []
  let currentFolderId: number | null = folderId
  let folderOwnerId: number | null = null
  
  while (currentFolderId) {
    const folder: { name: string; parentId: number | null; ownerId: number } | null = await prisma.folder.findUnique({
      where: { id: currentFolderId },
      select: { name: true, parentId: true, ownerId: true }
    })
    
    if (!folder) break
    
    pathParts.unshift(folder.name)
    if (!folderOwnerId) folderOwnerId = folder.ownerId
    currentFolderId = folder.parentId
  }
  
  const userPrefix = folderOwnerId ? `/user_${folderOwnerId}` : (ownerId ? `/user_${ownerId}` : '')
  return userPrefix + '/' + pathParts.join('/')
}

/**
 * Обновляет виртуальные пути для всех дочерних папок и файлов
 * (Временно используем path поле до применения миграции)
 */
export async function updateChildrenVirtualPaths(folderId: number, newVirtualPath: string) {
  // Получаем дочерние папки
  const childFolders = await prisma.folder.findMany({
    where: { parentId: folderId },
    include: { files: true }
  })
  
  for (const childFolder of childFolders) {
    const childVirtualPath = `${newVirtualPath}/${childFolder.name}`
    
    // Рекурсивно обновляем дочерние папки
    await updateChildrenVirtualPaths(childFolder.id, childVirtualPath)
  }
}

/**
 * Создает виртуальный URL для файла используя virtualId
 */
export function createVirtualFileUrl(virtualId: string): string {
  return `/api/files/${virtualId}` // Правильный путь к API route
}

/**
 * Парсит виртуальные пути из JSON документов статьи и заменяет их на реальные URL
 */
export async function resolveArticleDocuments(documents: unknown): Promise<unknown> {
  if (!documents || typeof documents !== 'object') return documents
  
  if (Array.isArray(documents)) {
    return Promise.all(documents.map(doc => resolveArticleDocuments(doc)))
  }
  
  const resolved = { ...documents as Record<string, unknown> }
  
  for (const [key, value] of Object.entries(documents as Record<string, unknown>)) {
    if (typeof value === 'string' && value.startsWith('virtual://')) {
      // Извлекаем ID из virtual://file-123 или virtual://folder-456
      const match = value.match(/virtual:\/\/(file|folder)-(\d+)/)
      if (match) {
        const [, type, id] = match
        const numericId = parseInt(id, 10)
        
        if (type === 'file') {
          // Получаем файл по ID и используем его virtualId
          const file = await prisma.file.findUnique({
            where: { id: numericId },
            select: { virtualId: true }
          })
          
          if (file?.virtualId) {
            resolved[key] = createVirtualFileUrl(file.virtualId)
          }
        } else if (type === 'folder') {
          // Получаем папку по ID и используем её virtualId
          const folder = await prisma.folder.findUnique({
            where: { id: numericId },
            select: { virtualId: true }
          })
          
          if (folder?.virtualId) {
            resolved[key] = `/files/folder/${folder.virtualId}`
          }
        }
      }
    } else if (typeof value === 'object') {
      resolved[key] = await resolveArticleDocuments(value)
    }
  }
  
  return resolved
}
