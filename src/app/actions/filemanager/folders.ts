"use server"

import { createFileManagerProvider } from '@/lib/filemanager/factory'
import { revalidatePath } from 'next/cache'

/**
 * Server Action для получения списка папок
 */
export async function getFoldersList(parentId?: number) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        folders: [],
        permissions: null
      }
    }

    const result = await provider.listFolders(parentId)

    return {
      success: result.success,
      folders: result.data || [],
      error: result.error,
      permissions: provider.permissions
    }
  } catch (error) {
    console.error('getFoldersList error:', error)
    return {
      success: false,
      error: 'Internal server error',
      folders: [],
      permissions: null
    }
  }
}

/**
 * Server Action для получения дерева папок
 */
export async function getFoldersTree() {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        folders: [],
        permissions: null
      }
    }

    const result = await provider.getFolderTree()

    return {
      success: result.success,
      folders: result.data || [],
      error: result.error,
      permissions: provider.permissions
    }
  } catch (error) {
    console.error('getFoldersTree error:', error)
    return {
      success: false,
      error: 'Internal server error',
      folders: [],
      permissions: null
    }
  }
}

/**
 * Server Action для создания папки
 */
export async function createFolder(name: string, parentId?: number) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        folder: null
      }
    }

    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: 'Folder name is required',
        folder: null
      }
    }

    const result = await provider.createFolder(name.trim(), parentId)

    // Обновляем кэш страниц с файловым менеджером
    if (result.success) {
      revalidatePath('/admin/files')
      revalidatePath('/editor/files')
    }

    return {
      success: result.success,
      folder: result.data || null,
      error: result.error,
      permissions: provider.permissions
    }
  } catch (error) {
    console.error('createFolder error:', error)
    return {
      success: false,
      error: 'Internal server error',
      folder: null
    }
  }
}

/**
 * Server Action для удаления папки
 */
export async function deleteFolder(folderId: number) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        deletedIds: []
      }
    }

    const result = await provider.deleteFolder(folderId)

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
    console.error('deleteFolder error:', error)
    return {
      success: false,
      error: 'Internal server error',
      deletedIds: []
    }
  }
}

/**
 * Server Action для переименования папки
 */
export async function renameFolder(folderId: number, newName: string) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Unauthorized',
        folder: null
      }
    }

    if (!newName || newName.trim().length === 0) {
      return {
        success: false,
        error: 'Folder name is required',
        folder: null
      }
    }

    const result = await provider.renameFolder(folderId, newName.trim())

    // Обновляем кэш после переименования
    if (result.success) {
      revalidatePath('/admin/files')
      revalidatePath('/editor/files')
    }

    return {
      success: result.success,
      folder: result.data || null,
      error: result.error,
      permissions: provider.permissions
    }
  } catch (error) {
    console.error('renameFolder error:', error)
    return {
      success: false,
      error: 'Internal server error',
      folder: null
    }
  }
}

/**
 * Server Action для проверки доступа к папке
 */
export async function checkFolderAccess(folderId: number) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        hasAccess: false,
        error: 'Unauthorized'
      }
    }

    const hasAccess = await provider.canAccessFolder(folderId)

    return {
      success: true,
      hasAccess,
      error: null
    }
  } catch (error) {
    console.error('checkFolderAccess error:', error)
    return {
      success: false,
      hasAccess: false,
      error: 'Internal server error'
    }
  }
}

/**
 * Server Action для получения хлебных крошек папки
 */
export async function getFolderBreadcrumbs() {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return {
        success: false,
        breadcrumbs: [],
        error: 'Unauthorized'
      }
    }

    // Пока используем простую реализацию
    // В будущем можно расширить provider для поддержки breadcrumbs
    const result = await provider.listFolders()
    
    if (!result.success) {
      return {
        success: false,
        breadcrumbs: [],
        error: result.error
      }
    }

    // Простое построение breadcrumbs
    const breadcrumbs: Array<{ id: number; name: string }> = []
    // Здесь должна быть логика построения цепочки папок для folderId
    // Пока возвращаем базовую структуру

    return {
      success: true,
      breadcrumbs,
      error: null
    }
  } catch (error) {
    console.error('getFolderBreadcrumbs error:', error)
    return {
      success: false,
      breadcrumbs: [],
      error: 'Internal server error'
    }
  }
}