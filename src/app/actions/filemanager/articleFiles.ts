'use server'

import { prisma } from '@/lib/prisma'
import { buildFilePath } from './getFilePath'

/**
 * Получает все файлы статьи с актуальными путями
 */
export async function getArticleFilesWithPaths(articleId: number) {
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

    if (!article || !article.files) {
      return { success: true, files: [] }
    }

    const filesWithPaths = []

    for (const articleFile of article.files) {
      const file = articleFile.file
      if (file) {
        const actualPath = await buildFilePath(file.id)
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
 * Исправляет сломанные ссылки в статьях - удаляет несуществующие файлы из связей ArticleFile
 */
export async function fixBrokenLinksInArticles() {
  try {
    // Находим все связи ArticleFile, где файл больше не существует
    const allArticleFiles = await prisma.articleFile.findMany({
      include: {
        file: true,
        article: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Фильтруем только те, где файл null (не существует)
    const brokenLinks = allArticleFiles.filter(af => !af.file)

    let fixedCount = 0
    const errors = []

    for (const brokenLink of brokenLinks) {
      try {
        // Удаляем сломанную связь
        await prisma.articleFile.delete({
          where: {
            articleId_fileId: {
              articleId: brokenLink.articleId,
              fileId: brokenLink.fileId
            }
          }
        })
        
        fixedCount++
        console.log(`Removed broken file link ${brokenLink.fileId} from article ${brokenLink.article.title}`)
      } catch (error) {
        errors.push(`Failed to fix article ${brokenLink.article.title}: ${error}`)
      }
    }

    return {
      success: true,
      message: `Fixed ${fixedCount} broken file links`,
      fixedCount,
      errors
    }
  } catch (error) {
    console.error('Error fixing broken links:', error)
    return {
      success: false,
      message: 'Failed to fix broken links',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
