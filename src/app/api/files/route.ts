import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = JSON.parse(sessionCookie.value)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = {
      uploadedBy: user.id,
      ...(folderId ? { folderId: parseInt(folderId) } : { folderId: null })
    }

    const [files, totalCount] = await Promise.all([
      prisma.file.findMany({
        where,
        include: {
          folder: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.file.count({ where })
    ])

    const filesWithUrls = files.map(file => ({
      ...file,
      url: `/api/files/${file.id}`
    }))

    return NextResponse.json({
      files: filesWithUrls,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Files fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}