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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id },
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

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const articleWithTags = {
      ...article,
      tags: article.tags.map(at => at.tag),
      documents: Array.isArray(article.documents) ? (article.documents as unknown as DocumentItem[]) : undefined
    }

    return NextResponse.json(articleWithTags)
  } catch (error) {
    console.error('Failed to fetch article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
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

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id }
    })

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Check if slug is taken by another article
    const slugTaken = await prisma.article.findFirst({
      where: {
        slug,
        NOT: { id }
      }
    })

    if (slugTaken) {
      return NextResponse.json(
        { error: 'Article with this slug already exists' },
        { status: 400 }
      )
    }

    // Update article with tags
    const article = await prisma.article.update({
      where: { id },
      data: {
        title,
        content,
        excerpt: excerpt || null,
        slug,
        published: published || false,
        categoryId: categoryId || null,
        documents: documents,
        tags: {
          deleteMany: {},
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

    return NextResponse.json(articleWithTags)
  } catch (error) {
    console.error('Failed to update article:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      )
    }

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id }
    })

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Delete article (tags will be deleted automatically due to cascade)
    await prisma.article.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}