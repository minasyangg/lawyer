"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  uploadFile, 
  createFolder, 
  listFiles, 
  deleteFile, 
  deleteFolder,
  getFolderTree,
  debugSession,
  type FolderTreeNode,
  type DeleteFileResult,
  type DeleteFolderResult
} from '@/app/actions/filemanager'
import { toast } from "sonner"
import { validateFile } from "@/lib/utils/client-file-utils"

// Импорты новых компонентов
import {
  Toolbar,
  Breadcrumbs,
  FolderTree,
  FileGrid,
  FileList,
  UploadDialog,
  CreateFolderDialog
} from './components'
import { DeleteFileDialog, RenameFolderModal } from "./Modals"
import { FileItem } from './types'

interface FileManagerPageProps {
  userRole?: 'ADMIN' | 'EDITOR'
  mode?: 'full' | 'dialog'
  onFileSelect?: (file: FileItem) => void
}

interface BreadcrumbItem {
  id: number | null
  name: string
  onClick: () => void
}

export function FileManagerPage({ userRole = 'ADMIN', mode = 'full', onFileSelect }: FileManagerPageProps) {
  // Основное состояние
  const [files, setFiles] = useState<FileItem[]>([])
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("")
  const [loading, setLoading] = useState(false)
  
  // Состояние для поиска и фильтрации
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Состояние для операций
  const [uploadLoading, setUploadLoading] = useState(false)
  const [createFolderLoading, setCreateFolderLoading] = useState(false)
  const [deletingFiles, setDeletingFiles] = useState<Set<number>>(new Set())
  
  // Состояние для диалогов
  const [uploadDialog, setUploadDialog] = useState(false)
  const [createFolderDialog, setCreateFolderDialog] = useState(false)
  const [renameFolderModal, setRenameFolderModal] = useState<{ id: number; name: string } | null>(null)
  
  // Состояние для удаления
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState<{
    isOpen: boolean
    fileId: number | null
    fileName: string
    isFolder?: boolean
  }>({
    isOpen: false,
    fileId: null,
    fileName: '',
    isFolder: false
  })

  // Состояние для диалога удаления (когда есть проблемы с защищенными файлами)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    fileId: number | null
    fileName: string
    isProtected: boolean
    usedIn: Array<{ id: number; title: string; type: 'content' | 'document' }>
    isFolder?: boolean
  }>({
    isOpen: false,
    fileId: null,
    fileName: '',
    isProtected: false,
    usedIn: [],
    isFolder: false
  })
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1)
  const [, setPagination] = useState({
    total: 0,
    pages: 0,
    current: 1,
    hasNext: false,
    hasPrev: false
  })

  // Загрузка файлов
  const loadFiles = useCallback(async (folderId: number | null = null, page: number = 1) => {
    try {
      setLoading(true)
      const result = await listFiles(folderId, page, 20)
      
      if (result.files) {
        setFiles(result.files as FileItem[])
        if (result.pagination) {
          setPagination({
            total: result.pagination.total,
            pages: result.pagination.pages,
            current: result.pagination.page,
            hasNext: result.pagination.page < result.pagination.pages,
            hasPrev: result.pagination.page > 1
          })
          setCurrentPage(page)
        }
      }
    } catch (error) {
      console.error('Error loading files:', error)
      toast.error('Ошибка загрузки файлов')
    } finally {
      setLoading(false)
    }
  }, [])

  // Загрузка дерева папок
  const loadFolderTree = useCallback(async () => {
    try {
      const result = await getFolderTree()
      setFolderTree(result)
    } catch (error) {
      console.error('Error loading folder tree:', error)
    }
  }, [])

  // Навигация по папкам
  const navigateToFolder = useCallback((folderId: number | null, path?: string) => {
    setCurrentFolderId(folderId)
    setCurrentFolderPath(path || "")
    setCurrentPage(1)
    loadFiles(folderId, 1)
  }, [loadFiles])

  // Создание хлебных крошек
  const createBreadcrumbs = useCallback((): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      {
        id: null,
        name: 'Корень',
        onClick: () => navigateToFolder(null)
      }
    ]

    if (currentFolderPath) {
      const pathParts = currentFolderPath.split('/').filter(Boolean)
      
      // Построение пути для каждой части
      let buildPath = ''
      pathParts.forEach((part, index) => {
        buildPath += (buildPath ? '/' : '') + part
        
        // Нужно найти ID папки по пути - упрощенная версия
        breadcrumbs.push({
          id: index + 1, // Временное решение
          name: part,
          onClick: () => {
            // Здесь нужна более сложная логика для получения правильного ID
            console.log('Navigate to:', buildPath)
          }
        })
      })
    }

    return breadcrumbs
  }, [currentFolderPath, navigateToFolder])

  // Обработчики для файловых операций
  const handleFileClick = useCallback((file: FileItem) => {
    if (file.isFolder) {
      navigateToFolder(file.id, file.path)
    } else if (mode === 'dialog' && onFileSelect) {
      onFileSelect(file)
    } else {
      window.open(file.url, '_blank')
    }
  }, [navigateToFolder, mode, onFileSelect])

  const handleUpload = useCallback(async (files: File[]) => {
    try {
      setUploadLoading(true)
      
      // Клиентская валидация файлов
      const validationErrors: string[] = []
      
      for (const file of files) {
        const validation = validateFile(file)
        if (!validation.valid) {
          validationErrors.push(...validation.errors)
        }
      }

      // Если есть ошибки валидации, показываем их и прерываем загрузку
      if (validationErrors.length > 0) {
        toast.error(
          <div>
            <div className="font-semibold mb-2">Ошибки валидации файлов:</div>
            <div className="text-sm space-y-1">
              {validationErrors.slice(0, 3).map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
              {validationErrors.length > 3 && (
                <div>... и еще {validationErrors.length - 3} ошибок</div>
              )}
            </div>
          </div>,
          { duration: 8000 }
        )
        return
      }

      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })
      
      if (currentFolderId) {
        formData.append('folderId', currentFolderId.toString())
      }

      const result = await uploadFile(formData)

      if (result.success) {
        toast.success(`Загружено ${files.length} файл(ов)`)
        await loadFiles(currentFolderId, currentPage)
      } else {
        toast.error(result.error || 'Ошибка загрузки файлов')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Ошибка загрузки файлов')
    } finally {
      setUploadLoading(false)
    }
  }, [currentFolderId, currentPage, loadFiles])

  const handleCreateFolder = useCallback(async (name: string) => {
    try {
      setCreateFolderLoading(true)
      
      const result = await createFolder(name, currentFolderId)

      if (result.success) {
        toast.success('Папка успешно создана')
        await Promise.all([
          loadFiles(currentFolderId, currentPage),
          loadFolderTree()
        ])
      } else {
        toast.error(result.error || 'Ошибка создания папки')
      }
    } catch (error) {
      console.error('Create folder error:', error)
      toast.error('Ошибка создания папки')
    } finally {
      setCreateFolderLoading(false)
    }
  }, [currentFolderId, currentPage, loadFiles, loadFolderTree])

  const handleDeleteFile = useCallback(async (file: FileItem, forceDelete: boolean = false) => {
    if (deletingFiles.has(file.id)) return

    try {
      setDeletingFiles(prev => new Set(prev).add(file.id))
      
      // Если это не принудительное удаление, сначала проверяем использование
      if (!forceDelete) {
        let result: DeleteFileResult | DeleteFolderResult
        if (file.isFolder) {
          result = await deleteFolder(file.id, false)
        } else {
          result = await deleteFile(file.id, false)
        }
        
        if (!result.success) {
          // Проверяем нужно ли показать специальный диалог
          const shouldShowDialog = file.isFolder || 
            (result.error?.includes('protected')) || 
            (!file.isFolder && 'isUsed' in result && result.isUsed)
          
          if (shouldShowDialog) {
            // Показываем диалог подтверждения со всей информацией
            setDeleteDialog({
              isOpen: true,
              fileId: file.id,
              fileName: file.originalName,
              isProtected: result.error?.includes('protected') || false,
              usedIn: (!file.isFolder && 'usedIn' in result) ? (result as DeleteFileResult).usedIn || [] : [],
              isFolder: file.isFolder || false
            })
            return
          }
          
          toast.error(result.error || `Ошибка удаления ${file.isFolder ? 'папки' : 'файла'}`)
          return
        }
        
        if (result.success) {
          await Promise.all([
            loadFiles(currentFolderId, currentPage),
            loadFolderTree()
          ])
          toast.success(file.isFolder ? 'Папка удалена' : 'Файл удален')
        } else {
          toast.error(result.error || `Ошибка удаления ${file.isFolder ? 'папки' : 'файла'}`)
        }
      } else {
        // Принудительное удаление
        let result: DeleteFileResult | DeleteFolderResult
        if (file.isFolder) {
          result = await deleteFolder(file.id, true)
        } else {
          result = await deleteFile(file.id, true)
        }

        if (result.success) {
          toast.success(`${file.isFolder ? 'Папка' : 'Файл'} принудительно удален`)
          await Promise.all([
            loadFiles(currentFolderId, currentPage),
            loadFolderTree()
          ])
        } else {
          toast.error(result.error || 'Ошибка принудительного удаления')
        }
        
        // Закрываем диалог
        setDeleteDialog(prev => ({ ...prev, isOpen: false }))
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Ошибка удаления')
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(file.id)
        return newSet
      })
      setConfirmDeleteDialog({
        isOpen: false,
        fileId: null,
        fileName: '',
        isFolder: false
      })
    }
  }, [deletingFiles, currentFolderId, currentPage, loadFiles, loadFolderTree])

  // Фильтрация файлов
  useEffect(() => {
    if (searchTerm) {
      const filtered = files.filter(file =>
        file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredFiles(filtered)
    } else {
      setFilteredFiles(files)
    }
  }, [files, searchTerm])

  // Загрузка данных при монтировании
  useEffect(() => {
    // Отладочная информация о сессии
    debugSession().then(result => {
      console.log('🔍 Session debug result:', result)
    }).catch(error => {
      console.error('❌ Session debug error:', error)
    })
    
    loadFiles()
    loadFolderTree()
  }, [loadFiles, loadFolderTree])

  const breadcrumbs = createBreadcrumbs()

  return (
    <div className={`flex ${mode === 'dialog' ? 'h-[60vh]' : 'h-[calc(100vh-200px)]'}`}>
      {/* Левая панель */}
      <FolderTree
        folderTree={folderTree}
        currentFolderId={currentFolderId}
        onFolderClick={navigateToFolder}
      />

      {/* Основная область */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <Toolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onUploadClick={() => setUploadDialog(true)}
          onCreateFolderClick={() => setCreateFolderDialog(true)}
          canCreateFolder={userRole === 'ADMIN' || userRole === 'EDITOR'}
          uploadLoading={uploadLoading}
          createFolderLoading={createFolderLoading}
        />

        {/* Хлебные крошки */}
        {breadcrumbs.length > 1 && (
          <div className="px-4">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}

        {/* Область файлов */}
        <div className="flex-1 p-4 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : viewMode === 'grid' ? (
            <FileGrid
              files={filteredFiles}
              deletingFiles={deletingFiles}
              onFileClick={handleFileClick}
              onDeleteClick={(file) => setConfirmDeleteDialog({
                isOpen: true,
                fileId: file.id,
                fileName: file.originalName,
                isFolder: file.isFolder || false
              })}
              onDownloadClick={(file) => window.open(file.url, '_blank')}
              onEditFolderClick={(file) => setRenameFolderModal({ id: file.id, name: file.originalName })}
              userRole={userRole}
              mode={mode}
            />
          ) : (
            <FileList
              files={filteredFiles}
              deletingFiles={deletingFiles}
              onFileClick={handleFileClick}
              onDeleteClick={(file) => setConfirmDeleteDialog({
                isOpen: true,
                fileId: file.id,
                fileName: file.originalName,
                isFolder: file.isFolder || false
              })}
              onDownloadClick={(file) => window.open(file.url, '_blank')}
              onEditFolderClick={(file) => setRenameFolderModal({ id: file.id, name: file.originalName })}
              userRole={userRole}
              mode={mode}
            />
          )}
        </div>
      </div>

      {/* Диалоги */}
      <UploadDialog
        isOpen={uploadDialog}
        onClose={() => setUploadDialog(false)}
        onUpload={handleUpload}
        currentFolderId={currentFolderId}
        isUploading={uploadLoading}
      />

      <CreateFolderDialog
        isOpen={createFolderDialog}
        onClose={() => setCreateFolderDialog(false)}
        onCreate={handleCreateFolder}
        isCreating={createFolderLoading}
      />

      <DeleteFileDialog
        isOpen={confirmDeleteDialog.isOpen}
        onClose={() => setConfirmDeleteDialog({
          isOpen: false,
          fileId: null,
          fileName: '',
          isFolder: false
        })}
        onConfirm={() => {
          if (confirmDeleteDialog.fileId) {
            const file = files.find(f => f.id === confirmDeleteDialog.fileId)
            if (file) {
              handleDeleteFile(file)
            }
          }
        }}
        fileName={confirmDeleteDialog.fileName}
        userRole={userRole}
      />

      {/* Специальный диалог для защищенных файлов */}
      <DeleteFileDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (deleteDialog.fileId) {
            const file = files.find(f => f.id === deleteDialog.fileId)
            if (file) {
              handleDeleteFile(file, true) // force = true
            }
          }
        }}
        fileName={deleteDialog.fileName}
        isProtected={deleteDialog.isProtected}
        usedIn={deleteDialog.usedIn}
        userRole={userRole}
      />

      <RenameFolderModal
        isOpen={!!renameFolderModal}
        onClose={() => setRenameFolderModal(null)}
        folderId={renameFolderModal?.id || 0}
        currentName={renameFolderModal?.name || ''}
        onSuccess={() => {
          setRenameFolderModal(null)
          loadFiles(currentFolderId, currentPage)
          loadFolderTree()
        }}
      />
    </div>
  )
}