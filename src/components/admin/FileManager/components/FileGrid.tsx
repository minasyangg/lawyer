"use client"

import React from 'react'
import { Folder, Trash2, Download, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileItem, UserRole } from '../types'
import { getFileTypeIcon, getFileTypeName } from "@/lib/filemanager/preview"
import { FileImage } from './FileImage'

interface FileGridProps {
  files: FileItem[]
  deletingFiles: Set<number>
  onFileClick: (file: FileItem) => void
  onDeleteClick: (file: FileItem) => void
  onDownloadClick: (file: FileItem) => void
  onEditFolderClick: (file: FileItem) => void
  userRole: UserRole
  mode?: 'full' | 'dialog'
}

export function FileGrid({
  files,
  deletingFiles,
  onFileClick,
  onDeleteClick,
  onDownloadClick,
  onEditFolderClick,
  userRole,
  mode = 'full'
}: FileGridProps) {
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Папка пуста</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {files.map(file => {
        const isDeleting = deletingFiles.has(file.id)
        
        return (
          <div
            key={`${file.isFolder ? 'folder' : 'file'}-${file.id}`}
            className={`group relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            onClick={() => !isDeleting && onFileClick(file)}
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
            
            {/* Иконка файла/папки */}
            <div className="flex flex-col items-center">
              {file.isFolder ? (
                <Folder className="w-12 h-12 text-blue-500 mb-2" />
              ) : file.mimeType.startsWith('image/') ? (
                <div className="w-12 h-12 mb-2 relative">
                  <FileImage
                    src={file.url}
                    alt={file.originalName}
                    fill
                    className="object-cover rounded"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 mb-2 flex flex-col items-center justify-center bg-gray-100 rounded">
                  <div className="text-2xl mb-1">{getFileTypeIcon(file.mimeType)}</div>
                  <div className="text-xs text-gray-600 text-center leading-tight">
                    {getFileTypeName(file.mimeType)}
                  </div>
                </div>
              )}
              
              {/* Название файла */}
              <p className="text-sm text-center truncate w-full" title={file.originalName}>
                {file.originalName}
              </p>
              
              {/* Информация о файле */}
              <div className="text-xs text-gray-400 mt-1 text-center">
                {file.isFolder ? 'Папка' : formatFileSize(file.size || 0)}
                {!file.isFolder && file.isUsed && (
                  <div className="text-green-500 text-xs mt-1">
                    ● Используется
                  </div>
                )}
              </div>
            </div>

            {/* Действия */}
            {mode === 'full' && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  {!file.isFolder && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDownloadClick(file)
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {file.isFolder && (userRole === 'ADMIN' || userRole === 'EDITOR') && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditFolderClick(file)
                      }}
                      className="h-6 w-6 p-0"
                      title="Переименовать"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {(userRole === 'ADMIN' || userRole === 'EDITOR') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!file.isUsed) onDeleteClick(file)
                      }}
                      className="h-6 w-6 p-0"
                      disabled={!!file.isUsed}
                      title={file.isUsed ? 'Файл используется' : 'Удалить'}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}