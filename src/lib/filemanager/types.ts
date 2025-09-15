import { UserRole } from '@prisma/client'

// Типы для файлового менеджера
export interface FileManagerFile {
  id: number
  originalName: string
  filename: string
  path: string
  virtualPath: string
  virtualId?: string
  mimeType: string
  size: number
  uploadedBy: number
  folderId?: number
  createdAt: Date
  uploader?: {
    id: number
    name: string
    email: string
    role: UserRole
  }
  folder?: {
    id: number
    name: string
    path: string
  }
}

export interface FileManagerFolder {
  id: number
  name: string
  path: string
  virtualPath?: string
  virtualId?: string
  ownerId: number
  parentId?: number
  createdAt: Date
  owner?: {
    id: number
    name: string
    email: string
    role: UserRole
  }
  parent?: {
    id: number
    name: string
  }
  children?: FileManagerFolder[]
  files?: FileManagerFile[]
}

// Разрешения для ролей
export interface RolePermissions {
  canViewAllFiles: boolean      // Может просматривать все файлы
  canViewOwnFiles: boolean      // Может просматривать свои файлы
  canUploadFiles: boolean       // Может загружать файлы
  canDeleteOwnFiles: boolean    // Может удалять свои файлы
  canDeleteAllFiles: boolean    // Может удалять любые файлы
  canCreateFolders: boolean     // Может создавать папки
  canManageFolders: boolean     // Может управлять структурой папок
  canViewFileDetails: boolean   // Может видеть детали файлов (автора, размер и т.д.)
  maxFileSize: number          // Максимальный размер файла в байтах
  allowedMimeTypes: string[]   // Разрешенные типы файлов
}

// Результаты операций
export interface FileManagerResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface UploadFileResult {
  success: boolean
  files: FileManagerFile[]
  error?: string
}

export interface DeleteResult {
  success: boolean
  deletedIds: number[]
  error?: string
}

// Фильтры для поиска файлов
export interface FileListFilters {
  folderId?: number
  uploadedBy?: number
  mimeTypes?: string[]
  searchQuery?: string
  sortBy?: 'name' | 'size' | 'createdAt' | 'mimeType'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// Интерфейс провайдера файлового менеджера
export interface FileManagerProvider {
  userRole: UserRole
  userId: number
  permissions: RolePermissions
  
  // Основные операции
  listFiles(filters?: FileListFilters): Promise<FileManagerResult<FileManagerFile[]>>
  listFolders(parentId?: number): Promise<FileManagerResult<FileManagerFolder[]>>
  getFolderTree(): Promise<FileManagerResult<FileManagerFolder[]>>
  
  // Загрузка файлов
  uploadFiles(files: File[], folderId?: number): Promise<UploadFileResult>
  
  // Управление файлами
  deleteFile(fileId: number): Promise<DeleteResult>
  deleteFiles(fileIds: number[]): Promise<DeleteResult>
  getFileUrl(fileId: number): Promise<FileManagerResult<string>>
  getFileDetails(fileId: number): Promise<FileManagerResult<FileManagerFile>>
  
  // Управление папками
  createFolder(name: string, parentId?: number): Promise<FileManagerResult<FileManagerFolder>>
  deleteFolder(folderId: number): Promise<DeleteResult>
  renameFolder(folderId: number, newName: string): Promise<FileManagerResult<FileManagerFolder>>
  
  // Проверка прав
  canAccessFile(fileId: number): Promise<boolean>
  canAccessFolder(folderId: number): Promise<boolean>
  validateFileUpload(file: File): FileManagerResult<void>
  
  // Поиск
  searchFiles(query: string, filters?: FileListFilters): Promise<FileManagerResult<FileManagerFile[]>>
}

// Конфигурация разрешений по ролям
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: {
    canViewAllFiles: true,
    canViewOwnFiles: true,
    canUploadFiles: true,
    canDeleteOwnFiles: true,
    canDeleteAllFiles: true,
    canCreateFolders: true,
    canManageFolders: true,
    canViewFileDetails: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB для админа
    allowedMimeTypes: [
      // Изображения
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Документы
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Архивы
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
      // Текстовые файлы
      'text/plain', 'text/csv',
      // Видео
      'video/mp4', 'video/webm', 'video/ogg'
    ]
  },
  
  EDITOR: {
    canViewAllFiles: false,
    canViewOwnFiles: true,
    canUploadFiles: true,
    canDeleteOwnFiles: true,
    canDeleteAllFiles: false,
    canCreateFolders: true,
    canManageFolders: false, // Может создавать, но не может управлять чужими папками
    canViewFileDetails: true,
    maxFileSize: 25 * 1024 * 1024, // 25MB для редактора
    allowedMimeTypes: [
      // Изображения
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      // Документы
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Текстовые файлы
      'text/plain'
    ]
  },
  
  USER: {
    canViewAllFiles: false,
    canViewOwnFiles: true,
    canUploadFiles: false, // Обычные пользователи не могут загружать файлы
    canDeleteOwnFiles: false,
    canDeleteAllFiles: false,
    canCreateFolders: false,
    canManageFolders: false,
    canViewFileDetails: false, // Не видят детали файлов
    maxFileSize: 0,
    allowedMimeTypes: []
  }
}