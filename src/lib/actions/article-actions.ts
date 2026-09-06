"use server"

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { resolveVirtualUrlsInContent } from '@/lib/virtualPaths'
import { canEditArticle } from '@/lib/auth/permissions'
import { getCurrentUser } from '@/lib/auth/session'

interface ActionError {
  errors: { [key: string]: string[] } | { general: string[] }
}

interface ActionSuccess {
  success: boolean
}

const prisma = new PrismaClient()

// Вспомогательная функция для получения текущего пользователя из сессии

// Вспомогательная функция для обработки файлов статьи
async function processArticleFiles(articleId: number, fileIds: number[]) {
  console.log(`🔄 [processArticleFiles] START - Article ID: ${articleId}, File IDs:`, fileIds)
  
  if (!fileIds || fileIds.length === 0) {
    console.log('❌ [processArticleFiles] No fileIds provided, skipping file processing')
    return
  }

  // Создаем связи между статьей и файлами
  for (const fileId of fileIds) {
    console.log(`[Article Files] Processing file ID: ${fileId}`)
    
    // Проверяем существование файла
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { id: true, originalName: true, isPublic: true, isProtected: true }
    })

    if (file) {
      console.log(`[Article Files] Found file: ${file.originalName} (ID: ${file.id})`)
      console.log(`[Article Files] Current flags - isPublic: ${file.isPublic}, isProtected: ${file.isProtected}`)
      
      // Проверяем, существует ли уже связь
      const existingLink = await prisma.articleFile.findUnique({
        where: {
          articleId_fileId: {
            articleId,
            fileId
          }
        }
      })

      if (!existingLink) {
        // Создаем связь
        await prisma.articleFile.create({
          data: {
            articleId,
            fileId
          }
        })
        console.log(`[Article Files] Created ArticleFile link for file ${fileId}`)
      } else {
        console.log(`[Article Files] ArticleFile link already exists for file ${fileId}`)
      }

      // Маркируем файл как защищенный и публичный
      console.log(`[Article Files] BEFORE UPDATE - File ${fileId}: isPublic=${file.isPublic}, isProtected=${file.isProtected}`)
      
      const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: {
          isProtected: true,
          isPublic: true
        }
      })

      console.log(`[Article Files] AFTER UPDATE - File ${fileId} (${file.originalName}):`)
      console.log(`[Article Files] - isPublic: ${file.isPublic} -> ${updatedFile.isPublic}`)
      console.log(`[Article Files] - isProtected: ${file.isProtected} -> ${updatedFile.isProtected}`)
      console.log(`[Article Files] Successfully updated file ${fileId} flags!`)
    } else {
      console.log(`❌ [Article Files] File with ID ${fileId} not found in database`)
    }
  }
  
  console.log(`✅ [processArticleFiles] COMPLETED - Processed ${fileIds.length} files for article ${articleId}`)
}

// Вспомогательная функция для парсинга fileIds из FormData
function parseFileIds(data: FormData): number[] {
  // Получаем все значения для ключа 'fileIds'
  const fileIdValues = data.getAll('fileIds')
  console.log('[Article Files] Raw fileIds from FormData:', fileIdValues)
  
  if (!fileIdValues || fileIdValues.length === 0) {
    console.log('[Article Files] No fileIds found in FormData')
    return []
  }

  try {
    // Преобразуем все значения в числа и фильтруем валидные
    const validIds = fileIdValues
      .map(id => parseInt(id as string, 10))
      .filter(id => !isNaN(id))
    console.log('[Article Files] Parsed fileIds:', validIds)
    return validIds
  } catch (error) {
    console.error('[Article Files] Error parsing fileIds:', error)
    return []
  }
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

export async function getArticles(): Promise<Article[]> {
  try {
    const articles = await prisma.article.findMany({
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
      orderBy: { createdAt: 'desc' }
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

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function createArticle(data: FormData): Promise<ActionSuccess | ActionError> {
  console.log('🚀 [CreateArticle] START - FormData keys:', Array.from(data.keys()))
  console.log('🚀 [CreateArticle] FormData values:', Object.fromEntries(data.entries()))
  
  const title = data.get('title') as string
  console.log('🚀 [CreateArticle] Title:', title)
  
  // Получаем текущего пользователя из сессии
  const currentUser = await getCurrentUser()
  console.log('🚀 [CreateArticle] Current user:', currentUser)
  
  if (!currentUser) {
    return {
      errors: { general: ['Authentication required'] }
    }
  }

  // Используем ID текущего авторизованного пользователя как автора статьи
  const authorId = currentUser.id.toString()
  
  console.log('🚀 [CreateArticle] Author ID:', authorId)
  
  const validationData = {
    title,
    content: data.get('content'),
    excerpt: data.get('excerpt') || undefined, // Преобразуем null в undefined
    slug: data.get('slug') || generateSlug(title),
    published: data.get('published') === 'on',
    categoryId: data.get('categoryId') || undefined,
    authorId: authorId,
  }
  
  console.log('🚀 [CreateArticle] Data for validation:', validationData)
  
  const validatedFields = ArticleSchema.safeParse(validationData)

  console.log('🚀 [CreateArticle] Validation result:', validatedFields.success)
  if (!validatedFields.success) {
    console.log('❌ [CreateArticle] Validation errors:', validatedFields.error.flatten().fieldErrors)
    console.log('❌ [CreateArticle] Validation issues:', validatedFields.error.issues)
  }

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const { categoryId, authorId: validatedAuthorId, ...articleData } = validatedFields.data
    
    // Создаем статью
    const article = await prisma.article.create({
      data: {
        ...articleData,
        categoryId: categoryId ? parseInt(categoryId) : null,
        authorId: parseInt(validatedAuthorId),
        published: validatedFields.data.published || false,
      }
    })

    // Обрабатываем связанные файлы
    const fileIds = parseFileIds(data)
    console.log(`[Create Article] Parsed fileIds for article ${article.id}:`, fileIds)
    
    if (fileIds.length > 0) {
      console.log(`[Create Article] Processing ${fileIds.length} files for article ${article.id}`)
      await processArticleFiles(article.id, fileIds)
    } else {
      console.log(`[Create Article] No files to process for article ${article.id}`)
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
    console.error('❌ [CreateArticle] Error creating article:', error)
    console.error('❌ [CreateArticle] Error stack:', error instanceof Error ? error.stack : 'Unknown error')
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
  if (currentUser.userRole === 'EDITOR' && existingArticle.authorId !== currentUser.id) {
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
    const { categoryId, authorId: validatedAuthorId, ...articleData } = validatedFields.data
    
    // Получаем данные тегов
    const tagIds = data.getAll('tagIds').map(id => parseInt(id as string)).filter(id => !isNaN(id))
    
    // Обрабатываем файлы
    const newFileIds = parseFileIds(data)
    
    // Получаем текущие файлы статьи
    const currentFiles = await prisma.articleFile.findMany({
      where: { articleId: id },
      include: { file: true }
    })
    
    const currentFileIds = currentFiles.map(af => af.fileId)
    
    // Находим файлы для удаления и добавления
    const filesToRemove = currentFileIds.filter(id => !newFileIds.includes(id))
    const filesToAdd = newFileIds.filter(id => !currentFileIds.includes(id))
    
    // Обновляем статью
    await prisma.article.update({
      where: { id },
      data: {
        ...articleData,
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

    // Обрабатываем удаление файлов
    for (const fileId of filesToRemove) {
      // Удаляем связь
      await prisma.articleFile.delete({
        where: { 
          articleId_fileId: { articleId: id, fileId } 
        }
      })

      // Проверяем, используется ли файл в других статьях
      const otherArticlesCount = await prisma.articleFile.count({
        where: { fileId }
      })

      if (otherArticlesCount === 0) {
        // Файл больше не используется, снимаем защиту
        await prisma.file.update({
          where: { id: fileId },
          data: {
            isProtected: false,
            isPublic: false
          }
        })
        console.log(`[Article Update] File ${fileId} no longer protected - removed from all articles`)
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
  if (currentUser.userRole === 'EDITOR' && existingArticle.authorId !== currentUser.id) {
    return {
      errors: { general: ['You can only delete your own articles'] }
    }
  }

  try {
    // Обрабатываем связанные файлы перед удалением статьи
    const articleFiles = existingArticle.files

    // Удаляем статью (связи в ArticleFile удалятся автоматически через CASCADE)
    await prisma.article.delete({
      where: { id }
    })

    // Обрабатываем файлы, которые были связаны со статьей
    for (const articleFile of articleFiles) {
      const file = articleFile.file
      
      // Проверяем, используется ли файл в других статьях
      const otherArticlesCount = await prisma.articleFile.count({
        where: { fileId: file.id }
      })

      if (otherArticlesCount === 0) {
        // Файл больше не используется ни в одной статье
        // Снимаем флаги isProtected и isPublic
        await prisma.file.update({
          where: { id: file.id },
          data: {
            isProtected: false,
            isPublic: false
          }
        })
        
        console.log(`[Article Delete] File ${file.id} (${file.originalName}) is no longer protected - not used in any articles`)
      } else {
        console.log(`[Article Delete] File ${file.id} (${file.originalName}) still used in ${otherArticlesCount} other articles`)
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

export async function createArticleForEditor(data: FormData, authorId: number): Promise<ActionSuccess | ActionError> {
  const title = data.get('title') as string
  
  const EditorArticleSchema = z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    excerpt: z.string().optional(),
    slug: z.string().min(2, 'Slug must be at least 2 characters'),
    published: z.boolean().optional(),
    categoryId: z.string().optional(),
  })
  
  const validatedFields = EditorArticleSchema.safeParse({
    title,
    content: data.get('content'),
    excerpt: data.get('excerpt'),
    slug: data.get('slug') || generateSlug(title),
    published: data.get('published') === 'on',
    categoryId: data.get('categoryId') || undefined,
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const { categoryId, ...articleData } = validatedFields.data
    
    await prisma.article.create({
      data: {
        ...articleData,
        categoryId: categoryId ? parseInt(categoryId) : null,
        authorId: authorId, // Автоматически устанавливаем из сессии
        published: validatedFields.data.published || false,
      }
    })
    
    revalidatePath('/editor/articles')
    revalidatePath('/publications')
    return { success: true }
  } catch (error) {
    console.error('Error creating article:', error)
    return {
      errors: { general: ['Failed to create article'] }
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