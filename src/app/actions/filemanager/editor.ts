"use server"

import { createFileManagerProvider } from '@/lib/filemanager/factory'
import { revalidatePath } from 'next/cache'

/**
 * Server Action для загрузки файла через RichTextEditor
 * Упрощенная версия для использования в редакторе текста
 */
export async function uploadFileForEditor(formData: FormData) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        file: null
      }
    }

    const file = formData.get('file') as File
    
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
        file: null
      }
    }

    // Валидация файла через provider
    const validation = provider.validateFileUpload(file)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        file: null
      }
    }

    const result = await provider.uploadFiles([file])

    if (result.success && result.files.length > 0) {
      const uploadedFile = result.files[0]
      
      // Получаем URL файла
      const urlResult = await provider.getFileUrl(uploadedFile.id)
      
      // Обновляем кэш
      revalidatePath('/admin/articles')
      revalidatePath('/editor/articles')

      return {
        success: true,
        file: {
          id: uploadedFile.id,
          url: urlResult.data || `/api/files/${uploadedFile.id}`,
          originalName: uploadedFile.originalName,
          mimeType: uploadedFile.mimeType,
          size: uploadedFile.size
        },
        error: null
      }
    } else {
      return {
        success: false,
        error: result.error || 'Upload failed',
        file: null
      }
    }
  } catch (error) {
    console.error('uploadFileForEditor error:', error)
    return {
      success: false,
      error: 'Internal server error',
      file: null
    }
  }
}

/**
 * Server Action для получения файлов для вставки в редактор
 * Возвращает только те файлы, которые пользователь может использовать
 */
export async function getFilesForEditor(filters: {
  folderId?: number
  mimeTypes?: string[]
  searchQuery?: string
  limit?: number
} = {}) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        files: []
      }
    }

    const result = await provider.listFiles({
      ...filters,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })

    if (result.success) {
      // Преобразуем файлы в формат для редактора
      const editorFiles = await Promise.all(
        (result.data || []).map(async (file) => {
          const urlResult = await provider.getFileUrl(file.id)
          return {
            id: file.id,
            url: urlResult.data || `/api/files/${file.id}`,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            createdAt: file.createdAt
          }
        })
      )

      return {
        success: true,
        files: editorFiles,
        error: null,
        permissions: provider.permissions
      }
    } else {
      return {
        success: false,
        error: result.error || 'Failed to load files',
        files: []
      }
    }
  } catch (error) {
    console.error('getFilesForEditor error:', error)
    return {
      success: false,
      error: 'Internal server error',
      files: []
    }
  }
}

/**
 * Server Action для проверки существования и доступности файла
 * Используется для валидации ссылок в контенте
 */
export async function validateFileAccess(fileId: number) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        hasAccess: false,
        error: 'Unauthorized'
      }
    }

    const hasAccess = await provider.canAccessFile(fileId)
    
    if (hasAccess) {
      const fileResult = await provider.getFileDetails(fileId)
      const urlResult = await provider.getFileUrl(fileId)
      
      if (fileResult.success && urlResult.success) {
        return {
          success: true,
          hasAccess: true,
          file: {
            id: fileResult.data!.id,
            url: urlResult.data!,
            originalName: fileResult.data!.originalName,
            mimeType: fileResult.data!.mimeType
          },
          error: null
        }
      }
    }

    return {
      success: true,
      hasAccess: false,
      file: null,
      error: null
    }
  } catch (error) {
    console.error('validateFileAccess error:', error)
    return {
      success: false,
      hasAccess: false,
      file: null,
      error: 'Internal server error'
    }
  }
}

/**
 * Server Action для получения пользовательских разрешений
 * Используется компонентами для определения доступных действий
 */
export async function getUserFilePermissions() {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        permissions: null,
        error: 'Unauthorized'
      }
    }

    return {
      success: true,
      permissions: {
        canUpload: provider.permissions.canUploadFiles,
        canDelete: provider.permissions.canDeleteOwnFiles,
        canViewAll: provider.permissions.canViewAllFiles,
        canManageFolders: provider.permissions.canManageFolders,
        maxFileSize: provider.permissions.maxFileSize,
        allowedTypes: provider.permissions.allowedMimeTypes
      },
      error: null
    }
  } catch (error) {
    console.error('getUserFilePermissions error:', error)
    return {
      success: false,
      permissions: null,
      error: 'Internal server error'
    }
  }
}