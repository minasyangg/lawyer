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

      // Проверяем связи файла со статьями через ArticleFile
      const articleFile = await prisma.articleFile.findFirst({
        where: {
          fileId: fileId,
          articleId: article.id
        }
      })
      
      if (articleFile) {
        usedIn.push({
          id: article.id,
          title: article.title,
          type: 'document'
        })
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
 * Проверяет использование нескольких файлов одновременно (оптимизированная версия)
 * @param fileIds массив ID файлов для проверки
 * @returns объект с информацией об использовании каждого файла
 */
export async function checkMultipleFilesUsage(fileIds: number[]) {
  try {
    if (fileIds.length === 0) {
      return {}
    }

    const results: Record<number, { isUsed: boolean; usedIn: Array<{ id: number; title: string; type: 'content' | 'document' }> }> = {}
    
    // Инициализируем результаты
    fileIds.forEach(fileId => {
      results[fileId] = { isUsed: false, usedIn: [] }
    })

    // Получаем файлы одним запросом
    const files = await prisma.file.findMany({
      where: { id: { in: fileIds } },
      select: { id: true, filename: true, virtualId: true }
    })

    // Получаем все связи файлов со статьями одним запросом
    const articleFiles = await prisma.articleFile.findMany({
      where: { fileId: { in: fileIds } },
      include: {
        article: {
          select: { id: true, title: true }
        }
      }
    })

    // Обрабатываем связи файлов со статьями
    articleFiles.forEach(af => {
      if (!results[af.fileId].usedIn.some(u => u.id === af.article.id && u.type === 'document')) {
        results[af.fileId].usedIn.push({
          id: af.article.id,
          title: af.article.title,
          type: 'document'
        })
        results[af.fileId].isUsed = true
      }
    })

    // Получаем все статьи одним запросом (только те, которые могут содержать ссылки на файлы)
    const articles = await prisma.article.findMany({
      select: { id: true, title: true, content: true }
    })

    // Проверяем содержимое статей на наличие ссылок на файлы
    files.forEach(file => {
      articles.forEach(article => {
        if (!article.content) return

        let found = false

        // Проверяем ссылки через /api/files/[id]
        const fileIdPattern = new RegExp(`/api/files/${file.id}(?![0-9])`, 'g')
        if (fileIdPattern.test(article.content)) {
          found = true
        }

        // Проверяем виртуальные ссылки если есть virtualId
        if (!found && file.virtualId) {
          const virtualIdPattern = new RegExp(`/api/files/${file.virtualId}(?![a-zA-Z0-9_-])`, 'g')
          if (virtualIdPattern.test(article.content)) {
            found = true
          }
        }

        // Проверяем прямые ссылки на файл
        if (!found) {
          const filenamePattern = new RegExp(file.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
          if (filenamePattern.test(article.content)) {
            found = true
          }
        }

        if (found && !results[file.id].usedIn.some(u => u.id === article.id && u.type === 'content')) {
          results[file.id].usedIn.push({
            id: article.id,
            title: article.title,
            type: 'content'
          })
          results[file.id].isUsed = true
        }
      })
    })
    
    return results
  } catch (error) {
    console.error('Error checking multiple files usage:', error)
    return {}
  }
}
