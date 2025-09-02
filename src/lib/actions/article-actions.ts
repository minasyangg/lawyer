"use server"

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

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

const ArticleSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().optional(),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  published: z.boolean().optional(),
  categoryId: z.string().optional(),
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
    
    return {
      ...article,
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
    
    return {
      ...article,
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
  
  const validatedFields = ArticleSchema.safeParse({
    title,
    content: data.get('content'),
    excerpt: data.get('excerpt'),
    slug: data.get('slug') || generateSlug(title),
    published: data.get('published') === 'on',
    categoryId: data.get('categoryId') || undefined,
    authorId: data.get('authorId'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const { categoryId, authorId, ...articleData } = validatedFields.data
    
    await prisma.article.create({
      data: {
        ...articleData,
        categoryId: categoryId ? parseInt(categoryId) : null,
        authorId: parseInt(authorId),
        published: validatedFields.data.published || false,
      }
    })
    
    revalidatePath('/admin/articles')
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
  
  const validatedFields = ArticleSchema.safeParse({
    title,
    content: data.get('content'),
    excerpt: data.get('excerpt'),
    slug: data.get('slug') || generateSlug(title),
    published: data.get('published') === 'on',
    categoryId: data.get('categoryId') || undefined,
    authorId: data.get('authorId'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const { categoryId, authorId, ...articleData } = validatedFields.data
    
    await prisma.article.update({
      where: { id },
      data: {
        ...articleData,
        categoryId: categoryId ? parseInt(categoryId) : null,
        authorId: parseInt(authorId),
        published: validatedFields.data.published || false,
      }
    })
    
    revalidatePath('/admin/articles')
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
  try {
    await prisma.article.delete({
      where: { id }
    })
    
    revalidatePath('/admin/articles')
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
    revalidatePath('/publications')
    return { success: true }
  } catch (error) {
    console.error('Error toggling article published status:', error)
    return {
      errors: { general: ['Failed to update article'] }
    }
  }
}