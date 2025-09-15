import { PrismaClient, UserRole } from '@prisma/client'
import { 
  FileManagerProvider, 
  FileManagerFile, 
  FileManagerFolder, 
  FileManagerResult, 
  UploadFileResult, 
  DeleteResult, 
  FileListFilters,
  RolePermissions,
  ROLE_PERMISSIONS 
} from './types'
import { saveFileUniversalWithDetails, generateFileName, getFolderPhysicalPath } from '@/lib/utils/file-utils'
import { generateVirtualPath, createVirtualFileUrl } from '@/lib/virtualPaths'

const prisma = new PrismaClient()

export class RoleBasedFileManagerProvider implements FileManagerProvider {
  userRole: UserRole
  userId: number
  permissions: RolePermissions

  constructor(userRole: UserRole, userId: number) {
    this.userRole = userRole
    this.userId = userId
    this.permissions = ROLE_PERMISSIONS[userRole]
  }

  /**
   * Получение списка файлов с учетом прав доступа
   */
  async listFiles(filters: FileListFilters = {}): Promise<FileManagerResult<FileManagerFile[]>> {
    try {
      const where: Record<string, unknown> = {}

      // Фильтрация по правам доступа
      if (!this.permissions.canViewAllFiles) {
        where.uploadedBy = this.userId
      }

      // Применяем дополнительные фильтры
      if (filters.folderId !== undefined) {
        where.folderId = filters.folderId
      }

      if (filters.uploadedBy && this.permissions.canViewAllFiles) {
        where.uploadedBy = filters.uploadedBy
      }

      if (filters.mimeTypes?.length) {
        where.mimeType = { in: filters.mimeTypes }
      }

      if (filters.searchQuery) {
        where.OR = [
          { originalName: { contains: filters.searchQuery, mode: 'insensitive' } },
          { filename: { contains: filters.searchQuery, mode: 'insensitive' } }
        ]
      }

      const orderBy: Record<string, 'asc' | 'desc'> = {}
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortOrder || 'desc'
      } else {
        orderBy.createdAt = 'desc'
      }

      const files = await prisma.file.findMany({
        where,
        orderBy,
        take: filters.limit,
        skip: filters.offset,
        include: {
          uploader: this.permissions.canViewFileDetails ? {
            select: { id: true, name: true, email: true, role: true }
          } : false,
          folder: {
            select: { id: true, name: true, path: true }
          }
        }
      })

      return {
        success: true,
        data: files as FileManagerFile[]
      }
    } catch (error) {
      console.error('Error listing files:', error)
      return {
        success: false,
        error: 'Failed to list files'
      }
    }
  }

  /**
   * Получение списка папок с учетом прав доступа
   */
  async listFolders(parentId?: number): Promise<FileManagerResult<FileManagerFolder[]>> {
    try {
      const where: Record<string, unknown> = { parentId: parentId || null }

      // Фильтрация по правам доступа
      if (!this.permissions.canViewAllFiles) {
        where.ownerId = this.userId
      }

      const folders = await prisma.folder.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          owner: this.permissions.canViewFileDetails ? {
            select: { id: true, name: true, email: true, role: true }
          } : false,
          parent: {
            select: { id: true, name: true }
          },
          children: {
            select: { id: true, name: true, path: true, ownerId: true, createdAt: true }
          },
          files: {
            select: { id: true, originalName: true, mimeType: true, size: true }
          }
        }
      })

      return {
        success: true,
        data: folders as unknown as FileManagerFolder[]
      }
    } catch (error) {
      console.error('Error listing folders:', error)
      return {
        success: false,
        error: 'Failed to list folders'
      }
    }
  }

  /**
   * Получение дерева папок
   */
  async getFolderTree(): Promise<FileManagerResult<FileManagerFolder[]>> {
    try {
      const where: Record<string, unknown> = { parentId: null }

      if (!this.permissions.canViewAllFiles) {
        where.ownerId = this.userId
      }

      const rootFolders = await prisma.folder.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          children: {
            include: {
              children: {
                select: { id: true, name: true, path: true, ownerId: true, createdAt: true }
              }
            }
          }
        }
      })

      return {
        success: true,
        data: rootFolders as unknown as FileManagerFolder[]
      }
    } catch (error) {
      console.error('Error getting folder tree:', error)
      return {
        success: false,
        error: 'Failed to get folder tree'
      }
    }
  }

  /**
   * Загрузка файлов
   */
  async uploadFiles(files: File[], folderId?: number): Promise<UploadFileResult> {
    if (!this.permissions.canUploadFiles) {
      return {
        success: false,
        files: [],
        error: 'Upload permission denied'
      }
    }

    try {
      const uploadedFiles: FileManagerFile[] = []

      // Проверяем доступ к папке если указана
      if (folderId && !(await this.canAccessFolder(folderId))) {
        return {
          success: false,
          files: [],
          error: 'Folder access denied'
        }
      }

      for (const file of files) {
        // Валидация файла
        const validation = this.validateFileUpload(file)
        if (!validation.success) {
          return {
            success: false,
            files: [],
            error: validation.error
          }
        }

        // Загружаем файл
        const filename = generateFileName(file.name)
        const folderPhysicalPath = await getFolderPhysicalPath(folderId || null)
        
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const fileDetails = await saveFileUniversalWithDetails(
          buffer, 
          filename, 
          this.userId, 
          file.type, 
          folderPhysicalPath || undefined
        )

        // Генерируем виртуальный путь и ID
        const virtualPath = folderId ? await generateVirtualPath(folderId) : `/user_${this.userId}`
        const { randomBytes } = await import('crypto')
        const virtualId = randomBytes(12).toString('base64url')

        // Сохраняем в базу данных
        const dbFile = await prisma.file.create({
          data: {
            originalName: file.name,
            filename: filename,
            path: fileDetails.path,
            virtualPath: virtualPath,
            virtualId: virtualId,
            mimeType: file.type,
            size: file.size,
            uploadedBy: this.userId,
            folderId: folderId,
          },
          include: {
            uploader: this.permissions.canViewFileDetails ? {
              select: { id: true, name: true, email: true, role: true }
            } : false,
            folder: {
              select: { id: true, name: true, path: true }
            }
          }
        })

        uploadedFiles.push(dbFile as FileManagerFile)
      }

      return {
        success: true,
        files: uploadedFiles
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      return {
        success: false,
        files: [],
        error: 'Upload failed'
      }
    }
  }

  /**
   * Удаление файла
   */
  async deleteFile(fileId: number): Promise<DeleteResult> {
    try {
      if (!(await this.canAccessFile(fileId))) {
        return {
          success: false,
          deletedIds: [],
          error: 'File access denied'
        }
      }

      await prisma.file.delete({
        where: { id: fileId }
      })

      return {
        success: true,
        deletedIds: [fileId]
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      return {
        success: false,
        deletedIds: [],
        error: 'Delete failed'
      }
    }
  }

  /**
   * Удаление нескольких файлов
   */
  async deleteFiles(fileIds: number[]): Promise<DeleteResult> {
    try {
      const deletedIds: number[] = []

      for (const fileId of fileIds) {
        if (await this.canAccessFile(fileId)) {
          await prisma.file.delete({
            where: { id: fileId }
          })
          deletedIds.push(fileId)
        }
      }

      return {
        success: true,
        deletedIds
      }
    } catch (error) {
      console.error('Error deleting files:', error)
      return {
        success: false,
        deletedIds: [],
        error: 'Delete failed'
      }
    }
  }

  /**
   * Получение URL файла
   */
  async getFileUrl(fileId: number): Promise<FileManagerResult<string>> {
    try {
      if (!(await this.canAccessFile(fileId))) {
        return {
          success: false,
          error: 'File access denied'
        }
      }

      const file = await prisma.file.findUnique({
        where: { id: fileId },
        select: { virtualId: true, path: true }
      })

      if (!file) {
        return {
          success: false,
          error: 'File not found'
        }
      }

      const url = file.virtualId ? createVirtualFileUrl(file.virtualId) : `/api/files/${fileId}`

      return {
        success: true,
        data: url
      }
    } catch (error) {
      console.error('Error getting file URL:', error)
      return {
        success: false,
        error: 'Failed to get file URL'
      }
    }
  }

  /**
   * Получение детальной информации о файле
   */
  async getFileDetails(fileId: number): Promise<FileManagerResult<FileManagerFile>> {
    try {
      if (!(await this.canAccessFile(fileId))) {
        return {
          success: false,
          error: 'File access denied'
        }
      }

      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: {
          uploader: this.permissions.canViewFileDetails ? {
            select: { id: true, name: true, email: true, role: true }
          } : false,
          folder: {
            select: { id: true, name: true, path: true }
          }
        }
      })

      if (!file) {
        return {
          success: false,
          error: 'File not found'
        }
      }

      return {
        success: true,
        data: file as FileManagerFile
      }
    } catch (error) {
      console.error('Error getting file details:', error)
      return {
        success: false,
        error: 'Failed to get file details'
      }
    }
  }

  /**
   * Создание папки
   */
  async createFolder(name: string, parentId?: number): Promise<FileManagerResult<FileManagerFolder>> {
    if (!this.permissions.canCreateFolders) {
      return {
        success: false,
        error: 'Folder creation permission denied'
      }
    }

    try {
      // Проверяем доступ к родительской папке если указана
      if (parentId && !(await this.canAccessFolder(parentId))) {
        return {
          success: false,
          error: 'Parent folder access denied'
        }
      }

      // Генерируем путь для папки
      const parentPath = parentId ? await getFolderPhysicalPath(parentId) : ''
      const folderPath = parentPath ? `${parentPath}/${name}` : name

      // Генерируем виртуальные данные
      const virtualPath = parentId ? await generateVirtualPath(parentId) + `/${name}` : `/user_${this.userId}/${name}`
      const { randomBytes } = await import('crypto')
      const virtualId = randomBytes(12).toString('base64url')

      const folder = await prisma.folder.create({
        data: {
          name,
          path: folderPath,
          virtualPath,
          virtualId,
          ownerId: this.userId,
          parentId
        },
        include: {
          owner: this.permissions.canViewFileDetails ? {
            select: { id: true, name: true, email: true, role: true }
          } : false,
          parent: {
            select: { id: true, name: true }
          }
        }
      })

      return {
        success: true,
        data: folder as FileManagerFolder
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      return {
        success: false,
        error: 'Folder creation failed'
      }
    }
  }

  /**
   * Удаление папки
   */
  async deleteFolder(folderId: number): Promise<DeleteResult> {
    try {
      if (!(await this.canAccessFolder(folderId))) {
        return {
          success: false,
          deletedIds: [],
          error: 'Folder access denied'
        }
      }

      // Удаляем папку и все вложенные файлы/папки (каскадное удаление в БД)
      await prisma.folder.delete({
        where: { id: folderId }
      })

      return {
        success: true,
        deletedIds: [folderId]
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
      return {
        success: false,
        deletedIds: [],
        error: 'Folder deletion failed'
      }
    }
  }

  /**
   * Переименование папки
   */
  async renameFolder(folderId: number, newName: string): Promise<FileManagerResult<FileManagerFolder>> {
    try {
      if (!(await this.canAccessFolder(folderId))) {
        return {
          success: false,
          error: 'Folder access denied'
        }
      }

      const folder = await prisma.folder.update({
        where: { id: folderId },
        data: { name: newName },
        include: {
          owner: this.permissions.canViewFileDetails ? {
            select: { id: true, name: true, email: true, role: true }
          } : false,
          parent: {
            select: { id: true, name: true }
          }
        }
      })

      return {
        success: true,
        data: folder as FileManagerFolder
      }
    } catch (error) {
      console.error('Error renaming folder:', error)
      return {
        success: false,
        error: 'Folder rename failed'
      }
    }
  }

  /**
   * Проверка доступа к файлу
   */
  async canAccessFile(fileId: number): Promise<boolean> {
    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        select: { uploadedBy: true }
      })

      if (!file) return false

      // ADMIN может видеть все файлы
      if (this.permissions.canViewAllFiles) return true

      // Другие роли могут видеть только свои файлы
      return this.permissions.canViewOwnFiles && file.uploadedBy === this.userId
    } catch (error) {
      console.error('Error checking file access:', error)
      return false
    }
  }

  /**
   * Проверка доступа к папке
   */
  async canAccessFolder(folderId: number): Promise<boolean> {
    try {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
        select: { ownerId: true }
      })

      if (!folder) return false

      // ADMIN может видеть все папки
      if (this.permissions.canViewAllFiles) return true

      // Другие роли могут видеть только свои папки
      return folder.ownerId === this.userId
    } catch (error) {
      console.error('Error checking folder access:', error)
      return false
    }
  }

  /**
   * Валидация загружаемого файла
   */
  validateFileUpload(file: File): FileManagerResult<void> {
    // Проверка размера
    if (file.size > this.permissions.maxFileSize) {
      return {
        success: false,
        error: `File too large. Maximum size: ${Math.round(this.permissions.maxFileSize / 1024 / 1024)}MB`
      }
    }

    // Проверка типа файла
    if (!this.permissions.allowedMimeTypes.includes(file.type)) {
      return {
        success: false,
        error: `File type not allowed: ${file.type}`
      }
    }

    return { success: true }
  }

  /**
   * Поиск файлов
   */
  async searchFiles(query: string, filters: FileListFilters = {}): Promise<FileManagerResult<FileManagerFile[]>> {
    return this.listFiles({
      ...filters,
      searchQuery: query
    })
  }
}