"use client"

import { useState, useEffect } from 'react'
import { getFile } from '@/app/actions/filemanager/getFile'

interface FileViewerProps {
  fileId: number
  className?: string
  alt?: string
}

export function FileViewer({ fileId, className = '', alt = 'File' }: FileViewerProps) {
  const [fileData, setFileData] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>('')

  useEffect(() => {
    async function loadFile() {
      try {
        setLoading(true)
        const result = await getFile(fileId)
        
        if (result.success && result.file) {
          // Конвертируем Buffer в base64 для отображения
          const base64 = Buffer.from(result.file.buffer).toString('base64')
          const dataUrl = `data:${result.file.mimeType};base64,${base64}`
          
          setFileData(dataUrl)
          setMimeType(result.file.mimeType)
          setError(null)
        } else {
          setError(result.error || 'Failed to load file')
        }
      } catch (err) {
        console.error('Error loading file:', err)
        setError('Failed to load file')
      } finally {
        setLoading(false)
      }
    }

    loadFile()
  }, [fileId])

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 text-red-500 ${className}`}>
        <span>Error: {error}</span>
      </div>
    )
  }

  if (!fileData) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <span>No file data</span>
      </div>
    )
  }

  // Для изображений показываем как img
  if (mimeType.startsWith('image/')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fileData}
        alt={alt}
        className={className}
        loading="lazy"
      />
    )
  }

  // Для других типов файлов показываем ссылку для скачивания
  return (
    <a
      href={fileData}
      download
      className={`inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${className}`}
    >
      Download File
    </a>
  )
}

export default FileViewer
