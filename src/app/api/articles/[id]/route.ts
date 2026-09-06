import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import { deleteArticle } from '@/lib/actions/article-actions'

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

    const currentUser = await getCurrentUser()
    // Без авторизации отдаём только опубликованные статьи и не палим email автора —
    // тот же принцип, что и в GET /api/articles (см. article-actions.ts getArticles()).
    const isStaff = currentUser?.userRole === 'ADMIN' || currentUser?.userRole === 'EDITOR'

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            ...(isStaff ? { email: true } : {}),
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
        },
        files: {
          include: {
            file: true
          }
        }
      }
    })

    if (!article || (!isStaff && !article.published)) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const articleWithTags = {
      ...article,
      tags: article.tags.map(at => at.tag),
      files: article.files.map(af => af.file)
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

export async function DELETE(
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

    // Делегируем в server action: там же единая логика прав доступа
    // (ADMIN — любая статья, EDITOR — только свои) и очистка связанных файлов.
    const result = await deleteArticle(id)

    if ('errors' in result) {
      const message = 'general' in result.errors ? result.errors.general[0] : 'Failed to delete article'
      const status = message === 'Authentication required' ? 401
        : message === 'Article not found' ? 404
        : message.includes('own articles') ? 403
        : 500
      return NextResponse.json({ error: message }, { status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}
