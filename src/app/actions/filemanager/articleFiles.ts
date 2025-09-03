'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { buildFilePath } from './getFilePath'

/**
 * Получает все файлы статьи с актуальными путями
 */
export async function getArticleFilesWithPaths(articleId: number) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    })

    if (!article || !article.documents) {
      return { success: true, files: [] }
    }

    const documentIds = JSON.parse(article.documents as string) as number[]
    const filesWithPaths = []

    for (const fileId of documentIds) {
      const file = await prisma.file.findUnique({
        where: { id: fileId }
      })

      if (file) {
        const actualPath = await buildFilePath(fileId)
        filesWithPaths.push({
          id: file.id,
          originalName: file.originalName,
          filename: file.filename,
          mimeType: file.mimeType,
          size: file.size,
          url: actualPath ? `/${actualPath}` : null,
          isValid: !!actualPath
        })
      }
    }

    return {
      success: true,
      files: filesWithPaths
    }
  } catch (error) {
    console.error('Error getting article files:', error)
    return {
      success: false,
      error: 'Failed to get article files'
    }
  }
}

/**
 * Проверяет и исправляет битые ссылки в статьях
 */
export async function fixBrokenLinksInArticles() {
  try {
    const articles = await prisma.article.findMany({
      where: {
        documents: {
          not: Prisma.JsonNull
        }
      }
    })

    let fixedCount = 0
    const errors = []

    for (const article of articles) {
      try {
        const documentIds = JSON.parse(article.documents as string) as number[]
        const validIds = []

        for (const fileId of documentIds) {
          const file = await prisma.file.findUnique({
            where: { id: fileId }
          })

          if (file) {
            const actualPath = await buildFilePath(fileId)
            if (actualPath) {
              validIds.push(fileId)
            }
          }
        }

        // Обновляем статью только с валидными файлами
        if (validIds.length !== documentIds.length) {
          await prisma.article.update({
            where: { id: article.id },
            data: {
              documents: JSON.stringify(validIds)
            }
          })
          fixedCount++
        }
      } catch (error) {
        errors.push(`Article ${article.id}: ${error}`)
      }
    }

    return {
      success: true,
      fixedCount,
      errors
    }
  } catch (error) {
    console.error('Error fixing broken links:', error)
    return {
      success: false,
      error: 'Failed to fix broken links'
    }
  }
}
