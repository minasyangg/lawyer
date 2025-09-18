'use server'

import { prisma } from '@/lib/prisma'

/**
 * Вычисляет полный путь к файлу на основе иерархии папок
 */
export async function buildFilePath(fileId: number): Promise<string | null> {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        folder: {
          include: {
            parent: true
          }
        }
      }
    })

    if (!file) return null

    if (!file.folder) {
      // Файл в корневой директории
      return `uploads/${file.filename}`
    }

    // Строим путь от корня к файлу
    const folderPath = await buildFolderPath(file.folder.id)
    return `uploads/${folderPath}/${file.filename}`
  } catch (error) {
    console.error('Error building file path:', error)
    return null
  }
}

/**
 * Рекурсивно строит путь к папке
 */
export async function buildFolderPath(folderId: number): Promise<string> {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        parent: true
      }
    })

    if (!folder) return ''

    if (!folder.parent) {
      // Корневая папка
      return folder.name
    }

    // Рекурсивно строим путь
    const parentPath = await buildFolderPath(folder.parent.id)
    return `${parentPath}/${folder.name}`
  } catch (error) {
    console.error('Error building folder path:', error)
    return ''
  }
}

/**
 * Получает URL для отображения файла клиенту
 */
export async function getFileUrl(fileId: number): Promise<string | null> {
  const path = await buildFilePath(fileId)
  return path ? `/${path}` : null
}

/**
 * Получает все файлы в статье с их актуальными путями
 */
export async function getArticleFiles(articleId: number): Promise<Array<{
  id: number
  originalName: string
  filename: string
  mimeType: string
  size: number
  url: string
}>> {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        files: {
          include: {
            file: true
          }
        }
      }
    })

    if (!article || !article.files) return []

    const files = []

    for (const articleFile of article.files) {
      const file = articleFile.file
      if (file) {
        const url = await getFileUrl(file.id)
        if (url) {
          files.push({
            id: file.id,
            originalName: file.originalName,
            filename: file.filename,
            mimeType: file.mimeType,
            size: file.size,
            url
          })
        }
      }
    }

    return files
  } catch (error) {
    console.error('Error getting article files:', error)
    return []
  }
}
