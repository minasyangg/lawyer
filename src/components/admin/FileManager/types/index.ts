import { FileManagerItem, FolderTreeNode as BaseFolderTreeNode } from '@/app/actions/filemanager'

// Базовые типы
export type UserRole = 'ADMIN' | 'EDITOR'
export type ViewMode = 'grid' | 'list'

// Props для компонентов
export interface FileManagerProps {
  userRole: UserRole
  mode?: 'full' | 'dialog' // Новый пропс для режима отображения
  onFileSelect?: (file: FileItem) => void // Колбэк для выбора файла
}

export interface FileItem extends FileManagerItem {
  isFolder?: boolean
  path?: string
  parentId?: number | null
  isUsed?: boolean
}

// Используем базовый тип напрямую, так как у нас нет специфичных изменений
export type FolderTreeNode = BaseFolderTreeNode

export interface BreadcrumbItem {
  id: number | null
  name: string
}

export interface DialogStates {
  delete: {
    isOpen: boolean
    fileId: number | null
  }
}

export interface DeleteDialogState {
  isOpen: boolean
  fileId: number | null
  fileName: string
  isProtected: boolean
  usedIn: Array<{ id: number; title: string; type: 'content' | 'document' }>
  isFolder: boolean
}

export interface ConfirmDeleteDialogState {
  isOpen: boolean
  fileId: number | null
  fileName: string
  isFolder?: boolean
}

export interface RenameFolderModalState {
  id: number
  name: string
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  pages: number
}

export interface FileManagerPermissions {
  canUpload: boolean
  canDelete: boolean
  canDeleteUsed: boolean
  canDeleteOthers: boolean
  canManageFolders: boolean
}

export interface FileOperationCallbacks {
  onDeleteFile: (file: FileItem) => void
  onRenameFolder: (folderId: number, newName: string) => void
  onNavigateToFolder: (folderId: number | null, path?: string) => void
  onDownloadFile: (file: FileItem) => void
}

export interface FileManagerState {
  files: FileItem[]
  folderTree: FolderTreeNode[]
  currentFolderId: number | null
  currentFolderPath: string
  loading: boolean
  uploadLoading: boolean
  createFolderLoading: boolean
  searchTerm: string
  filteredFiles: FileItem[]
  viewMode: ViewMode
  isCreatingFolder: boolean
  newFolderName: string
  pagination: PaginationState
  currentPage: number
  deletingFiles: Set<number>
}