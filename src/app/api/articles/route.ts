import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

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