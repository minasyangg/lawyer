"use client"

import { useState, useEffect } from 'react'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { FileManager } from '@/components/admin/FileManager'

// Расширяем тип Window для callback
declare global {
  interface Window {
    fileManagerCallback?: ((file: FileItem) => void) | null
  }
}

interface FileItem {
  id: number
  url: string
  originalName: string
  mimeType: string
}

export default function RichTextEditorTest() {
  const [content, setContent] = useState('')
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Устанавливаем флаг, что мы на клиенте
    setIsClient(true)
    
    // Слушаем событие открытия файлового менеджера
    const handleOpenFileManager = (event: CustomEvent) => {
      setIsFileManagerOpen(true)
      // Сохраняем callback для выбора файла
      if (typeof window !== 'undefined') {
        window.fileManagerCallback = event.detail.onSelect
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('openFileManager', handleOpenFileManager as EventListener)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('openFileManager', handleOpenFileManager as EventListener)
      }
    }
  }, [])

  const handleFileManagerClose = (): void => {
    setIsFileManagerOpen(false)
    if (typeof window !== 'undefined') {
      window.fileManagerCallback = null
    }
  }

  const handleFileSelect = (file: FileItem): void => {
    if (typeof window !== 'undefined' && window.fileManagerCallback) {
      window.fileManagerCallback(file)
    }
    handleFileManagerClose()
  }

  // Не рендерим контент до тех пор, пока не убедимся, что мы на клиенте
  if (!isClient) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Тест RichTextEditor</h1>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-96 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Тест RichTextEditor</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Контент:
        </label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          height={400}
        />
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Результат HTML:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {content}
        </pre>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Предварительный просмотр:</h2>
        <div 
          className="border border-gray-300 p-4 rounded"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      {/* Файловый менеджер */}
      <FileManager
        isOpen={isFileManagerOpen}
        onClose={handleFileManagerClose}
        onSelect={handleFileSelect}
        selectMode={true}
      />
    </div>
  )
}
