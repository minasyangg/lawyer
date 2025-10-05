import { useState, useCallback } from 'react'
import { deleteFile, deleteFolder } from '@/app/actions/filemanager'
import { toast } from 'sonner'
import { FileItem, UserRole, DeleteDialogState, ConfirmDeleteDialogState } from '../types'
import { canDeleteFile, getDeleteErrorMessage } from '../utils'

interface UseFileOperationsOptions {
  userRole: UserRole
  onRefreshData: () => void
}

export function useFileOperations({ userRole, onRefreshData }: UseFileOperationsOptions) {
  // Состояние удаления
  const [deletingFiles, setDeletingFiles] = useState<Set<number>>(new Set())
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    fileId: null,
    fileName: '',
    isProtected: false,
    usedIn: [],
    isFolder: false
  })
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState<ConfirmDeleteDialogState>({
    isOpen: false,
    fileId: null,
    fileName: '',
    isFolder: false
  })

  // Показать диалог подтверждения удаления
  const showDeleteConfirmation = useCallback((file: FileItem) => {
    // Проверка прав для EDITOR
    if (!canDeleteFile(file, userRole)) {
      toast.error(getDeleteErrorMessage(file, userRole))
      return
    }
    
    setConfirmDeleteDialog({
      isOpen: true,
      fileId: file.id,
      fileName: file.originalName,
      isFolder: file.isFolder || false
    })
  }, [userRole])

  // Удаление файла или папки
  const handleDeleteFile = useCallback(async (fileId: number, force: boolean = false, isFolder: boolean = false) => {
    // Добавляем файл в список удаляемых
    setDeletingFiles(prev => new Set(prev).add(fileId))
    
    try {
      // Если это не принудительное удаление, сначала проверяем использование
      if (!force) {
        let result
        if (isFolder) {
          result = await deleteFolder(fileId, false)
        } else {
          result = await deleteFile(fileId, false)
        }
        
        if (!result.success) {
          // Показываем диалог подтверждения для защищенных файлов
          const shouldShowDialog = isFolder || 
            (result.error?.includes('protected')) || 
            (!isFolder && 'isUsed' in result && result.isUsed)
          
          if (shouldShowDialog) {
            setDeleteDialog({
              isOpen: true,
              fileId: fileId,
              fileName: 'Файл', // Получим из списка файлов
              isProtected: result.error?.includes('protected') || false,
              usedIn: (!isFolder && 'usedIn' in result && Array.isArray(result.usedIn)) ? result.usedIn : [],
              isFolder: isFolder
            })
            return
          }
          
          toast.error(result.error || `Ошибка удаления ${isFolder ? 'папки' : 'файла'}`)
          return
        }
        
        if (result.success) {
          await onRefreshData()
          toast.success(isFolder ? 'Папка удалена' : 'Файл удален')
        } else {
          toast.error(result.error || `Ошибка удаления ${isFolder ? 'папки' : 'файла'}`)
        }
      } else {
        // Принудительное удаление
        let result
        if (isFolder) {
          result = await deleteFolder(fileId, true)
        } else {
          result = await deleteFile(fileId, true)
        }
        
        if (result.success) {
          await onRefreshData()
          toast.success(isFolder ? 'Папка удалена' : 'Файл удален')
        } else {
          toast.error(result.error || `Ошибка удаления ${isFolder ? 'папки' : 'файла'}`)
        }
      }
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error(`Ошибка удаления ${isFolder ? 'папки' : 'файла'}`)
    } finally {
      // Убираем файл из списка удаляемых
      setDeletingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    }
  }, [onRefreshData])

  // Закрытие диалогов
  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  const closeConfirmDeleteDialog = useCallback(() => {
    setConfirmDeleteDialog({
      isOpen: false,
      fileId: null,
      fileName: '',
      isFolder: false
    })
  }, [])

  // Подтверждение принудительного удаления
  const confirmForceDelete = useCallback(() => {
    if (deleteDialog.fileId) {
      closeDeleteDialog()
      handleDeleteFile(deleteDialog.fileId, true, deleteDialog.isFolder)
    }
  }, [deleteDialog.fileId, deleteDialog.isFolder, closeDeleteDialog, handleDeleteFile])

  // Подтверждение обычного удаления
  const confirmDelete = useCallback(() => {
    if (confirmDeleteDialog.fileId) {
      closeConfirmDeleteDialog()
      handleDeleteFile(confirmDeleteDialog.fileId, false, confirmDeleteDialog.isFolder || false)
    }
  }, [confirmDeleteDialog.fileId, confirmDeleteDialog.isFolder, closeConfirmDeleteDialog, handleDeleteFile])

  return {
    // Состояние
    deletingFiles,
    deleteDialog,
    confirmDeleteDialog,

    // Действия
    showDeleteConfirmation,
    handleDeleteFile,
    closeDeleteDialog,
    closeConfirmDeleteDialog,
    confirmForceDelete,
    confirmDelete
  }
}