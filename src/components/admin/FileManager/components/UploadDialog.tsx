"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface UploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (files: File[]) => Promise<void>
  currentFolderId: number | null
  isUploading: boolean
}

export function UploadDialog({
  isOpen,
  onClose,
  onUpload,
  isUploading
}: UploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    
    try {
      await onUpload(selectedFiles)
      setSelectedFiles([])
      onClose()
    } catch (error) {
      console.error('Upload error:', error)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([])
      onClose()
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Загрузить файл</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Выберите файл</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
              multiple
              className="mt-1"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Файлов выбрано: {selectedFiles.length}</p>
                {selectedFiles.slice(0, 3).map((file, index) => (
                  <p key={index}>• {file.name} ({formatFileSize(file.size)})</p>
                ))}
                {selectedFiles.length > 3 && (
                  <p>... и еще {selectedFiles.length - 3} файлов</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Отмена
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Загружается...
                </>
              ) : (
                `Загрузить ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}