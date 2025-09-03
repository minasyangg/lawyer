"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { createVirtualFileUrl } from '@/lib/virtualPaths'

const prisma = new PrismaClient()

export interface FileManagerItem {
  id: number
  originalName: string
  filename: string
  mimeType: string
  size: number
  createdAt: string
  url: string
  isFolder?: boolean
  path?: string
}

export interface ListFilesResult {
  files: FileManagerItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

/**
 * Получить список файлов и папок для пользователя и выбранной папки
 * @param folderId id папки (null — корень)
 * @param page номер страницы
 * @param limit количество элементов на странице
 */
export async function listFiles(
  folderId: number | null = null, 
  page: number = 1, 
  limit: number = 20
): Promise<ListFilesResult> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      throw new Error('Unauthorized')
    }

    const user = JSON.parse(sessionCookie.value)

    if (!user?.id) {
      throw new Error('User not found')
    }

    const skip = (page - 1) * limit

    const where = {
      uploadedBy: user.id,
      ...(folderId ? { folderId: folderId } : { folderId: null })
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
          ...(folderId ? { parentId: folderId } : { parentId: null })
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.file.count({ where }),
      prisma.folder.count({
        where: {
          ownerId: user.id,
          ...(folderId ? { parentId: folderId } : { parentId: null })
        }
      })
    ])

    const filesWithUrls = files.map(file => ({
      id: file.id,
      originalName: file.originalName,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      createdAt: file.createdAt.toISOString(),
      url: file.virtualId ? createVirtualFileUrl(file.virtualId) : `/api/files/${file.id}` // Используем virtualId если есть или API route
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

    return {
      files: allItems,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    }

  } catch (error) {
    console.error('Files fetch error:', error)
    throw error
  }
}
