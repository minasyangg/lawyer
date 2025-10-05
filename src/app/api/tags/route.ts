import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// GET - получить все теги (без авторизации для чтения)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}

    const tags = await prisma.tag.findMany({
      where,
      include: {
        _count: {
          select: { articles: true }
        }
      },
      orderBy: { name: 'asc' },
      take: limit,
    })

    return NextResponse.json({ tags })

  } catch (error) {
    console.error('Tags fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

// POST - создать новый тег
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = JSON.parse(sessionCookie.value)

    if (!user || user.userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, color } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const slug = generateSlug(name)

    // Проверяем уникальность
    const existingTag = await prisma.tag.findFirst({
      where: {
        OR: [
          { name: name },
          { slug: slug }
        ]
      }
    })

    if (existingTag) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 400 })
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
        color: color || null,
      }
    })

    return NextResponse.json({ success: true, tag })

  } catch (error) {
    console.error('Tag creation error:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}