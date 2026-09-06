"use server"

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { resolveVirtualUrlsInContent } from '@/lib/virtualPaths'
import { canEditArticle, canDeleteArticle } from '@/lib/auth/permissions'
import { getCurrentUser } from '@/lib/auth/session'
import { generateSlug } from '@/lib/utils/slug-utils'
import { sanitizeArticleHtml } from '@/lib/utils/sanitize-html'

interface ActionError {
  errors: { [key: string]: string[] } | { general: string[] }
}

interface ActionSuccess {
  success: boolean
}

// Вспомогательная функция для обработки файлов статьи.
// Связи создаются батчем через createMany (skipDuplicates), а флаги isPublic/isProtected
// обновляются одним запросом updateMany — вместо последовательного цикла из 3 запросов на файл.
async function processArticleFiles(articleId: number, fileIds: number[]): Promise<void> {
  if (!fileIds || fileIds.length === 0) return

  const existingFiles = await prisma.file.findMany({
    where: { id: { in: fileIds } },
    select: { id: true }
  })
  const existingFileIds = existingFiles.map(f => f.id)

  if (existingFileIds.length === 0) return

  await prisma.articleFile.createMany({
    data: existingFileIds.map(fileId => ({ articleId, fileId })),
    skipDuplicates: true
  })

  await prisma.file.updateMany({
    where: { id: { in: existingFileIds } },
    data: { isProtected: true, isPublic: true }
  })
}

// Вспомогательная функция для парсинга fileIds из FormData
function parseFileIds(data: FormData): number[] {
  const fileIdValues = data.getAll('fileIds')
  if (!fileIdValues || fileIdValues.length === 0) return []

  return fileIdValues
    .map(id => parseInt(id as string, 10))
    .filter(id => !isNaN(id))
}

const ArticleSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().optional().or(z.literal('')).transform((val: string | undefined) => val || undefined),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  published: z.boolean().optional(),
  categoryId: z.string().optional().or(z.literal('')).transform((val: string | undefined) => val || undefined),
  authorId: z.string().min(1, 'Author is required'),
})

export type Article = {
  id: number
  title: string
  content: string
  excerpt: string | null
  slug: string
  published: boolean
  categoryId: number | null
  authorId: number
  createdAt: Date
  updatedAt: Date
  author: {
    id: number
    name: string
    email: string
  }
  category?: {
    id: number
    title: string
  } | null
  tags: {
    id: number
    name: string
    slug: string
    color: string | null
  }[]
  files: {
    id: number
    name: string
    originalName: string
    mimeType: string
    size: number
    virtualId: string
    isPublic: boolean
    isProtected: boolean
    createdAt: Date
  }[]
}

// Для листинга статей (таблицы в админке/редакторе) HTML-контент не используется —
// не запрашиваем его у БД, чтобы не гонять по сети потенциально большие поля.
export async function getArticles(): Promise<Article[]> {
  try {
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        published: true,
        categoryId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        files: {
          include: {
            file: true
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        category: {
          select: {
            id: true,
            title: true,
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return articles.map(article => ({
      ...article,
      content: '', // контент намеренно не запрашивается для листинга — используйте getArticleById для полной статьи
      tags: article.tags.map(at => at.tag),
      files: article.files.map(af => ({
        id: af.file.id,
        name: af.file.filename,
        originalName: af.file.originalName,
        mimeType: af.file.mimeType,
        size: af.file.size,
        virtualId: af.file.virtualId || '',
        isPublic: af.file.isPublic,
        isProtected: af.file.isProtected,
        createdAt: af.file.createdAt
      }))
    }))
  } catch (error) {
    console.error('Error fetching articles:', error)
    throw new Error('Failed to fetch articles')
  }
}

export async function getPublishedArticles(categoryId?: number, limit?: number): Promise<Article[]> {
  try {
    const articles = await prisma.article.findMany({
      where: {
        published: true,
        ...(categoryId ? { categoryId } : {})
      },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        slug: true,
        published: true,
        categoryId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        files: {
          include: {
            file: true
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        category: {
          select: {
            id: true,
            title: true,
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    
    return articles.map(article => ({
      ...article,
      tags: article.tags.map(at => at.tag),
      files: article.files.map(af => ({
        id: af.file.id,
        name: af.file.filename,
        originalName: af.file.originalName,
        mimeType: af.file.mimeType,
        size: af.file.size,
        virtualId: af.file.virtualId || '',
        isPublic: af.file.isPublic,
        isProtected: af.file.isProtected,
        createdAt: af.file.createdAt
      }))
    }))
  } catch (error) {
    console.error('Error fetching published articles:', error)
    throw new Error('Failed to fetch published articles')
  }
}

export async function getArticleById(id: number): Promise<Article | null> {
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        slug: true,
        published: true,
        categoryId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        files: {
          include: {
            file: true
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        category: {
          select: {
            id: true,
            title: true,
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
              }
            }
          }
        }
      }
    })
    
    if (!article) return null
    
    // Преобразуем виртуальные URL в контенте
    const resolvedContent = await resolveVirtualUrlsInContent(article.content)
    
    return {
      ...article,
      content: resolvedContent,
      tags: article.tags.map(at => at.tag),
      files: article.files.map(af => ({
        id: af.file.id,
        name: af.file.filename,
        originalName: af.file.originalName,
        mimeType: af.file.mimeType,
        size: af.file.size,
        virtualId: af.file.virtualId || '',
        isPublic: af.file.isPublic,
        isProtected: af.file.isProtected,
        createdAt: af.file.createdAt
      }))
    }
  } catch (error) {
    console.error('Error fetching article:', error)
    throw new Error('Failed to fetch article')
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const article = await prisma.article.findUnique({
      where: { slug, published: true },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        slug: true,
        published: true,
        categoryId: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        files: {
          include: {
            file: true
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        category: {
          select: {
            id: true,
            title: true,
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
              }
            }
          }
        }
      }
    })
    
    if (!article) return null
    
    // Преобразуем виртуальные URL в контенте
    const resolvedContent = await resolveVirtualUrlsInContent(article.content)
    
    return {
      ...article,
      content: resolvedContent,
      tags: article.tags.map(at => at.tag),
      files: article.files.map(af => ({
        id: af.file.id,
        name: af.file.filename,
        originalName: af.file.originalName,
        mimeType: af.file.mimeType,
        size: af.file.size,
        virtualId: af.file.virtualId || '',
        isPublic: af.file.isPublic,
        isProtected: af.file.isProtected,
        createdAt: af.file.createdAt
      }))
    }
  } catch (error) {
    console.error('Error fetching article by slug:', error)
    throw new Error('Failed to fetch article')
  }
}

export async function createArticle(data: FormData): Promise<ActionSuccess | ActionError> {
  const title = data.get('title') as string

  // Получаем текущего пользователя из сессии
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return {
      errors: { general: ['Authentication required'] }
    }
  }

  // Используем ID текущего авторизованного пользователя как автора статьи
  const authorId = currentUser.id.toString()

  const rawContent = (data.get('content') as string) || ''

  const validatedFields = ArticleSchema.safeParse({
    title,
    content: rawContent,
    excerpt: data.get('excerpt') || undefined, // Преобразуем null в undefined
    slug: data.get('slug') || generateSlug(title),
    published: data.get('published') === 'on',
    categoryId: data.get('categoryId') || undefined,
    authorId: authorId,
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const { categoryId, authorId: validatedAuthorId, content, ...articleData } = validatedFields.data

    // Создаем статью — HTML-контент санитизируется перед сохранением (защита от stored XSS)
    const article = await prisma.article.create({
      data: {
        ...articleData,
        content: sanitizeArticleHtml(content),
        categoryId: categoryId ? parseInt(categoryId) : null,
        authorId: parseInt(validatedAuthorId),
        published: validatedFields.data.published || false,
      }
    })

    // Обрабатываем связанные файлы
    const fileIds = parseFileIds(data)
    if (fileIds.length > 0) {
      await processArticleFiles(article.id, fileIds)
    }

    // Revalidate соответствующие пути в зависимости от роли
    if (currentUser.userRole === 'ADMIN') {
      revalidatePath('/admin/articles')
    } else if (currentUser.userRole === 'EDITOR') {
      revalidatePath('/editor/articles')
    }
    revalidatePath('/publications')
    return { success: true }
  } catch (error) {
    console.error('Error creating article:', error)
    return {
      errors: { general: ['Failed to create article'] }
    }
  }
}

export async function updateArticle(id: number, data: FormData): Promise<ActionSuccess | ActionError> {
  const title = data.get('title') as string
  
  // Получаем текущего пользователя из сессии
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    return {
      errors: { general: ['Authentication required'] }
    }
  }

  // Проверяем права на редактирование статьи
  const existingArticle = await prisma.article.findUnique({
    where: { id },
    select: { authorId: true }
  })

  if (!existingArticle) {
    return {
      errors: { general: ['Article not found'] }
    }
  }

  // EDITOR может редактировать только свои статьи, ADMIN может редактировать любые
  if (!canEditArticle(currentUser.userRole, currentUser.id, existingArticle.authorId)) {
    return {
      errors: { general: ['You can only edit your own articles'] }
    }
  }

  // Если это ADMIN, используем переданный authorId, если EDITOR - используем его ID
  const authorId = currentUser.userRole === 'ADMIN' && data.get('authorId') 
    ? data.get('authorId') as string
    : currentUser.id.toString()
  
  const validatedFields = ArticleSchema.safeParse({
    title,
    content: data.get('content'),
    excerpt: data.get('excerpt'),
    slug: data.get('slug') || generateSlug(title),
    published: data.get('published') === 'on',
    categoryId: data.get('categoryId') || undefined,
    authorId: authorId,
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const { categoryId, authorId: validatedAuthorId, content, ...articleData } = validatedFields.data

    // Получаем данные тегов
    const tagIds = data.getAll('tagIds').map(id => parseInt(id as string)).filter(id => !isNaN(id))

    // Обрабатываем файлы
    const newFileIds = parseFileIds(data)

    // Получаем текущие файлы статьи
    const currentFiles = await prisma.articleFile.findMany({
      where: { articleId: id },
      select: { fileId: true }
    })

    const currentFileIds = currentFiles.map(af => af.fileId)

    // Находим файлы для удаления и добавления
    const filesToRemove = currentFileIds.filter(id => !newFileIds.includes(id))
    const filesToAdd = newFileIds.filter(id => !currentFileIds.includes(id))

    // Обновляем статью — HTML-контент санитизируется перед сохранением (защита от stored XSS)
    await prisma.article.update({
      where: { id },
      data: {
        ...articleData,
        content: sanitizeArticleHtml(content),
        categoryId: categoryId ? parseInt(categoryId) : null,
        authorId: parseInt(validatedAuthorId),
        published: validatedFields.data.published || false,
        tags: {
          deleteMany: {}, // Удаляем все старые связи
          create: tagIds.map(tagId => ({
            tag: { connect: { id: tagId } }
          }))
        }
      }
    })

    // Обрабатываем удаление файлов (батчем вместо цикла)
    if (filesToRemove.length > 0) {
      await prisma.articleFile.deleteMany({
        where: { articleId: id, fileId: { in: filesToRemove } }
      })

      // Файлы, которые больше не используются ни в одной статье, снимаем с защиты
      const stillUsed = await prisma.articleFile.findMany({
        where: { fileId: { in: filesToRemove } },
        select: { fileId: true }
      })
      const stillUsedIds = new Set(stillUsed.map(af => af.fileId))
      const orphanedFileIds = filesToRemove.filter(fileId => !stillUsedIds.has(fileId))

      if (orphanedFileIds.length > 0) {
        await prisma.file.updateMany({
          where: { id: { in: orphanedFileIds } },
          data: { isProtected: false, isPublic: false }
        })
      }
    }

    // Обрабатываем добавление новых файлов
    if (filesToAdd.length > 0) {
      await processArticleFiles(id, filesToAdd)
    }

    // Revalidate соответствующие пути в зависимости от роли
    if (currentUser.userRole === 'ADMIN') {
      revalidatePath('/admin/articles')
    } else if (currentUser.userRole === 'EDITOR') {
      revalidatePath('/editor/articles')
    }
    revalidatePath('/publications')
    return { success: true }
  } catch (error) {
    console.error('Error updating article:', error)
    return {
      errors: { general: ['Failed to update article'] }
    }
  }
}

export async function deleteArticle(id: number): Promise<ActionSuccess | ActionError> {
  // Получаем текущего пользователя из сессии
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    return {
      errors: { general: ['Authentication required'] }
    }
  }

  // Проверяем права на удаление статьи
  const existingArticle = await prisma.article.findUnique({
    where: { id },
    select: { 
      authorId: true,
      files: {
        include: {
          file: true
        }
      }
    }
  })

  if (!existingArticle) {
    return {
      errors: { general: ['Article not found'] }
    }
  }

  // EDITOR может удалять только свои статьи, ADMIN может удалять любые
  if (!canDeleteArticle(currentUser.userRole, currentUser.id, existingArticle.authorId)) {
    return {
      errors: { general: ['You can only delete your own articles'] }
    }
  }

  try {
    const articleFileIds = existingArticle.files.map(af => af.file.id)

    // Удаляем статью (связи в ArticleFile удалятся автоматически через CASCADE)
    await prisma.article.delete({
      where: { id }
    })

    // Файлы, которые больше не используются ни в одной статье, снимаем с защиты
    if (articleFileIds.length > 0) {
      const stillUsed = await prisma.articleFile.findMany({
        where: { fileId: { in: articleFileIds } },
        select: { fileId: true }
      })
      const stillUsedIds = new Set(stillUsed.map(af => af.fileId))
      const orphanedFileIds = articleFileIds.filter(fileId => !stillUsedIds.has(fileId))

      if (orphanedFileIds.length > 0) {
        await prisma.file.updateMany({
          where: { id: { in: orphanedFileIds } },
          data: { isProtected: false, isPublic: false }
        })
      }
    }

    // Revalidate соответствующие пути в зависимости от роли
    if (currentUser.userRole === 'ADMIN') {
      revalidatePath('/admin/articles')
    } else if (currentUser.userRole === 'EDITOR') {
      revalidatePath('/editor/articles')
    }
    revalidatePath('/publications')
    return { success: true }
  } catch (error) {
    console.error('Error deleting article:', error)
    return {
      errors: { general: ['Failed to delete article'] }
    }
  }
}

export async function toggleArticlePublished(id: number): Promise<ActionSuccess | ActionError> {
  try {
    // Получаем текущего пользователя из сессии
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return {
        errors: { general: ['Authentication required'] }
      }
    }

    const article = await prisma.article.findUnique({
      where: { id }
    })

    if (!article) {
      return { errors: { general: ['Article not found'] } }
    }

    // EDITOR может публиковать/снимать с публикации только свои статьи, ADMIN — любые
    if (!canEditArticle(currentUser.userRole, currentUser.id, article.authorId)) {
      return {
        errors: { general: ['You can only publish/unpublish your own articles'] }
      }
    }

    await prisma.article.update({
      where: { id },
      data: { published: !article.published }
    })
    
    revalidatePath('/admin/articles')
    revalidatePath('/editor/articles')
    revalidatePath('/publications')
    return { success: true }
  } catch (error) {
    console.error('Error toggling article published status:', error)
    return {
      errors: { general: ['Failed to update article'] }
    }
  }
}

export async function getPublishedArticlesPaginated(
  categoryId?: number,
  page: number = 1,
  pageSize: number = 6
): Promise<{ items: Article[]; total: number }> {
  try {
    const where = {
      published: true,
      ...(categoryId ? { categoryId } : {})
    } as const

    const [total, articles] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          excerpt: true,
          slug: true,
          published: true,
          categoryId: true,
          authorId: true,
          createdAt: true,
          updatedAt: true,
          files: { include: { file: true } },
          author: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, title: true } },
          tags: {
            include: {
              tag: { select: { id: true, name: true, slug: true, color: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: Math.max(0, (Math.max(1, page) - 1) * pageSize),
        take: pageSize
      })
    ])

    const items = articles.map(article => ({
      ...article,
      tags: article.tags.map(at => at.tag),
      files: article.files.map(af => ({
        id: af.file.id,
        name: af.file.filename,
        originalName: af.file.originalName,
        mimeType: af.file.mimeType,
        size: af.file.size,
        virtualId: af.file.virtualId || '',
        isPublic: af.file.isPublic,
        isProtected: af.file.isProtected,
        createdAt: af.file.createdAt
      }))
    }))

    return { items, total }
  } catch (error) {
    console.error('Error fetching paginated published articles:', error)
    throw new Error('Failed to fetch paginated published articles')
  }
}