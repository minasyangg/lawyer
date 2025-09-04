"use client"

import { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Динамический импорт TinyMCE только на клиенте
const Editor = dynamic(
  () => import('@tinymce/tinymce-react').then((mod) => ({ default: mod.Editor })),
  { 
    ssr: false,
    loading: () => (
      <div 
        className="border border-gray-300 rounded bg-gray-50 animate-pulse flex items-center justify-center"
        style={{ height: '500px' }}
      >
        <div className="text-gray-400">Загрузка редактора...</div>
      </div>
    )
  }
)

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
  insertContent: (content: string) => void
}

interface FileItem {
  id: number
  url: string
  originalName: string
  mimeType: string
}

// Типы документов для вставки как ссылки
const DOCUMENT_MIME_TYPES: string[] = [
  'application/pdf',
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip',
  'application/x-rar-compressed',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]

// Функция для показа диалога выбора размера изображения
const showImageSizeDialog = (): { width: string; height: string | null } => {
  const width: string = prompt('Введите ширину изображения (в пикселях или процентах):', '100%') || '100%'
  const height: string | null = prompt('Введите высоту изображения (в пикселях или оставьте пустым для авто):', '') || null
  return { width, height }
}

// Функция для создания стиля изображения
const createImageStyle = (width: string, height: string | null): string => {
  return `max-width: 100%; width: ${width}; ${height ? `height: ${height};` : 'height: auto;'}`
}

// Функция для определения типа контента и создания соответствующего HTML
const createContentByMimeType = (file: FileItem, withSizeDialog: boolean = false): string => {
  const { url, originalName, mimeType } = file
  
  if (mimeType.startsWith('image/')) {
    if (withSizeDialog) {
      const { width, height } = showImageSizeDialog()
      const style = createImageStyle(width, height)
      return `<img src="${url}" alt="${originalName}" style="${style}" />`
    } else {
      return `<img src="${url}" alt="${originalName}" style="max-width: 100%; height: auto;" />`
    }
  } else if (mimeType.startsWith('video/')) {
    return `<video controls src="${url}" style="max-width: 100%; height: auto;"></video>`
  } else if (DOCUMENT_MIME_TYPES.includes(mimeType) || mimeType.startsWith('application/')) {
    return `<a href="${url}" target="_blank">${originalName}</a>`
  } else {
    // По умолчанию вставляем как ссылку
    return `<a href="${url}" target="_blank">${originalName}</a>`
  }
}

// Функция загрузки файла через общую систему файлового менеджера
const handleFileUpload = async (file: File): Promise<string> => {
  try {
    const formData = new FormData()
    formData.append('files', file)
    // Сохраняем в корневую папку пользователя (без указания folderId)
    
    const response = await fetch('/api/editor/upload', {
      method: 'POST',
      body: formData,
    })
    
    const result = await response.json()
    
    if (result.success) {
      return result.file.url
    } else {
      throw new Error(result.error || 'Upload failed')
    }
  } catch (error) {
    console.error('File upload error:', error)
    throw error
  }
}

export function RichTextEditor({ 
  value, 
  onChange, 
  onInit,
  height = 500
}: RichTextEditorProps) {
  const editorRef = useRef<TinyMCEEditor | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleEditorChange = (content: string): void => {
    onChange(content)
  }

  // Не рендерим редактор до клиентской гидратации
  if (!isClient) {
    return (
      <div 
        style={{ height: `${height}px` }}
        className="border border-gray-300 rounded bg-gray-50 animate-pulse flex items-center justify-center"
      >
        <div className="text-gray-400">Загрузка редактора...</div>
      </div>
    )
  }

  // Обработчик загрузки изображений через drag&drop и paste
  const handleImageUploadForTinyMCE = (blobInfo: BlobInfo): Promise<string> => {
    return new Promise((resolve, reject) => {
      const file = new File([blobInfo.blob()], blobInfo.filename(), { 
        type: blobInfo.blob().type 
      })

      handleFileUpload(file)
        .then(url => resolve(url))
        .catch(error => reject(error.message || 'Upload failed'))
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
          'insertdatetime', 'media', 'table', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | image media link filemanager | styleselect | ' +
          'table | code fullscreen | help',
        content_style: `
          body { 
            font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; 
            font-size: 14px; 
            line-height: 1.4; 
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 10px 0; 
            border: 1px solid #dee2e6;
          }
          th, td { 
            border: 1px solid #dee2e6; 
            padding: 8px;
          }
          th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .table-bordered { 
            border: 1px solid #dee2e6; 
          }
          .table-bordered th,
          .table-bordered td { 
            border: 1px solid #dee2e6; 
            padding: 8px; 
          }
          .table-striped tbody tr:nth-of-type(odd) { 
            background-color: rgba(0, 0, 0, 0.05); 
          }
          .table-header { 
            background-color: #f8f9fa; 
            font-weight: bold; 
          }
          .table-header-row { 
            background-color: #e9ecef; 
          }
          .table-alt-row { 
            background-color: #f8f9fa; 
          }
          .table-highlight { 
            background-color: #fff3cd; 
          }
        `,
        images_upload_handler: handleImageUploadForTinyMCE,
        automatic_uploads: true,
        file_picker_types: 'image',
        image_advtab: true,
        style_formats: [
          {
            title: 'Изображения',
            items: [
              {
                title: 'Изображение слева',
                selector: 'img',
                styles: {
                  'float': 'left',
                  'margin': '0 15px 10px 0',
                  'max-width': '100%'
                }
              },
              {
                title: 'Изображение справа',
                selector: 'img',
                styles: {
                  'float': 'right',
                  'margin': '0 0 10px 15px',
                  'max-width': '100%'
                }
              },
              {
                title: 'По центру',
                selector: 'img',
                styles: {
                  'display': 'block',
                  'margin': '10px auto',
                  'float': 'none',
                  'max-width': '100%'
                }
              },
              {
                title: 'Сброс обтекания',
                selector: 'img',
                styles: {
                  'float': 'none',
                  'margin': '0',
                  'display': 'inline',
                  'max-width': '100%'
                }
              }
            ]
          }
        ],
        table_default_attributes: {
          border: '1'
        },
        table_default_styles: {
          'border-collapse': 'collapse',
          'width': '100%',
          'border': '1px solid #dee2e6'
        },
        table_class_list: [
          {title: 'Обычная таблица', value: 'table'},
          {title: 'Таблица с границами', value: 'table table-bordered'},
          {title: 'Полосатая таблица', value: 'table table-striped'}
        ],
        table_cell_class_list: [
          {title: 'Обычная ячейка', value: ''},
          {title: 'Заголовок', value: 'table-header'},
          {title: 'Выделенная ячейка', value: 'table-highlight'}
        ],
        table_row_class_list: [
          {title: 'Обычная строка', value: ''},
          {title: 'Заголовочная строка', value: 'table-header-row'},
          {title: 'Альтернативная строка', value: 'table-alt-row'}
        ],
        table_advtab: true,
        table_cell_advtab: true,
        table_row_advtab: true,
        file_picker_callback: (
          callback: (url: string, meta?: { alt?: string; style?: string }) => void, 
          value: string, 
          meta: { filetype: string }
        ) => {
          if (meta.filetype === 'image') {
            const input = document.createElement('input')
            input.setAttribute('type', 'file')
            input.setAttribute('accept', 'image/*')
            
            input.addEventListener('change', async (e: Event) => {
              const target = e.target as HTMLInputElement
              const file = target.files?.[0]
              if (file) {
                try {
                  const url = await handleFileUpload(file)
                  
                  // Показываем диалог выбора размера
                  const { width, height } = showImageSizeDialog()
                  const style = createImageStyle(width, height)
                  
                  // Вставляем изображение с выбранными размерами
                  callback(url, { 
                    alt: file.name,
                    style 
                  })
                } catch (error) {
                  console.error('Upload failed:', error)
                }
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
              const event = new CustomEvent('openFileManager', {
                detail: {
                  selectMode: true,
                  onSelect: (file: FileItem) => {
                    const content = createContentByMimeType(file, file.mimeType.startsWith('image/'))
                    editor.insertContent(content)
                  }
                }
              })
              window.dispatchEvent(event)
            }
          })
        }
      }}
    />
  )
}