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

// GET - получить тег по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const tagId = parseInt(idParam)
    
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        _count: {
          select: { articles: true }
        }
      }
    })

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    return NextResponse.json({ tag })

  } catch (error) {
    console.error('Tag fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch tag' }, { status: 500 })
  }
}

// PUT - обновить тег
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = JSON.parse(sessionCookie.value)

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id: idParam } = await params
    const tagId = parseInt(idParam)
    const body = await request.json()
    const { name, color } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const slug = generateSlug(name)

    // Проверяем уникальность (исключая текущий тег)
    const existingTag = await prisma.tag.findFirst({
      where: {
        AND: [
          { id: { not: tagId } },
          {
            OR: [
              { name: name },
              { slug: slug }
            ]
          }
        ]
      }
    })

    if (existingTag) {
      return NextResponse.json({ error: 'Tag with this name already exists' }, { status: 400 })
    }

    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        name,
        slug,
        color: color || null,
      }
    })

    return NextResponse.json({ success: true, tag })

  } catch (error) {
    console.error('Tag update error:', error)
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
  }
}

// DELETE - удалить тег
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = JSON.parse(sessionCookie.value)

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id: idParam } = await params
    const tagId = parseInt(idParam)

    // Проверяем существует ли тег и используется ли он
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        _count: {
          select: { articles: true }
        }
      }
    })

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    if (tag._count.articles > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete tag that is used in articles' 
      }, { status: 400 })
    }

    await prisma.tag.delete({
      where: { id: tagId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Tag deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}