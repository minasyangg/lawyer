"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Upload, 
  Search,
  Grid,
  List,
  FolderPlus,
  Loader2
} from "lucide-react"

interface ToolbarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onUploadClick: () => void
  onCreateFolderClick: () => void
  canCreateFolder: boolean
  uploadLoading: boolean
  createFolderLoading: boolean
}

export function Toolbar({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onUploadClick,
  onCreateFolderClick,
  canCreateFolder,
  uploadLoading,
  createFolderLoading
}: ToolbarProps) {
  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between mb-4">
        {/* Панель поиска */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск файлов..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Действия */}
        <div className="flex items-center space-x-2">
          <Button 
            onClick={onUploadClick}
            disabled={uploadLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {uploadLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Загрузить файл
          </Button>
          
          {canCreateFolder && (
            <Button 
              onClick={onCreateFolderClick}
              disabled={createFolderLoading}
              variant="outline"
            >
              {createFolderLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FolderPlus className="h-4 w-4 mr-2" />
              )}
              Создать папку
            </Button>
          )}
          
          {/* Переключатель вида */}
          <div className="flex border rounded">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}