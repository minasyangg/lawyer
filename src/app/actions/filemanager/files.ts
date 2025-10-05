"use server"

import { createFileManagerProvider } from '@/lib/filemanager/factory'
import { FileListFilters } from '@/lib/filemanager/types'
import { revalidatePath } from 'next/cache'

/**
 * Server Action для получения списка файлов
 */
export async function getFilesList(filters: FileListFilters = {}) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        files: [],
        permissions: null
      }
    }

    const result = await provider.listFiles(filters)

    return {
      success: result.success,
      files: result.data || [],
      error: result.error,
      permissions: provider.permissions
    }
  } catch (error) {
    console.error('getFilesList error:', error)
    return {
      success: false,
      error: 'Internal server error',
      files: [],
      permissions: null
    }
  }
}

/**
 * Server Action для загрузки файлов
 */
export async function uploadFiles(formData: FormData) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        files: []
      }
    }

    const files = formData.getAll('files') as File[]
    const folderId = formData.get('folderId') ? parseInt(formData.get('folderId') as string) : undefined

    if (!files.length) {
      return {
        success: false,
        error: 'No files provided',
        files: []
      }
    }

    const result = await provider.uploadFiles(files, folderId)

    // Обновляем кэш страниц, которые могут показывать файлы
    if (result.success) {
      revalidatePath('/admin/files')
      revalidatePath('/editor/files')
      revalidatePath('/admin/articles')
      revalidatePath('/editor/articles')
    }

    return {
      success: result.success,
      files: result.files,
      error: result.error,
      permissions: provider.permissions
    }
  } catch (error) {
    console.error('uploadFiles error:', error)
    return {
      success: false,
      error: 'Internal server error',
      files: []
    }
  }
}

/**
 * Server Action для удаления файла
 */
export async function deleteFile(fileId: number) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        deletedIds: []
      }
    }

    const result = await provider.deleteFile(fileId)

    // Обновляем кэш после удаления
    if (result.success) {
      revalidatePath('/admin/files')
      revalidatePath('/editor/files')
      revalidatePath('/admin/articles')
      revalidatePath('/editor/articles')
    }

    return {
      success: result.success,
      deletedIds: result.deletedIds,
      error: result.error,
      permissions: provider.permissions
    }
  } catch (error) {
    console.error('deleteFile error:', error)
    return {
      success: false,
      error: 'Internal server error',
      deletedIds: []
    }
  }
}

/**
 * Server Action для удаления нескольких файлов
 */
export async function deleteFiles(fileIds: number[]) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        deletedIds: []
      }
    }

    const result = await provider.deleteFiles(fileIds)

    // Обновляем кэш после удаления
    if (result.success && result.deletedIds.length > 0) {
      revalidatePath('/admin/files')
      revalidatePath('/editor/files')
      revalidatePath('/admin/articles')
      revalidatePath('/editor/articles')
    }

    return {
      success: result.success,
      deletedIds: result.deletedIds,
      error: result.error,
      permissions: provider.permissions
    }
  } catch (error) {
    console.error('deleteFiles error:', error)
    return {
      success: false,
      error: 'Internal server error',
      deletedIds: []
    }
  }
}

/**
 * Server Action для получения деталей файла
 */
export async function getFileDetails(fileId: number) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        file: null
      }
    }

    const result = await provider.getFileDetails(fileId)

    return {
      success: result.success,
      file: result.data || null,
      error: result.error,
      permissions: provider.permissions
    }
  } catch (error) {
    console.error('getFileDetails error:', error)
    return {
      success: false,
      error: 'Internal server error',
      file: null
    }
  }
}

/**
 * Server Action для получения URL файла
 */
export async function getFileUrl(fileId: number) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        url: null
      }
    }

    const result = await provider.getFileUrl(fileId)

    return {
      success: result.success,
      url: result.data || null,
      error: result.error
    }
  } catch (error) {
    console.error('getFileUrl error:', error)
    return {
      success: false,
      error: 'Internal server error',
      url: null
    }
  }
}

/**
 * Server Action для поиска файлов
 */
export async function searchFiles(query: string, filters: FileListFilters = {}) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        files: []
      }
    }

    const result = await provider.searchFiles(query, filters)

    return {
      success: result.success,
      files: result.data || [],
      error: result.error,
      permissions: provider.permissions
    }
  } catch (error) {
    console.error('searchFiles error:', error)
    return {
      success: false,
      error: 'Internal server error',
      files: []
    }
  }
}