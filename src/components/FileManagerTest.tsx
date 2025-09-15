"use client"

import { useState, useEffect } from 'react'
import { uploadFiles, getFilesList, deleteFile } from '@/app/actions/filemanager/files'
import { getFoldersList, createFolder } from '@/app/actions/filemanager/folders'
import { getUserFilePermissions } from '@/app/actions/filemanager/editor'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { FileManagerFile, FileManagerFolder } from '@/lib/filemanager/types'

interface UserPermissions {
  canUpload: boolean
  canDelete: boolean
  canViewAll: boolean
  canManageFolders: boolean
  maxFileSize: number
  allowedTypes: string[]
}

export default function FileManagerTest() {
  const [files, setFiles] = useState<FileManagerFile[]>([])
  const [folders, setFolders] = useState<FileManagerFolder[]>([])
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Загружаем файлы, папки и разрешения параллельно
      const [filesResult, foldersResult, permissionsResult] = await Promise.all([
        getFilesList(),
        getFoldersList(),
        getUserFilePermissions()
      ])

      if (filesResult.success) {
        setFiles(filesResult.files)
      } else {
        toast.error('Ошибка загрузки файлов: ' + filesResult.error)
      }

      if (foldersResult.success) {
        setFolders(foldersResult.folders)
      } else {
        toast.error('Ошибка загрузки папок: ' + foldersResult.error)
      }

      if (permissionsResult.success) {
        setPermissions(permissionsResult.permissions)
      } else {
        toast.error('Ошибка загрузки разрешений: ' + permissionsResult.error)
      }
    } catch (error) {
      toast.error('Ошибка загрузки данных')
      console.error('Load data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files
    if (!uploadedFiles || uploadedFiles.length === 0) return

    const formData = new FormData()
    Array.from(uploadedFiles).forEach(file => {
      formData.append('files', file)
    })

    setLoading(true)
    try {
      const result = await uploadFiles(formData)
      
      if (result.success) {
        toast.success(`Загружено ${result.files.length} файлов`)
        await loadData() // Перезагружаем данные
      } else {
        toast.error('Ошибка загрузки: ' + result.error)
      }
    } catch (error) {
      toast.error('Ошибка загрузки файлов')
      console.error('Upload error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Удалить файл?')) return

    setLoading(true)
    try {
      const result = await deleteFile(fileId)
      
      if (result.success) {
        toast.success('Файл удален')
        await loadData() // Перезагружаем данные
      } else {
        toast.error('Ошибка удаления: ' + result.error)
      }
    } catch (error) {
      toast.error('Ошибка удаления файла')
      console.error('Delete error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Введите имя папки')
      return
    }

    setLoading(true)
    try {
      const result = await createFolder(newFolderName.trim())
      
      if (result.success) {
        toast.success('Папка создана')
        setNewFolderName('')
        await loadData() // Перезагружаем данные
      } else {
        toast.error('Ошибка создания папки: ' + result.error)
      }
    } catch (error) {
      toast.error('Ошибка создания папки')
      console.error('Create folder error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !files.length && !folders.length) {
    return (
      <div className="p-6">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Тест файлового менеджера</h1>
      
      {/* Разрешения пользователя */}
      {permissions && (
        <Card>
          <CardHeader>
            <CardTitle>Разрешения пользователя</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Загрузка файлов: {permissions.canUpload ? '✅' : '❌'}</div>
              <div>Удаление файлов: {permissions.canDelete ? '✅' : '❌'}</div>
              <div>Просмотр всех файлов: {permissions.canViewAll ? '✅' : '❌'}</div>
              <div>Управление папками: {permissions.canManageFolders ? '✅' : '❌'}</div>
              <div>Макс. размер файла: {Math.round(permissions.maxFileSize / 1024 / 1024)}MB</div>
              <div>Разрешенные типы: {permissions.allowedTypes.length} типов</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Загрузка файлов */}
      {permissions?.canUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Загрузка файлов</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={loading}
            />
          </CardContent>
        </Card>
      )}

      {/* Создание папки */}
      {permissions?.canManageFolders && (
        <Card>
          <CardHeader>
            <CardTitle>Создание папки</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Имя папки"
              disabled={loading}
            />
            <Button onClick={handleCreateFolder} disabled={loading}>
              Создать
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Список папок */}
      <Card>
        <CardHeader>
          <CardTitle>Папки ({folders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {folders.map((folder) => (
              <div key={folder.id} className="p-2 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">📁 {folder.name}</div>
                  <div className="text-sm text-gray-500">{folder.path}</div>
                </div>
              </div>
            ))}
            {folders.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                Папок нет
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Список файлов */}
      <Card>
        <CardHeader>
          <CardTitle>Файлы ({files.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {files.map((file) => (
              <div key={file.id} className="p-2 border rounded flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-medium">{file.originalName}</div>
                  <div className="text-sm text-gray-500">
                    {file.mimeType} • {Math.round(file.size / 1024)}KB
                  </div>
                </div>
                {permissions?.canDelete && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteFile(file.id)}
                    disabled={loading}
                  >
                    Удалить
                  </Button>
                )}
              </div>
            ))}
            {files.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                Файлов нет
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}