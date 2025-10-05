import { useState, useCallback } from 'react'
import { createFolder, renameFolder } from '@/app/actions/filemanager'
import { toast } from 'sonner'
import { RenameFolderModalState, UserRole, BreadcrumbItem } from '../types'
import { canCreateFolder, canRenameFolder } from '../utils'

interface UseFolderNavigationOptions {
  userRole: UserRole
  currentFolderId: number | null
  currentFolderPath: string
  onNavigateToFolder: (folderId: number | null, path?: string) => void
  onRefreshData: () => void
}

export function useFolderNavigation({ 
  userRole, 
  currentFolderId, 
  currentFolderPath,
  onNavigateToFolder,
  onRefreshData 
}: UseFolderNavigationOptions) {
  // Состояние создания папки
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [createFolderLoading, setCreateFolderLoading] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  // Состояние переименования папки
  const [renameFolderModal, setRenameFolderModal] = useState<RenameFolderModalState | null>(null)

  // Создание папки
  const handleCreateFolder = useCallback(async () => {
    if (!canCreateFolder(userRole)) {
      toast.error('Недостаточно прав для создания папки')
      return
    }

    if (!newFolderName.trim()) {
      toast.error('Введите название папки')
      return
    }

    setCreateFolderLoading(true)
    try {
      const result = await createFolder(newFolderName.trim(), currentFolderId)
      
      if (result.success) {
        toast.success('Папка создана')
        setNewFolderName("")
        setIsCreatingFolder(false)
        await onRefreshData()
      } else {
        toast.error(result.error || 'Ошибка создания папки')
      }
    } catch (error) {
      console.error('Create folder error:', error)
      toast.error('Ошибка создания папки')
    } finally {
      setCreateFolderLoading(false)
    }
  }, [newFolderName, currentFolderId, userRole, onRefreshData])

  // Переименование папки
  const handleRenameFolder = useCallback(async (folderId: number, newName: string) => {
    if (!canRenameFolder(userRole)) {
      toast.error('Недостаточно прав для переименования папки')
      return
    }

    if (!newName.trim()) {
      toast.error('Введите название папки')
      return
    }

    try {
      const result = await renameFolder(folderId, newName.trim())
      
      if (result.success) {
        toast.success('Папка переименована')
        setRenameFolderModal(null)
        await onRefreshData()
      } else {
        toast.error(result.error || 'Ошибка переименования папки')
      }
    } catch (error) {
      console.error('Rename folder error:', error)
      toast.error('Ошибка переименования папки')
    }
  }, [userRole, onRefreshData])

  // Генерация хлебных крошек
  const getBreadcrumbs = useCallback((): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [{ id: null, name: 'Корень' }]
    
    if (currentFolderPath) {
      const pathParts = currentFolderPath.split('/').filter(Boolean)
      pathParts.forEach((part, index) => {
        breadcrumbs.push({
          id: index + 1, // Это упрощение, в реальности нужно получать ID
          name: part
        })
      })
    }
    
    return breadcrumbs
  }, [currentFolderPath])

  // Навигация по хлебным крошкам
  const navigateToBreadcrumb = useCallback((breadcrumbId: number | null) => {
    // Упрощенная логика навигации
    if (breadcrumbId === null) {
      onNavigateToFolder(null, "")
    } else {
      // В реальности нужно построить правильный путь на основе ID
      onNavigateToFolder(breadcrumbId, "")
    }
  }, [onNavigateToFolder])

  // Отмена создания папки
  const cancelCreateFolder = useCallback(() => {
    setIsCreatingFolder(false)
    setNewFolderName("")
  }, [])

  // Начать создание папки
  const startCreateFolder = useCallback(() => {
    if (!canCreateFolder(userRole)) {
      toast.error('Недостаточно прав для создания папки')
      return
    }
    setIsCreatingFolder(true)
  }, [userRole])

  // Показать диалог переименования
  const showRenameDialog = useCallback((folderId: number, currentName: string) => {
    if (!canRenameFolder(userRole)) {
      toast.error('Недостаточно прав для переименования папки')
      return
    }
    setRenameFolderModal({ id: folderId, name: currentName })
  }, [userRole])

  // Закрыть диалог переименования
  const closeRenameDialog = useCallback(() => {
    setRenameFolderModal(null)
  }, [])

  return {
    // Состояние создания папки
    isCreatingFolder,
    createFolderLoading,
    newFolderName,
    setNewFolderName,
    
    // Состояние переименования
    renameFolderModal,
    
    // Действия с папками
    handleCreateFolder,
    handleRenameFolder,
    startCreateFolder,
    cancelCreateFolder,
    showRenameDialog,
    closeRenameDialog,
    
    // Навигация
    getBreadcrumbs,
    navigateToBreadcrumb,
    
    // Разрешения
    canCreate: canCreateFolder(userRole),
    canRename: canRenameFolder(userRole)
  }
}