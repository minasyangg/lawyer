"use client"

import React from 'react'
import { Folder, Trash2, Download, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileItem, UserRole } from '../types'
import { getFileTypeIcon } from "@/lib/filemanager/preview"

interface FileListProps {
  files: FileItem[]
  deletingFiles: Set<number>
  onFileClick: (file: FileItem) => void
  onDeleteClick: (file: FileItem) => void
  onDownloadClick: (file: FileItem) => void
  onEditFolderClick: (file: FileItem) => void
  userRole: UserRole
  mode?: 'full' | 'dialog'
}

export function FileList({
  files,
  deletingFiles,
  onFileClick,
  onDeleteClick,
  onDownloadClick,
  onEditFolderClick,
  userRole,
  mode = 'full'
}: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Папка пуста</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map(file => {
        const isDeleting = deletingFiles.has(file.id)
        
        return (
          <div
            key={`${file.isFolder ? 'folder' : 'file'}-${file.id}`}
            className={`flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:bg-gray-50 ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            onClick={() => !isDeleting && onFileClick(file)}
          >
            {/* Оверлей для удаления */}
            {isDeleting && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded">
                <div className="flex items-center text-white">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="text-sm">Удаление...</span>
                </div>
              </div>
            )}
            
            <div className="flex items-center flex-1 min-w-0">
              {/* Иконка */}
              <div className="flex-shrink-0 mr-3">
                {file.isFolder ? (
                  <Folder className="w-6 h-6 text-blue-500" />
                ) : (
                  <div className="w-6 h-6 flex items-center justify-center text-lg">
                    {getFileTypeIcon(file.mimeType)}
                  </div>
                )}
              </div>
              
              {/* Информация о файле */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-medium truncate" title={file.originalName}>
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                        {file.isFolder ? 'Папка' : formatFileSize(file.size || 0)}
                        {!file.isFolder && file.isUsed && (
                          <span className="ml-2 text-green-500">• Используется</span>
                        )}
                        {file.createdAt && (
                          <span className="ml-2">
                            • {new Date(file.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </p>
                    </div>
                </div>
              </div>
            </div>

            {/* Действия */}
            {mode === 'full' && (
              <div className="flex items-center space-x-2 ml-4">
                {!file.isFolder && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDownloadClick(file)
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                
                {file.isFolder && (userRole === 'ADMIN' || userRole === 'EDITOR') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditFolderClick(file)
                    }}
                    title="Переименовать"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                
                {(userRole === 'ADMIN' || userRole === 'EDITOR') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!file.isUsed) onDeleteClick(file)
                    }}
                    className="text-red-600 hover:text-red-700"
                    disabled={!!file.isUsed}
                    title={file.isUsed ? 'Файл используется' : 'Удалить'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
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