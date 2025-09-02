"use client"

import { FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DocumentItem {
  id: number
  name: string
  url: string
  size: number
  mimeType: string
}

interface ArticleDocumentsProps {
  documents: DocumentItem[]
}

export function ArticleDocuments({ documents }: ArticleDocumentsProps) {
  if (!documents || documents.length === 0) {
    return null
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="border-t border-gray-200 pt-8 mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Документы к статье
      </h3>
      
      <div className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.id}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-gray-50"
          >
            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate" title={document.name}>
                {document.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(document.size)}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(document.url, '_blank')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Скачать
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}