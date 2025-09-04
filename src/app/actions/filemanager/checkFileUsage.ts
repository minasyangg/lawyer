'use server'

import { prisma } from '@/lib/prisma'

/**
 * Проверяет, используется ли файл в статьях
 * @param fileId ID файла для проверки
 * @returns объект с информацией об использовании
 */
export async function checkFileUsage(fileId: number) {
  try {
    // Получаем файл
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return { isUsed: false, usedIn: [] }
    }

    // Получаем все статьи
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        documents: true
      }
    })

    const usedIn: Array<{ id: number; title: string; type: 'content' | 'document' }> = []

    for (const article of articles) {
      // Проверяем содержимое статьи на наличие ссылок на файл
      if (article.content) {
        // Проверяем ссылки через /api/files/[id]
        const fileIdPattern = new RegExp(`/api/files/${fileId}(?![0-9])`, 'g')
        
        // Проверяем виртуальные ссылки если есть virtualId
        let virtualIdPattern: RegExp | null = null
        if (file.virtualId) {
          virtualIdPattern = new RegExp(`/api/files/${file.virtualId}(?![a-zA-Z0-9_-])`, 'g')
        }

        // Проверяем прямые ссылки на файл
        const filenamePattern = new RegExp(file.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')

        if (fileIdPattern.test(article.content) || 
            (virtualIdPattern && virtualIdPattern.test(article.content)) ||
            filenamePattern.test(article.content)) {
          usedIn.push({
            id: article.id,
            title: article.title,
            type: 'content'
          })
        }
      }

      // Проверяем список документов статьи
      if (article.documents) {
        try {
          const documentIds = JSON.parse(article.documents as string) as number[]
          if (documentIds.includes(fileId)) {
            usedIn.push({
              id: article.id,
              title: article.title,
              type: 'document'
            })
          }
        } catch {
          // Игнорируем ошибки парсинга JSON
        }
      }
    }

    return {
      isUsed: usedIn.length > 0,
      usedIn
    }
  } catch (error) {
    console.error('Error checking file usage:', error)
    return { isUsed: false, usedIn: [] }
  }
}

/**
 * Проверяет использование нескольких файлов одновременно
 * @param fileIds массив ID файлов для проверки
 * @returns объект с информацией об использовании каждого файла
 */
export async function checkMultipleFilesUsage(fileIds: number[]) {
  try {
    const results: Record<number, { isUsed: boolean; usedIn: Array<{ id: number; title: string; type: 'content' | 'document' }> }> = {}
    
    for (const fileId of fileIds) {
      results[fileId] = await checkFileUsage(fileId)
    }
    
    return results
  } catch (error) {
    console.error('Error checking multiple files usage:', error)
    return {}
  }
}
