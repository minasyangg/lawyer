"use client"

import { Editor } from '@tinymce/tinymce-react'
import { useRef } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  onInit?: () => void
  height?: number
  placeholder?: string
}

interface BlobInfo {
  blob: () => Blob
  filename: () => string
}

interface TinyMCEEditor {
  ui: {
    registry: {
      addButton: (name: string, config: {
        text: string
        tooltip: string
        icon: string
        onAction: () => void
      }) => void
    }
  }
}

export function RichTextEditor({ 
  value, 
  onChange, 
  onInit,
  height = 500
}: RichTextEditorProps) {
  const editorRef = useRef<Editor | null>(null)

  const handleEditorChange = (content: string) => {
    onChange(content)
  }

  const handleImageUpload = (blobInfo: BlobInfo): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', blobInfo.blob(), blobInfo.filename())

      fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          resolve(result.file.url)
        } else {
          reject(result.error || 'Upload failed')
        }
      })
      .catch(error => {
        reject(error.message || 'Upload failed')
      })
    })
  }

  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINY_API_KEY || "no-api-key"}
      onInit={(evt, editor) => {
        editorRef.current = editor
        onInit?.()
      }}
      value={value}
      onEditorChange={handleEditorChange}
      init={{
        height,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | image media link filemanager | code fullscreen | help',
        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; line-height: 1.4; }',
        images_upload_handler: handleImageUpload,
        automatic_uploads: true,
        file_picker_types: 'image',
        file_picker_callback: (callback: (url: string, meta?: { alt?: string }) => void, value: string, meta: { filetype: string }) => {
          if (meta.filetype === 'image') {
            const input = document.createElement('input')
            input.setAttribute('type', 'file')
            input.setAttribute('accept', 'image/*')
            
            input.addEventListener('change', (e: Event) => {
              const target = e.target as HTMLInputElement
              const file = target.files?.[0]
              if (file) {
                const formData = new FormData()
                formData.append('file', file)
                
                fetch('/api/upload', {
                  method: 'POST',
                  body: formData,
                })
                .then(response => response.json())
                .then(result => {
                  if (result.success) {
                    callback(result.file.url, { alt: file.name })
                  } else {
                    console.error('Upload failed:', result.error)
                  }
                })
                .catch(error => {
                  console.error('Upload error:', error)
                })
              }
            })
            
            input.click()
          }
        },
        setup: (editor: TinyMCEEditor) => {
          // Добавляем кнопку файлового менеджера
          editor.ui.registry.addButton('filemanager', {
            text: 'Files',
            tooltip: 'Open File Manager',
            icon: 'browse',
            onAction: () => {
              // Отправляем событие для открытия файлового менеджера
              const event = new CustomEvent('openFileManager')
              window.dispatchEvent(event)
            }
          })
        }
      }}
    />
  )
}