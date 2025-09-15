"use server"

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { resolveVirtualUrlsInContent } from '@/lib/virtualPaths'
import { cookies } from 'next/headers'

interface DocumentItem {
  id: number
  name: string
  url: string
  size: number
  mimeType: string
}

interface ActionError {
  errors: { [key: string]: string[] } | { general: string[] }
}

interface ActionSuccess {
  success: boolean
}

const prisma = new PrismaClient()

// Вспомогательная функция для получения текущего пользователя из сессии
async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin-session')
  
  if (!sessionCookie?.value) {
    return null
  }

  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

const ArticleSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().optional(),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  published: z.boolean().optional(),
  categoryId: z.string().optional(),
  authorId: z.string().min(1, 'Author is required'),
})

// Схема для создания статьи без указания автора (будет получен из сессии)
const ArticleCreateSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().optional(),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  published: z.boolean().optional(),
  categoryId: z.string().optional(),
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
  documents?: DocumentItem[]
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
        documents: true,
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
      documents: Array.isArray(article.documents) ? (article.documents as unknown as DocumentItem[]) : undefined
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
        documents: true,
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
      documents: Array.isArray(article.documents) ? (article.documents as unknown as DocumentItem[]) : undefined
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
        documents: true,
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
      documents: Array.isArray(article.documents) ? (article.documents as unknown as DocumentItem[]) : undefined
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
        documents: true,
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
      documents: Array.isArray(article.documents) ? (article.documents as unknown as DocumentItem[]) : undefined
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
  const title = data.get('title') as string
  
  // Получаем текущего пользователя из сессии
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    return {
      errors: { general: ['Authentication required'] }
    }
  }

  // Если это ADMIN, используем переданный authorId, если EDITOR - используем его ID
  const authorId = currentUser.role === 'ADMIN' && data.get('authorId') 
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
    
    await prisma.article.create({
      data: {
        ...articleData,
        categoryId: categoryId ? parseInt(categoryId) : null,
        authorId: parseInt(validatedAuthorId),
        published: validatedFields.data.published || false,
      }
    })
    
    // Revalidate соответствующие пути в зависимости от роли
    if (currentUser.role === 'ADMIN') {
      revalidatePath('/admin/articles')
    } else if (currentUser.role === 'EDITOR') {
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
  if (currentUser.role === 'EDITOR' && existingArticle.authorId !== currentUser.id) {
    return {
      errors: { general: ['You can only edit your own articles'] }
    }
  }

  // Если это ADMIN, используем переданный authorId, если EDITOR - используем его ID
  const authorId = currentUser.role === 'ADMIN' && data.get('authorId') 
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
    
    // Получаем данные тегов и документов
    const tagIds = data.getAll('tagIds').map(id => parseInt(id as string)).filter(id => !isNaN(id))
    const documentsData = data.get('documents')
    const documents = documentsData ? JSON.parse(documentsData as string) : null
    
    await prisma.article.update({
      where: { id },
      data: {
        ...articleData,
        categoryId: categoryId ? parseInt(categoryId) : null,
        authorId: parseInt(validatedAuthorId),
        published: validatedFields.data.published || false,
        documents: documents,
        tags: {
          deleteMany: {}, // Удаляем все старые связи
          create: tagIds.map(tagId => ({
            tag: { connect: { id: tagId } }
          }))
        }
      }
    })
    
    // Revalidate соответствующие пути в зависимости от роли
    if (currentUser.role === 'ADMIN') {
      revalidatePath('/admin/articles')
    } else if (currentUser.role === 'EDITOR') {
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
    select: { authorId: true }
  })

  if (!existingArticle) {
    return {
      errors: { general: ['Article not found'] }
    }
  }

  // EDITOR может удалять только свои статьи, ADMIN может удалять любые
  if (currentUser.role === 'EDITOR' && existingArticle.authorId !== currentUser.id) {
    return {
      errors: { general: ['You can only delete your own articles'] }
    }
  }

  try {
    await prisma.article.delete({
      where: { id }
    })
    
    // Revalidate соответствующие пути в зависимости от роли
    if (currentUser.role === 'ADMIN') {
      revalidatePath('/admin/articles')
    } else if (currentUser.role === 'EDITOR') {
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
    const article = await prisma.article.findUnique({
      where: { id }
    })
    
    if (!article) {
      return { errors: { general: ['Article not found'] } }
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