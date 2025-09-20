import { useState, useEffect, useCallback } from 'react'
import { listFiles, getFolderTree } from '@/app/actions/filemanager'
import { FileItem, FolderTreeNode, PaginationState, UserRole } from '../types'
import { filterFiles, sortFiles } from '../utils'

interface UseFileManagerOptions {
  userRole: UserRole
  initialFolderId?: number | null
}

export function useFileManager({ userRole, initialFolderId = null }: UseFileManagerOptions) {
  // Основное состояние
  const [files, setFiles] = useState<FileItem[]>([])
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(initialFolderId)
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Фильтрованные файлы
  const filteredFiles = sortFiles(filterFiles(files, searchTerm))

  // Загрузка файлов
  const loadFiles = useCallback(async (folderId: number | null = null, page: number = 1) => {
    setLoading(true)
    try {
      const result = await listFiles(folderId, page, 20)
      
      // result содержит files и pagination напрямую
      setFiles(result.files)
      setPagination(result.pagination)
      setCurrentPage(page)
    } catch (error) {
      console.error('Load files error:', error)
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
      console.error('Load folder tree error:', error)
    }
  }, [])

  // Навигация к папке
  const navigateToFolder = useCallback(async (folderId: number | null, folderPath: string = "") => {
    setCurrentFolderId(folderId)
    setCurrentFolderPath(folderPath)
    setCurrentPage(1)
    await loadFiles(folderId, 1)
  }, [loadFiles])

  // Обновление данных
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadFiles(currentFolderId, currentPage),
      loadFolderTree()
    ])
  }, [loadFiles, loadFolderTree, currentFolderId, currentPage])

  // Инициализация
  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Обновление фильтра при изменении поискового запроса
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  return {
    // Состояние
    files,
    folderTree,
    currentFolderId,
    currentFolderPath,
    loading,
    searchTerm,
    filteredFiles,
    currentPage,
    pagination,
    userRole,

    // Действия
    setFiles,
    setFolderTree,
    loadFiles,
    loadFolderTree,
    navigateToFolder,
    refreshData,
    handleSearch,
    setCurrentPage
  }
}