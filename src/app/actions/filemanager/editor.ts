"use server"

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import {
  saveFileUniversalWithDetails,
  generateFileName,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
} from '@/lib/utils/file-utils'
import { createVirtualFileUrl } from '@/lib/virtualPaths'
import { invalidateCache } from '@/lib/redis'

export interface UploadFileForEditorResult {
  success: boolean
  file: {
    id: number
    url: string
    originalName: string
    mimeType: string
    size: number
  } | null
  error: string | null
}

/**
 * Server Action для загрузки файла через RichTextEditor (TinyMCE) —
 * вставка изображений/документов прямо в контент статьи.
 * Использует ту же логику сохранения, что и основной uploadFile из файлового
 * менеджера (saveFileUniversalWithDetails), но без привязки к папке.
 */
export async function uploadFileForEditor(formData: FormData): Promise<UploadFileForEditorResult> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'Unauthorized', file: null }
    }

    const file = formData.get('file') as File | null

    if (!file) {
      return { success: false, error: 'No file provided', file: null }
    }

    // Валидация размера и типа — тот же набор правил, что и в uploadFile.ts
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        file: null,
      }
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `Тип файла "${file.type}" не поддерживается`,
        file: null,
      }
    }

    const filename = generateFileName(file.name)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileDetails = await saveFileUniversalWithDetails(buffer, filename, user.id, file.type)

    const { randomBytes } = await import('crypto')
    const virtualId = randomBytes(12).toString('base64url')

    const dbFile = await prisma.file.create({
      data: {
        originalName: file.name,
        filename,
        path: fileDetails.path,
        virtualPath: `/user_${user.id}`,
        virtualId,
        mimeType: file.type,
        size: file.size,
        uploadedBy: user.id,
      },
    })

    await invalidateCache('files:*')
    await invalidateCache('files:tree:*')

    return {
      success: true,
      error: null,
      file: {
        id: dbFile.id,
        url: dbFile.virtualId ? createVirtualFileUrl(dbFile.virtualId) : `/api/files/${dbFile.id}`,
        originalName: dbFile.originalName,
        mimeType: dbFile.mimeType,
        size: dbFile.size,
      },
    }
  } catch (error) {
    console.error('uploadFileForEditor error:', error)
    return {
      success: false,
      error: 'Internal server error',
      file: null,
    }
  }
}
