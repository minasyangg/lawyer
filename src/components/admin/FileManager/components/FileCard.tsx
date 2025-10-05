"use client"

import React, { memo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { File, Folder, Download, Edit2, Trash2 } from "lucide-react"
import Image from "next/image"
import { FileItem, UserRole } from '../types'
import { formatFileSize, canDeleteFile } from '../utils'

interface FileCardProps {
  file: FileItem
  userRole: UserRole
  viewMode: 'grid' | 'list'
  isDeleting: boolean
  onFileClick?: (file: FileItem) => void
  onDownload: (file: FileItem) => void
  onDeleteFile: (file: FileItem) => void
  onRenameFolder?: (folderId: number, currentName: string) => void
  editingFolder?: { id: number; name: string } | null
  onFolderRename?: (folderId: number, newName: string) => void
  onCancelEdit?: () => void
}

export const FileCard = memo(function FileCard({
  file,
  userRole,
  viewMode,
  isDeleting,
  onFileClick,
  onDownload,
  onDeleteFile,
  onRenameFolder,
  editingFolder,
  onFolderRename,
  onCancelEdit
}: FileCardProps) {
  const canDelete = canDeleteFile(file, userRole)
  const isEditing = editingFolder && editingFolder.id === file.id && file.isFolder

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newName = (e.target as HTMLInputElement).value.trim()
      if (newName && newName !== editingFolder?.name && onFolderRename) {
        onFolderRename(file.id, newName)
      } else if (onCancelEdit) {
        onCancelEdit()
      }
    } else if (e.key === 'Escape' && onCancelEdit) {
      onCancelEdit()
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newName = e.target.value.trim()
    if (newName && newName !== editingFolder?.name && onFolderRename) {
      onFolderRename(file.id, newName)
    } else if (onCancelEdit) {
      onCancelEdit()
    }
  }

  if (viewMode === 'grid') {
    return (
      <div
        className={`
          relative bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group
          ${isDeleting ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}
        `}
        onClick={() => !isDeleting && onFileClick?.(file)}
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
            {isEditing ? (
              <Input
                defaultValue={editingFolder.name}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
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
                  onDownload(file)
                }}
                className="h-6 w-6 p-0"
              >
                <Download className="w-3 h-3" />
              </Button>
            )}
            
            {file.isFolder && onRenameFolder && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRenameFolder(file.id, file.originalName)
                }}
                className="h-6 w-6 p-0 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            )}
            
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteFile(file)
                }}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 cursor-pointer"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // List режим
  return (
    <div
      className={`
        relative flex items-center p-3 border-b hover:bg-gray-50 transition-colors cursor-pointer
        ${isDeleting ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}
      `}
      onClick={() => !isDeleting && onFileClick?.(file)}
    >
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
          {isEditing ? (
            <Input
              defaultValue={editingFolder.name}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
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
              onDownload(file)
            }}
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
        
        {file.isFolder && onRenameFolder && (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onRenameFolder(file.id, file.originalName)
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
        
        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteFile(file)
            }}
            className="text-red-600 hover:text-red-700 cursor-pointer"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="w-4 h-4 border border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
})