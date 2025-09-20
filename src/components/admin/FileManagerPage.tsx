"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  uploadFile, 
  createFolder, 
  listFiles, 
  deleteFile, 
  deleteFolder,
  renameFolder,
  getFolderTree,
  debugSession,
  type FileManagerItem,
  type FolderTreeNode,
  type DeleteFileResult
} from '@/app/actions/filemanager'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DeleteFileDialog, RenameFolderModal } from "./FileManager/Modals"
import { 
  Upload, 
  File, 
  Trash2, 
  Download,
  Search,
  Grid,
  List,
  FolderPlus,
  Folder,
  ChevronRight,
  Home,
  Edit2,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { validateFile, formatFileSize, MAX_FILE_SIZE } from "@/lib/utils/client-file-utils"
import Image from "next/image"

// Используем FileManagerItem из actions и добавляем недостающие поля
interface FileItem extends FileManagerItem {
  isFolder?: boolean
  path?: string
  parentId?: number | null
  isUsed?: boolean // Добавляем поле для отслеживания использования в статьях
}

interface FileManagerPageProps {
  userRole?: 'ADMIN' | 'EDITOR'
}

export function FileManagerPage({ userRole = 'ADMIN' }: FileManagerPageProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [createFolderLoading, setCreateFolderLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  
  // Состояние для подтверждения удаления
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
  
  // Состояние для диалога удаления (когда есть проблемы)
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
  
  // Состояние загрузки удаления
  const [deletingFiles, setDeletingFiles] = useState<Set<number>>(new Set())
  
  const [editingFolder, setEditingFolder] = useState<{ id: number; name: string } | null>(null)
  const [renameFolderModal, setRenameFolderModal] = useState<{ id: number; name: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Загрузка файлов
  const loadFiles = useCallback(async (folderId: number | null = null, page: number = 1) => {
    setLoading(true)
    try {
      const result = await listFiles(folderId, page, 20)
      setFiles(result.files)
      setPagination(result.pagination)
      setCurrentPage(page)
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
      const tree = await getFolderTree()
      setFolderTree(tree)
    } catch (error) {
      console.error('Error loading folder tree:', error)
    }
  }, [])

  // Инициализация
  useEffect(() => {
    loadFiles()
    loadFolderTree()
  }, [loadFiles, loadFolderTree])

  // Фильтрация файлов
  useEffect(() => {
    const filtered = files.filter(file => 
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.filename.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredFiles(filtered)
  }, [files, searchTerm])

  // Загрузка файлов (поддерживает множественную загрузку)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files
    if (!uploadedFiles || uploadedFiles.length === 0) return

    console.log('🔍 FileManagerPage: Starting file upload', { 
      filesCount: uploadedFiles.length,
      currentFolderId 
    })

    // Клиентская валидация файлов
    const filesArray = Array.from(uploadedFiles)
    const validationErrors: string[] = []
    
    for (const file of filesArray) {
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
          <div className="mt-2 text-xs text-gray-600">
            Максимальный размер файла: {formatFileSize(MAX_FILE_SIZE)}
          </div>
        </div>,
        { duration: 8000 }
      )
      // Очищаем input
      event.target.value = ''
      return
    }

    setUploadLoading(true)
    try {
      const formData = new FormData()
      filesArray.forEach(file => {
        formData.append('files', file)
      })
      
      if (currentFolderId) {
        formData.append('folderId', currentFolderId.toString())
      }

      console.log('🔍 FileManagerPage: FormData prepared', {
        filesCount: filesArray.length,
        folderId: currentFolderId
      })

      const result = await uploadFile(formData)
      
      console.log('🔍 FileManagerPage: Upload result', result)
      
      if (result.success) {
        toast.success(`Загружено ${result.files.length} файл(ов)`)
        await loadFiles(currentFolderId, currentPage)
      } else {
        toast.error(result.error || 'Ошибка загрузки файлов')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Ошибка загрузки файлов')
    } finally {
      setUploadLoading(false)
      // Сбрасываем значение input
      event.target.value = ''
    }
  }

  // Создание папки
  const handleCreateFolder = async () => {
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
        await loadFiles(currentFolderId, currentPage)
        await loadFolderTree()
      } else {
        toast.error(result.error || 'Ошибка создания папки')
      }
    } catch (error) {
      console.error('Create folder error:', error)
      toast.error('Ошибка создания папки')
    } finally {
      setCreateFolderLoading(false)
    }
  }

  // Переход в папку
  const navigateToFolder = async (folderId: number | null, folderPath: string = "") => {
    setCurrentFolderId(folderId)
    setCurrentFolderPath(folderPath)
    setCurrentPage(1)
    await loadFiles(folderId, 1)
  }

  // Показать диалог подтверждения удаления
  const showDeleteConfirmation = (file: FileItem) => {
    // Проверка прав для EDITOR
    if (userRole === 'EDITOR') {
      // EDITOR не может удалять файлы, используемые в статьях
      if (file.isUsed) {
        toast.error('Вы не можете удалить файл, используемый в статьях. Обратитесь к администратору.')
        return
      }
      
      // TODO: Добавить проверку владельца файла
      // if (file.userId && currentUserId && file.userId !== currentUserId) {
      //   toast.error('Вы можете удалять только свои файлы.')
      //   return
      // }
    }
    
    setConfirmDeleteDialog({
      isOpen: true,
      fileId: file.id,
      fileName: file.originalName,
      isFolder: file.isFolder
    })
  }

  // Удаление файла или папки
  const handleDeleteFile = async (fileId: number, force: boolean = false, isFolder: boolean = false) => {
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
          // Получаем информацию о файле для диалога
          const fileToDelete = files.find(f => f.id === fileId)
          
          // Для файлов проверяем isUsed, для папок показываем диалог если есть ошибка
          const shouldShowDialog = isFolder || 
            (result.error?.includes('protected')) || 
            (!isFolder && 'isUsed' in result && result.isUsed)
          
          if (shouldShowDialog) {
            // Показываем диалог подтверждения
            setDeleteDialog({
              isOpen: true,
              fileId: fileId,
              fileName: fileToDelete?.originalName || 'Неизвестный файл',
              isProtected: result.error?.includes('protected') || false,
              usedIn: (!isFolder && 'usedIn' in result) ? (result as DeleteFileResult).usedIn || [] : [],
              isFolder: isFolder
            })
            return
          }
          
          toast.error(result.error || `Ошибка удаления ${isFolder ? 'папки' : 'файла'}`)
          return
        }
        
        if (result.success) {
          await loadFiles(currentFolderId, currentPage)
          if (isFolder) {
            await loadFolderTree()
          }
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
          await loadFiles(currentFolderId, currentPage)
          if (isFolder) {
            await loadFolderTree()
          }
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
  }

  // Переименование папки
  const handleRenameFolder = async (folderId: number, newName: string) => {
    if (!newName.trim()) {
      toast.error('Введите название папки')
      return
    }

    console.log('🔍 FileManagerPage: Starting folder rename', { 
      folderId, 
      newName: newName.trim(),
      currentFolderId 
    })

    try {
      const result = await renameFolder(folderId, newName.trim())
      
      console.log('🔍 FileManagerPage: Rename result', result)
      
      if (result.success) {
        toast.success('Папка переименована')
        setEditingFolder(null)
        await loadFiles(currentFolderId, currentPage)
        await loadFolderTree()
      } else {
        toast.error(result.error || 'Ошибка переименования')
      }
    } catch (error) {
      console.error('Rename error:', error)
      toast.error('Ошибка переименования')
    }
  }

  // Скачивание файла
  const handleDownload = (file: FileItem) => {
    if (file.isFolder) return
    
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Рендер дерева папок
  const renderFolderTree = (nodes: FolderTreeNode[], level = 0) => {
    return nodes.map(node => (
      <div key={`folder-tree-${node.id}-${level}`} style={{ marginLeft: `${level * 16}px` }}>
        <div 
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded ${
            currentFolderId === node.id ? 'bg-blue-50 text-blue-600' : ''
          }`}
          onClick={() => navigateToFolder(node.id, node.path)}
        >
          <Folder className="w-4 h-4 mr-2" />
          <span className="text-sm">{node.name}</span>
        </div>
        {node.children && node.children.length > 0 && renderFolderTree(node.children, level + 1)}
      </div>
    ))
  }

  // Рендер хлебных крошек
  const renderBreadcrumbs = () => {
    if (!currentFolderPath) {
      return (
        <button
          onClick={() => navigateToFolder(null)}
          className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          <Home className="w-4 h-4 mr-1" />
          Корень
        </button>
      )
    }

    const pathParts = currentFolderPath.split('/').filter(Boolean)
    const breadcrumbs = [
      <button
        key="root"
        onClick={() => navigateToFolder(null)}
        className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer"
      >
        <Home className="w-4 h-4 mr-1" />
        Корень
      </button>
    ]

    pathParts.forEach((part, index) => {
      breadcrumbs.push(
        <ChevronRight key={`sep-${index}`} className="w-4 h-4 mx-1 text-gray-400" />
      )
      
      // Для упрощения показываем только текущую папку как активную
      if (index === pathParts.length - 1) {
        breadcrumbs.push(
          <span key={`current-${index}`} className="text-gray-600">
            {part}
          </span>
        )
      } else {
        breadcrumbs.push(
          <span key={`part-${index}`} className="text-blue-600 hover:text-blue-800 cursor-pointer">
            {part}
          </span>
        )
      }
    })

    return breadcrumbs
  }

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Левая панель с деревом папок */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <h3 className="font-semibold mb-4">Папки</h3>
        <div className="space-y-1">
          <div 
            className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded ${
              currentFolderId === null ? 'bg-blue-50 text-blue-600' : ''
            }`}
            onClick={() => navigateToFolder(null)}
          >
            <Home className="w-4 h-4 mr-2" />
            <span className="text-sm">Корень</span>
          </div>
          {renderFolderTree(folderTree)}
        </div>
      </div>

      {/* Основная область */}
      <div className="flex-1 flex flex-col">
        {/* Панель инструментов */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            {/* Хлебные крошки */}
            <div className="flex items-center">
              {renderBreadcrumbs()}
            </div>

            {/* Кнопки действий */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const result = await debugSession()
                  console.log('Debug session result:', result)
                  if (result.success) {
                    toast.success('Session OK')
                  } else {
                    toast.error(result.error || 'Session error')
                  }
                }}
              >
                Debug
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="cursor-pointer"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingFolder(true)}
                disabled={createFolderLoading}
                className="cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Создать папку
              </Button>

              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={uploadLoading}
                  multiple
                />
                <Button size="sm" disabled={uploadLoading} className="cursor-pointer">
                  {uploadLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {uploadLoading ? 'Загрузка...' : 'Загрузить файлы'}
                </Button>
              </div>
            </div>
          </div>

          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Поиск файлов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Область содержимого */}
        <div className="flex-1 p-4 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Загрузка...</div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">
                {searchTerm ? 'Файлы не найдены' : 'Папка пуста'}
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" 
              : "space-y-2"
            }>
              {filteredFiles.map(file => {
                const isDeleting = deletingFiles.has(file.id);
                return (
                <div
                  key={`${file.isFolder ? 'folder' : 'file'}-${file.id}`}
                  className={`${viewMode === 'grid' 
                    ? "group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    : "flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:bg-gray-50"
                  } ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => {
                    if (!isDeleting && file.isFolder) {
                      navigateToFolder(file.id, file.path);
                    }
                  }}
                >
                  {/* Оверлей для удаления */}
                  {isDeleting && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
                      <div className="flex flex-col items-center text-white">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        <p className="text-sm mt-2">Удаление...</p>
                      </div>
                    </div>
                  )}
                  
                  {viewMode === 'grid' ? (
                    <>
                      {/* Иконка файла/папки */}
                      <div className="flex flex-col items-center">
                        {file.isFolder ? (
                          <Folder className="w-12 h-12 text-blue-500 mb-2" />
                        ) : file.mimeType.startsWith('image/') ? (
                          <div className="w-12 h-12 mb-2 relative">
                            <Image
                              src={file.url}
                              alt={file.originalName}
                              fill
                              className="object-cover rounded"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <File className="w-12 h-12 text-gray-500 mb-2" />
                        )}
                        
                        {/* Название файла */}
                        <p className="text-sm text-center truncate w-full" title={file.originalName}>
                          {editingFolder && editingFolder.id === file.id && file.isFolder ? (
                            <Input
                              defaultValue={editingFolder.name}
                              onBlur={(e) => {
                                const newName = e.target.value.trim()
                                if (newName && newName !== editingFolder.name) {
                                  handleRenameFolder(file.id, newName)
                                } else {
                                  setEditingFolder(null)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const newName = (e.target as HTMLInputElement).value.trim()
                                  if (newName && newName !== editingFolder.name) {
                                    handleRenameFolder(file.id, newName)
                                  } else {
                                    setEditingFolder(null)
                                  }
                                } else if (e.key === 'Escape') {
                                  setEditingFolder(null)
                                }
                              }}
                              autoFocus
                              className="text-xs h-6"
                            />
                          ) : (
                            file.originalName
                          )}
                        </p>
                        
                        {!file.isFolder && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatFileSize(file.size)}
                          </p>
                        )}

                        {file.isUsed && (
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Используется в статьях" />
                          </div>
                        )}
                      </div>

                      {/* Кнопки действий */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex space-x-1">
                          {!file.isFolder && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownload(file)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {file.isFolder && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setRenameFolderModal({ id: file.id, name: file.originalName })
                              }}
                              className="h-6 w-6 p-0 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              showDeleteConfirmation(file)
                            }}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 cursor-pointer"
                            disabled={deletingFiles.has(file.id)}
                          >
                            {deletingFiles.has(file.id) ? (
                              <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Оверлей для удаления в list режиме */}
                      {isDeleting && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
                          <div className="flex items-center text-white">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            <span className="text-sm">Удаление...</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Иконка и имя файла */}
                      <div className="flex items-center flex-1 min-w-0">
                        {file.isFolder ? (
                          <Folder className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                        ) : file.mimeType.startsWith('image/') ? (
                          <div className="w-5 h-5 mr-3 relative flex-shrink-0">
                            <Image
                              src={file.url}
                              alt={file.originalName}
                              fill
                              className="object-cover rounded"
                              sizes="20px"
                            />
                          </div>
                        ) : (
                          <File className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          {editingFolder && editingFolder.id === file.id && file.isFolder ? (
                            <Input
                              defaultValue={editingFolder.name}
                              onBlur={(e) => {
                                const newName = e.target.value.trim()
                                if (newName && newName !== editingFolder.name) {
                                  handleRenameFolder(file.id, newName)
                                } else {
                                  setEditingFolder(null)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const newName = (e.target as HTMLInputElement).value.trim()
                                  if (newName && newName !== editingFolder.name) {
                                    handleRenameFolder(file.id, newName)
                                  } else {
                                    setEditingFolder(null)
                                  }
                                } else if (e.key === 'Escape') {
                                  setEditingFolder(null)
                                }
                              }}
                              autoFocus
                              className="h-8"
                            />
                          ) : (
                            <p className="truncate" title={file.originalName}>
                              {file.originalName}
                            </p>
                          )}
                          
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            {!file.isFolder && <span>{formatFileSize(file.size)}</span>}
                            {file.isUsed && (
                              <>
                                {!file.isFolder && <span className="mx-2">•</span>}
                                <span className="text-green-600">Используется</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Кнопки действий */}
                      <div className="flex items-center space-x-2">
                        {!file.isFolder && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(file)
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {file.isFolder && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setRenameFolderModal({ id: file.id, name: file.originalName })
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            showDeleteConfirmation(file)
                          }}
                          className="text-red-600 hover:text-red-700 cursor-pointer"
                          disabled={deletingFiles.has(file.id)}
                        >
                          {deletingFiles.has(file.id) ? (
                            <div className="w-4 h-4 border border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                )
              })}
            </div>
          )}

          {/* Пагинация */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadFiles(currentFolderId, currentPage - 1)}
                disabled={currentPage === 1}
              >
                Назад
              </Button>
              
              <span className="text-sm text-gray-600">
                Страница {currentPage} из {pagination.pages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadFiles(currentFolderId, currentPage + 1)}
                disabled={currentPage === pagination.pages}
              >
                Вперед
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Диалог создания папки */}
      {isCreatingFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Создать папку</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folder-name">Название папки</Label>
                <Input
                  id="folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Введите название папки"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateFolder()
                    } else if (e.key === 'Escape') {
                      setIsCreatingFolder(false)
                      setNewFolderName("")
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingFolder(false)
                    setNewFolderName("")
                  }}
                  disabled={createFolderLoading}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleCreateFolder}
                  disabled={createFolderLoading || !newFolderName.trim()}
                >
                  {createFolderLoading ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Диалог удаления файла */}
      <DeleteFileDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
        fileName={deleteDialog.fileName}
        isProtected={deleteDialog.isProtected}
        usedIn={deleteDialog.usedIn}
        userRole={userRole}
        onConfirm={() => {
          if (deleteDialog.fileId) {
            // Сначала закрываем диалог
            setDeleteDialog(prev => ({ ...prev, isOpen: false }))
            // Затем запускаем принудительное удаление
            handleDeleteFile(deleteDialog.fileId, true, deleteDialog.isFolder)
          }
        }}
      />

      {/* Диалог подтверждения удаления */}
      <Dialog open={confirmDeleteDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setConfirmDeleteDialog({
            isOpen: false,
            fileId: null,
            fileName: '',
            isFolder: false
          })
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Подтвердите удаление</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-600">
              Вы действительно хотите удалить {confirmDeleteDialog.isFolder ? 'папку' : 'файл'}{' '}
              <span className="font-medium">&quot;{confirmDeleteDialog.fileName}&quot;</span>?
            </p>
            {confirmDeleteDialog.isFolder && (
              <p className="text-sm text-orange-600 mt-2">
                ⚠️ Все содержимое папки также будет удалено
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDeleteDialog({
                isOpen: false,
                fileId: null,
                fileName: '',
                isFolder: false
              })}
              disabled={confirmDeleteDialog.fileId ? deletingFiles.has(confirmDeleteDialog.fileId) : false}
            >
              Отмена
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (confirmDeleteDialog.fileId) {
                  // Сначала закрываем диалог
                  setConfirmDeleteDialog({
                    isOpen: false,
                    fileId: null,
                    fileName: '',
                    isFolder: false
                  })
                  // Затем запускаем удаление
                  handleDeleteFile(confirmDeleteDialog.fileId, false, confirmDeleteDialog.isFolder)
                }
              }}
              disabled={confirmDeleteDialog.fileId ? deletingFiles.has(confirmDeleteDialog.fileId) : false}
            >
              {confirmDeleteDialog.fileId && deletingFiles.has(confirmDeleteDialog.fileId) ? (
                <>
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Удаление...
                </>
              ) : (
                'Удалить'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно переименования папки */}
      <RenameFolderModal
        isOpen={!!renameFolderModal}
        onClose={() => setRenameFolderModal(null)}
        folderId={renameFolderModal?.id || 0}
        currentName={renameFolderModal?.name || ""}
        onSuccess={() => {
          setRenameFolderModal(null)
          loadFiles(currentFolderId, currentPage)
          loadFolderTree()
        }}
      />
    </div>
  )
}