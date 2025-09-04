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
  type FileManagerItem,
  type FolderTreeNode
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
  ChevronDown,
  ArrowLeft,
  Edit2
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

// Используем FileManagerItem из actions и добавляем недостающие поля
interface FileItem extends FileManagerItem {
  isFolder?: boolean
  path?: string
  parentId?: number | null
  isUsed?: boolean // Добавляем поле для отслеживания использования в статьях
}

interface FolderTreeItem {
  id: number
  name: string
  parentId: number | null
  children: FolderTreeItem[]
  isExpanded?: boolean
}

interface BreadcrumbItem {
  id: number | null
  name: string
}

interface FileManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelect?: (file: FileItem) => void
  selectMode?: boolean
}

export function FileManager({ isOpen, onClose, onSelect, selectMode = false }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderTreeItem[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: 'Root' }])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set())
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [showRenameFolder, setShowRenameFolder] = useState(false)
  const [renamingFolderId, setRenamingFolderId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set())

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listFiles(currentFolderId)
      setFiles(result.files || [])
    } catch (error) {
      console.error('Failed to fetch files:', error)
      toast.error('Ошибка загрузки файлов')
    } finally {
      setLoading(false)
    }
  }, [currentFolderId])

  const fetchFolders = useCallback(async () => {
    try {
      const folderTree = await getFolderTree()
      
      // Преобразуем FolderTreeNode в FolderTreeItem и строим дерево
      const convertToTreeItem = (node: FolderTreeNode): FolderTreeItem => ({
        id: node.id,
        name: node.name,
        parentId: node.parentId,
        children: node.children?.map(convertToTreeItem) || [],
        isExpanded: false // Устанавливается позже в updateTreeExpansion
      })
      
      const treeItems = folderTree.map(convertToTreeItem)
      setFolders(treeItems)
    } catch (error) {
      console.error('Failed to fetch folders:', error)
    }
  }, [])

  // Отдельная функция для обновления состояния раскрытых папок в дереве
  const updateTreeExpansion = useCallback((folders: FolderTreeItem[]): FolderTreeItem[] => {
    return folders.map(folder => ({
      ...folder,
      isExpanded: expandedFolders.has(folder.id),
      children: updateTreeExpansion(folder.children)
    }))
  }, [expandedFolders])

  // Обновляем дерево папок при изменении expandedFolders
  useEffect(() => {
    setFolders(prevFolders => updateTreeExpansion(prevFolders))
  }, [expandedFolders, updateTreeExpansion])

  useEffect(() => {
    if (isOpen) {
      fetchFiles()
      fetchFolders()
    }
  }, [isOpen, fetchFiles, fetchFolders])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files
    if (!uploadedFiles || uploadedFiles.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(uploadedFiles).forEach(file => {
        formData.append('files', file)
      })
      
      if (currentFolderId) {
        formData.append('folderId', currentFolderId.toString())
      }

      const result = await uploadFile(formData)
      if (result.success) {
        const mapped = result.files.map(f => ({
          id: f.id,
          originalName: f.originalName,
          filename: f.filename,
          mimeType: f.mimeType || '',
          size: f.size || 0,
          createdAt: f.createdAt.toString(),
          url: f.url || '',
          isFolder: false,
          path: '',
          parentId: currentFolderId,
          isUsed: false // Новые файлы пока не используются
        }))
        setFiles(prev => [...mapped, ...prev])
        toast.success(`Загружено ${result.files.length} файл(ов)`)
      } else {
        toast.error(result.error || 'Ошибка загрузки файлов')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Ошибка загрузки файлов')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleDeleteFile = async (fileId: number, force: boolean = false) => {
    // Если это не принудительное удаление, сначала проверяем использование
    if (!force) {
      try {
        const result = await deleteFile(fileId, false)
        
        if (!result.success && result.isUsed) {
          // Файл используется в статьях - показываем предупреждение
          const articlesText = result.usedIn?.map(article => `• ${article.title}`).join('\n') || ''
          const confirmMessage = `Этот файл используется в следующих статьях:\n\n${articlesText}\n\nВы действительно хотите удалить файл? Это может нарушить отображение статей.`
          
          if (confirm(confirmMessage)) {
            // Пользователь подтвердил принудительное удаление
            return handleDeleteFile(fileId, true)
          }
          return
        }
        
        if (result.success) {
          setFiles(prev => prev.filter(file => file.id !== fileId))
          setSelectedFiles(prev => {
            const newSet = new Set(prev)
            newSet.delete(fileId)
            return newSet
          })
          toast.success('Файл удален')
        } else {
          toast.error(result.error || 'Ошибка удаления файла')
        }
      } catch (error) {
        console.error('Delete failed:', error)
        toast.error('Ошибка удаления файла')
      }
    } else {
      // Принудительное удаление
      try {
        const result = await deleteFile(fileId, true)
        
        if (result.success) {
          setFiles(prev => prev.filter(file => file.id !== fileId))
          setSelectedFiles(prev => {
            const newSet = new Set(prev)
            newSet.delete(fileId)
            return newSet
          })
          toast.success('Файл удален')
        } else {
          toast.error(result.error || 'Ошибка удаления файла')
        }
      } catch (error) {
        console.error('Force delete failed:', error)
        toast.error('Ошибка удаления файла')
      }
    }
  }

  const handleFileSelect = (file: FileItem) => {
    if (selectMode && onSelect) {
      onSelect(file)
      onClose()
    } else {
      // Проверяем, есть ли глобальный коллбэк
      if (window.fileManagerSelectCallback) {
        window.fileManagerSelectCallback(file)
        delete window.fileManagerSelectCallback
        onClose()
      } else {
        // Toggle selection for multi-select
        setSelectedFiles(prev => {
          const newSet = new Set(prev)
          if (newSet.has(file.id)) {
            newSet.delete(file.id)
          } else {
            newSet.add(file.id)
          }
          return newSet
        })
      }
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    
    try {
      const result = await createFolder(newFolderName.trim(), currentFolderId)
      if (result.success && result.folder) {
        const newFolder: FileItem = {
          id: result.folder.id,
          originalName: result.folder.originalName,
          filename: result.folder.filename,
          mimeType: result.folder.mimeType,
          size: result.folder.size,
          createdAt: result.folder.createdAt,
          url: result.folder.url,
          isFolder: result.folder.isFolder,
          path: result.folder.path,
          parentId: currentFolderId
        }
        
        setFiles(prev => [newFolder, ...prev])
        setNewFolderName("")
        setShowCreateFolder(false)
        fetchFolders() // Обновляем дерево папок
        toast.success('Папка создана')
      } else {
        toast.error(result.error || 'Ошибка создания папки')
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
      toast.error('Ошибка создания папки')
    }
  }

  const handleDeleteFolder = async (folderId: number, folderName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить папку "${folderName}" и всё её содержимое?`)) return

    try {
      const result = await deleteFolder(folderId, true) // force delete
      if (result.success) {
        // Обновляем дерево папок
        fetchFolders()
        // Если удаляемая папка была текущей, переходим в корень
        if (currentFolderId === folderId) {
          setCurrentFolderId(null)
          setBreadcrumbs([{ id: null, name: 'Root' }])
        }
        // Обновляем список файлов
        fetchFiles()
        toast.success('Папка удалена')
      } else {
        toast.error(result.error || 'Ошибка удаления папки')
      }
    } catch (error) {
      console.error('Delete folder failed:', error)
      toast.error('Ошибка удаления папки')
    }
  }

  const handleRenameFolder = async () => {
    if (!renamingFolderId || !renameValue.trim()) return

    try {
      const result = await renameFolder(renamingFolderId, renameValue.trim())
      if (result.success) {
        // Обновляем дерево папок
        fetchFolders()
        // Обновляем список файлов
        fetchFiles()
        
        // Обновляем breadcrumbs если переименованная папка есть в них
        setBreadcrumbs(prev => 
          prev.map(crumb => 
            crumb.id === renamingFolderId 
              ? { ...crumb, name: renameValue.trim() }
              : crumb
          )
        )
        
        toast.success('Папка переименована')
        setShowRenameFolder(false)
        setRenamingFolderId(null)
        setRenameValue("")
      } else {
        toast.error(result.error || 'Ошибка переименования папки')
      }
    } catch (error) {
      console.error('Rename folder failed:', error)
      toast.error('Ошибка переименования папки')
    }
  }

  const startRenameFolder = (folderId: number, currentName: string) => {
    setRenamingFolderId(folderId)
    setRenameValue(currentName)
    setShowRenameFolder(true)
  }

  const navigateToFolder = async (folderId: number | null, folderName: string = 'Root') => {
    setCurrentFolderId(folderId)
    
    // Обновляем breadcrumbs
    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: 'Root' }])
    } else {
      const newBreadcrumbs = [...breadcrumbs]
      const existingIndex = newBreadcrumbs.findIndex(b => b.id === folderId)
      
      if (existingIndex >= 0) {
        // Если папка уже в breadcrumbs, обрезаем до неё
        setBreadcrumbs(newBreadcrumbs.slice(0, existingIndex + 1))
      } else {
        // Добавляем новую папку в breadcrumbs
        newBreadcrumbs.push({ id: folderId, name: folderName })
        setBreadcrumbs(newBreadcrumbs)
      }
    }
    
    // Раскрываем путь к папке в дереве используя Server Action
    if (folderId !== null) {
      try {
        const folderTree = await getFolderTree()
        
        // Функция для поиска пути к папке
        const findPathToFolder = (folders: FolderTreeNode[], targetId: number, path: number[] = []): number[] | null => {
          for (const folder of folders) {
            const currentPath = [...path, folder.id]
            
            if (folder.id === targetId) {
              return path // Возвращаем путь до папки (не включая саму папку)
            }
            
            if (folder.children.length > 0) {
              const result = findPathToFolder(folder.children, targetId, currentPath)
              if (result) return result
            }
          }
          return null
        }

        const pathToFolder = findPathToFolder(folderTree, folderId)
        
        if (pathToFolder) {
          setExpandedFolders(prev => {
            const newSet = new Set(prev)
            pathToFolder.forEach(folderId => newSet.add(folderId))
            return newSet
          })
        }
      } catch (error) {
        console.error('Failed to expand path to folder:', error)
      }
    }
  }

  const handleFolderClick = async (folder: FileItem) => {
    if (folder.isFolder) {
      await navigateToFolder(folder.id, folder.originalName)
    }
  }

  const toggleFolderExpansion = (folderId: number) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const filteredFiles = files.filter(file =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/')
  }

  // Рекурсивный компонент для рендера дерева папок
  const FolderTreeNode = ({ folder, level = 0 }: { folder: FolderTreeItem; level?: number }) => (
    <div className="select-none">
      <div 
        className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer rounded group ${
          currentFolderId === folder.id ? 'bg-blue-100 text-blue-700' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => navigateToFolder(folder.id, folder.name)}
      >
        {folder.children.length > 0 && (
          <button
            type="button"
            className="mr-1 p-0.5 hover:bg-gray-200 rounded"
            onClick={(e) => {
              e.stopPropagation()
              toggleFolderExpansion(folder.id)
            }}
          >
            {folder.isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
        <Folder className="w-4 h-4 mr-2 text-blue-500" />
        <span className="text-sm truncate flex-1">{folder.name}</span>
        
        {/* Кнопки действий появляются при наведении */}
        <div className="hidden group-hover:flex items-center gap-1 ml-2">
          <button
            type="button"
            className="p-1 hover:bg-gray-200 rounded"
            onClick={(e) => {
              e.stopPropagation()
              startRenameFolder(folder.id, folder.name)
            }}
            title="Переименовать папку"
          >
            <Edit2 className="w-3 h-3 text-gray-600" />
          </button>
          <button
            type="button"
            className="p-1 hover:bg-red-100 rounded"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteFolder(folder.id, folder.name)
            }}
            title="Удалить папку"
          >
            <Trash2 className="w-3 h-3 text-red-600" />
          </button>
        </div>
      </div>
      {folder.isExpanded && folder.children.map((child, index) => (
        <FolderTreeNode key={`${child.id}-${level}-${index}`} folder={child} level={level + 1} />
      ))}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <DialogHeader>
          <DialogTitle>Файловый менеджер</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Боковая панель с деревом папок */}
          <div className="w-64 border-r pr-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateFolder(true)}
                className="flex-1"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Новая папка
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1">
                <div 
                  className={`flex items-center py-2 px-2 hover:bg-gray-100 cursor-pointer rounded ${
                    currentFolderId === null ? 'bg-blue-100 text-blue-700' : ''
                  }`}
                  onClick={() => navigateToFolder(null, 'Root')}
                >
                  <Home className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-sm font-medium">Корневая папка</span>
                </div>
                {folders.map((folder, index) => (
                  <FolderTreeNode key={`root-${folder.id}-${index}`} folder={folder} />
                ))}
              </div>
            </div>
          </div>

          {/* Основная область */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Breadcrumb навигация */}
            <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded">
              {breadcrumbs.map((breadcrumb, index) => (
                <div key={breadcrumb.id || 'root'} className="flex items-center">
                  {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
                  <button
                    type="button"
                    className="text-sm hover:text-blue-600 hover:underline"
                    onClick={() => navigateToFolder(breadcrumb.id, breadcrumb.name)}
                  >
                    {breadcrumb.name}
                  </button>
                </div>
              ))}
            </div>

            {/* Панель инструментов */}
            <div className="flex justify-between items-center gap-4 pb-4 border-b">
              <div className="flex items-center gap-2">
                <Button 
                  disabled={uploading}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    document.getElementById('file-upload')?.click();
                  }}
                  type="button"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Загрузка...' : 'Загрузить файлы'}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFileUpload(e);
                  }}
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
                />
                
                {currentFolderId !== null && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => navigateToFolder(null)}
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Назад
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Поиск файлов..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                      }
                    }}
                    className="pl-10 w-64"
                  />
                </div>
                
                <div className="flex border rounded">
                  <Button
                    type="button"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Область файлов */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Folder className="w-12 h-12 mb-2 text-gray-300" />
                  <p>Папка пуста</p>
                  <p className="text-xs">Загрузите файлы или создайте новую папку</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-4 gap-4 p-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`border rounded-lg p-3 cursor-pointer hover:border-blue-300 transition-colors ${
                        selectedFiles.has(file.id) ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => file.isFolder ? handleFolderClick(file) : handleFileSelect(file)}
                    >
                      <div className={`aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden relative ${
                        file.isUsed ? 'ring-2 ring-orange-400' : ''
                      }`}>
                        {file.isFolder ? (
                          <Folder className="w-8 h-8 text-blue-500" />
                        ) : isImage(file.mimeType) ? (
                          <Image
                            src={file.url}
                            alt={file.originalName}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <File className="w-8 h-8 text-gray-400" />
                        )}
                        {file.isUsed && (
                          <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                            Используется
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate" title={file.originalName}>
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                      {!file.isFolder && (
                        <div className="flex justify-end mt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFile(file.id)
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4">
                  <div className="space-y-2">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center gap-3 p-3 border rounded cursor-pointer hover:border-blue-300 transition-colors ${
                          selectedFiles.has(file.id) ? 'border-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => file.isFolder ? handleFolderClick(file) : handleFileSelect(file)}
                      >
                        <div className="flex-shrink-0">
                          {file.isFolder ? (
                            <Folder className="w-6 h-6 text-blue-500" />
                          ) : isImage(file.mimeType) ? (
                            <File className="w-6 h-6 text-blue-500" />
                          ) : (
                            <File className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {file.originalName}
                            </p>
                            {file.isUsed && (
                              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                Используется в статьях
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!file.isFolder && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(file.url, '_blank')
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteFile(file.id)
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Диалог создания папки */}
        {showCreateFolder && (
          <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
            <DialogContent 
              className="sm:max-w-md"
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <DialogHeader>
                <DialogTitle>Создать новую папку</DialogTitle>
              </DialogHeader>
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
                        e.preventDefault()
                        handleCreateFolder()
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setShowCreateFolder(false)
                      setNewFolderName("")
                    }}
                  >
                    Отмена
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleCreateFolder} 
                    disabled={!newFolderName.trim()}
                  >
                    Создать
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Диалог переименования папки */}
        {showRenameFolder && (
          <Dialog open={showRenameFolder} onOpenChange={setShowRenameFolder}>
            <DialogContent 
              className="sm:max-w-md"
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <DialogHeader>
                <DialogTitle>Переименовать папку</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rename-folder-name">Новое название папки</Label>
                  <Input
                    id="rename-folder-name"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Введите новое название папки"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleRenameFolder()
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setShowRenameFolder(false)
                      setRenamingFolderId(null)
                      setRenameValue("")
                    }}
                  >
                    Отмена
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleRenameFolder} 
                    disabled={!renameValue.trim()}
                  >
                    Переименовать
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Футер */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-500">
            {filteredFiles.length} элемент(ов) • Папка: {breadcrumbs[breadcrumbs.length - 1]?.name}
          </p>
          <Button type="button" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}