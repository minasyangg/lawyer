"use client"

import { useState, useEffect } from "react"
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
  Image, 
  Trash2, 
  Download,
  Search,
  Grid,
  List
} from "lucide-react"

interface FileItem {
  id: number
  originalName: string
  filename: string
  mimeType: string
  size: number
  createdAt: string
  url: string
}

interface FileManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelect?: (file: FileItem) => void
  selectMode?: boolean
}

export function FileManager({ isOpen, onClose, onSelect, selectMode = false }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (isOpen) {
      fetchFiles()
    }
  }, [isOpen])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/files')
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files)
      }
    } catch (error) {
      console.error('Failed to fetch files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFiles(prev => [data.file, ...prev])
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setFiles(prev => prev.filter(file => file.id !== fileId))
        setSelectedFiles(prev => {
          const newSet = new Set(prev)
          newSet.delete(fileId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const handleFileSelect = (file: FileItem) => {
    if (selectMode && onSelect) {
      onSelect(file)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>File Manager</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex justify-between items-center gap-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Button 
              disabled={uploading}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <div className="flex border rounded">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* File Grid/List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No files found
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-4 gap-4 p-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`border rounded-lg p-3 cursor-pointer hover:border-blue-300 transition-colors ${
                    selectedFiles.has(file.id) ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleFileSelect(file)}
                >
                  <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
                    {isImage(file.mimeType) ? (
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <File className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                  <div className="flex justify-end mt-2">
                    <Button
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
                    onClick={() => handleFileSelect(file)}
                  >
                    <div className="flex-shrink-0">
                      {isImage(file.mimeType) ? (
                        <Image className="w-6 h-6 text-blue-500" />
                      ) : (
                        <File className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-500">
            {filteredFiles.length} files total
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}