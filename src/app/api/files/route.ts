import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { getPublicFileUrl } from '@/lib/utils/file-utils'

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

    // Получаем файлы и папки
    const [files, folders, totalFilesCount, totalFoldersCount] = await Promise.all([
      prisma.file.findMany({
        where,
        include: {
          folder: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.folder.findMany({
        where: {
          ownerId: user.id,
          ...(folderId ? { parentId: parseInt(folderId) } : { parentId: null })
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.file.count({ where }),
      prisma.folder.count({
        where: {
          ownerId: user.id,
          ...(folderId ? { parentId: parseInt(folderId) } : { parentId: null })
        }
      })
    ])

    const filesWithUrls = files.map(file => ({
      ...file,
      url: getPublicFileUrl(file.path)
    }))

    // Преобразуем папки в формат FileItem
    const foldersAsFileItems = folders.map(folder => ({
      id: folder.id,
      originalName: folder.name,
      filename: folder.name,
      mimeType: 'folder',
      size: 0,
      createdAt: folder.createdAt.toISOString(),
      url: `/uploads/${folder.path}`,
      isFolder: true,
      path: folder.path
    }))

    // Объединяем папки и файлы
    const allItems = [...foldersAsFileItems, ...filesWithUrls]
    const totalCount = totalFilesCount + totalFoldersCount

    return NextResponse.json({
      files: allItems,
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