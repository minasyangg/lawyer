"use server"

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { getStorageInfo } from '@/lib/utils/universal-file-utils'
import { validateAndProcessFolderName } from '@/lib/utils/folder-validation'
import { createFolderSchema } from '@/lib/validations/folder'
import { invalidateCache } from '@/lib/redis'

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
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!user?.id) {
      return { success: false, error: 'User not found' }
    }

    // Валидируем название папки с помощью Zod
    const validationResult = createFolderSchema.safeParse({
      name: name.trim(),
      parentId: parentId
    })

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || 'Недопустимое название папки'
      return { success: false, error: errorMessage }
    }

    const validatedName = validationResult.data.name

    // Получаем информацию о провайдере хранения
    const storageType = getStorageInfo()

    // Валидируем и обрабатываем название папки для файловой системы
    const validation = validateAndProcessFolderName(validatedName, storageType.provider as 'local' | 'supabase')
    
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error + (validation.suggestions ? ` Suggestions: ${validation.suggestions.join(', ')}` : '')
      }
    }
    
    const { safeName } = validation.data

    // Определяем путь к папке
    let fullPath: string
    let parentFolder = null

    if (parentId) {
      // Если есть родительская папка, создаем подпапку.
      // ADMIN может создавать подпапки в любой папке, остальные роли — только в своих
      // (та же модель прав, что и в listFiles.ts/getFolderTree.ts)
      parentFolder = await prisma.folder.findUnique({
        where: {
          id: parentId,
          ...(user.userRole === 'ADMIN' ? {} : { ownerId: user.id })
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
        name: safeName, // Используем безопасное название
        path: fullPath,
        ownerId: user.id,
        parentId: parentId || null
      }
    })

    // Создаем физические папки только для локального провайдера
    // В Supabase Storage папки создаются автоматически при загрузке файлов
    const storageData = getStorageInfo()

    if (storageData.isLocal) {
      // Создаем физическую папку только для локального хранилища
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      const physicalPath = join(uploadsDir, fullPath)

      await mkdir(physicalPath, { recursive: true })
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

    // Invalidate cache after successful creation
    await invalidateCache(`files:*`)
    await invalidateCache(`files:tree:*`)

    return {
      success: true,
      folder: folderResult
    }

  } catch (error) {
    console.error('Create folder error:', error)
    return { success: false, error: 'Failed to create folder' }
  }
}
