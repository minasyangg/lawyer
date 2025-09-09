"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { getStorageInfo } from '@/lib/utils/universal-file-utils'

const prisma = new PrismaClient()

export interface CreateFolderResult {
  success: boolean
  folder?: {
    id: number
    originalName: string
    filename: string
    mimeType: string
    size: number
    createdAt: string
    url: string
    isFolder: boolean
    path: string
  }
  error?: string
}

/**
 * Создать папку для пользователя
 * @param name название папки
 * @param parentId id родительской папки (null — корень)
 */
export async function createFolder(name: string, parentId: number | null = null): Promise<CreateFolderResult> {
  console.log('createFolder called with:', { name, parentId, storageProvider: process.env.STORAGE_PROVIDER })
  
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = JSON.parse(sessionCookie.value)

    if (!user?.id) {
      return { success: false, error: 'User not found' }
    }

    if (!name.trim()) {
      return { success: false, error: 'Folder name required' }
    }

    // Определяем путь к папке
    let fullPath: string
    let parentFolder = null
    
    if (parentId) {
      // Если есть родительская папка, создаем подпапку
      parentFolder = await prisma.folder.findUnique({
        where: { 
          id: parentId,
          ownerId: user.id // Проверяем права доступа к родительской папке
        },
        select: { path: true }
      })
      
      if (!parentFolder) {
        return { success: false, error: 'Parent folder not found' }
      }
      
      fullPath = `${parentFolder.path}/${name}`
    } else {
      // Корневая папка создается в пользовательской директории
      fullPath = `user_${user.id}/${name}`
    }

    // Создаем папку в базе данных
    const folder = await prisma.folder.create({
      data: {
        name,
        path: fullPath,
        ownerId: user.id,
        parentId: parentId || null
      }
    })

    // Создаем физические папки только для локального провайдера
    // В Supabase Storage папки создаются автоматически при загрузке файлов
    const storageInfo = getStorageInfo();
    console.log('Storage provider info:', storageInfo);
    
    if (storageInfo.isLocal) {
      console.log('Creating physical folder for local storage provider')
      // Создаем физическую папку только для локального хранилища
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      const physicalPath = join(uploadsDir, fullPath)
      
      await mkdir(physicalPath, { recursive: true })
    } else {
      console.log('Skipping physical folder creation (using cloud storage - folders created automatically)')
    }

    // Возвращаем папку в формате FileItem
    const folderResult = {
      id: folder.id,
      originalName: folder.name,
      filename: folder.name,
      mimeType: 'folder',
      size: 0,
      createdAt: folder.createdAt.toISOString(),
      url: `/uploads/${folder.path}`,
      isFolder: true,
      path: folder.path
    }

    return {
      success: true,
      folder: folderResult
    }

  } catch (error) {
    console.error('Create folder error:', error)
    return { success: false, error: 'Failed to create folder' }
  }
}
