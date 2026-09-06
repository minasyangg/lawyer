import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    // Без авторизации отдаём только опубликованные статьи и не палим email авторов.
    // ADMIN видит все статьи; EDITOR видит все статьи (как и в getArticles() из article-actions.ts).
    const isStaff = currentUser?.userRole === 'ADMIN' || currentUser?.userRole === 'EDITOR'

    const articles = await prisma.article.findMany({
      where: isStaff ? undefined : { published: true },
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
      },
      orderBy: { createdAt: 'desc' }
    })

    const articlesWithTags = articles.map(article => ({
      ...article,
      tags: article.tags.map(at => at.tag),
      files: article.files.map(af => af.file)
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
