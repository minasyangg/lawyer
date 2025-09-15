import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

interface DocumentItem {
  id: number
  name: string
  url: string
  size: number
  mimeType: string
}

const prisma = new PrismaClient()

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      include: {
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
    
    const articlesWithTags = articles.map(article => ({
      ...article,
      tags: article.tags.map(at => at.tag),
      documents: Array.isArray(article.documents) ? (article.documents as unknown as DocumentItem[]) : undefined
    }))
    
    return NextResponse.json({ articles: articlesWithTags })
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = JSON.parse(sessionCookie.value)

    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json(
        { error: 'Admin or Editor access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, content, excerpt, slug, published, categoryId, tagIds = [], documents = null } = body

    if (!title || !content || !slug) {
      return NextResponse.json(
        { error: 'Title, content and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingArticle = await prisma.article.findUnique({
      where: { slug }
    })

    if (existingArticle) {
      return NextResponse.json(
        { error: 'Article with this slug already exists' },
        { status: 400 }
      )
    }

    const article = await prisma.article.create({
      data: {
        title,
        content,
        excerpt: excerpt || null,
        slug,
        published: published || false,
        categoryId: categoryId || null,
        authorId: user.id,
        documents: documents,
        tags: {
          create: tagIds.map((tagId: number) => ({
            tagId
          }))
        }
      },
      include: {
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

    const articleWithTags = {
      ...article,
      tags: article.tags.map(at => at.tag),
      documents: Array.isArray(article.documents) ? (article.documents as unknown as DocumentItem[]) : undefined
    }

    return NextResponse.json(articleWithTags, { status: 201 })
  } catch (error) {
    console.error('Failed to create article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}