"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Download, Trash2, Plus } from "lucide-react"
import FileManager from "./FileManager/FileManager"

interface DocumentItem {
  id: number
  name: string
  url: string
  size: number
  mimeType: string
}

interface DocumentManagerProps {
  documents: DocumentItem[]
  onDocumentsChange: (documents: DocumentItem[]) => void
}

export function DocumentManager({ documents, onDocumentsChange }: DocumentManagerProps) {
  const [fileManagerOpen, setFileManagerOpen] = useState(false)

interface FileItem {
  id: number
  originalName: string
  url: string
  size: number
  mimeType: string
}

  const handleAddDocument = (file: FileItem) => {
    // Проверяем, что это документ (не изображение)
    if (file.mimeType.startsWith('image/')) {
      return // Игнорируем изображения
    }

    const newDocument: DocumentItem = {
      id: file.id,
      name: file.originalName,
      url: file.url,
      size: file.size,
      mimeType: file.mimeType
    }

    // Проверяем, что документ не был уже добавлен
    if (!documents.find(doc => doc.id === file.id)) {
      onDocumentsChange([...documents, newDocument])
    }
  }

  const handleRemoveDocument = (documentId: number) => {
    onDocumentsChange(documents.filter(doc => doc.id !== documentId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <>
      {documents.length === 0 ? (
        <div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={(e) => {
              e.preventDefault();
              setFileManagerOpen(true);
            }}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить документы
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Документы к статье</CardTitle>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                setFileManagerOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={document.name}>
                      {document.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(document.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(document.url, '_blank')}
                      title="Скачать"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDocument(document.id)}
                      title="Удалить из статьи"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {fileManagerOpen && (
        <Dialog open={fileManagerOpen} onOpenChange={setFileManagerOpen}>
          <DialogContent className="max-w-6xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>Выберите файл</DialogTitle>
            </DialogHeader>
            <FileManager userRole="ADMIN" />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}