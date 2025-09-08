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
  getBody: () => HTMLElement
  selection: {
    getNode: () => HTMLElement
  }
  dom: {
    getPos: (element: HTMLElement) => { x: number; y: number }
  }
  on: (eventName: string, callback: (e: Event) => void) => void
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

// Функция для показа диалога выбора размера и стиля изображения
const showImageStyleDialog = (): { width: string; height: string | null; style: string; styleProps: string } => {
  // Сначала выбираем стиль обтекания
  const styles = [
    { name: 'Обычное изображение', float: 'none', margin: '10px 0', maxWidth: '100%' },
    { name: 'Изображение слева с обтеканием', float: 'left', margin: '0 15px 10px 0', maxWidth: '50%' },
    { name: 'Изображение справа с обтеканием', float: 'right', margin: '0 0 10px 15px', maxWidth: '50%' },
    { name: 'По центру', float: 'none', margin: '10px auto', maxWidth: '100%' },
    { name: 'Маленькое изображение слева', float: 'left', margin: '5px 15px 5px 0', maxWidth: '200px' }
  ]
  
  const styleOptions = styles.map((style, index) => `${index + 1}. ${style.name}`).join('\n')
  const choice = prompt(`Выберите стиль изображения (введите номер):\n${styleOptions}`, '1')
  
  const selectedIndex = parseInt(choice || '1') - 1
  const selectedStyle = styles[selectedIndex] || styles[0]
  
  // Затем выбираем размер
  const width: string = prompt('Введите ширину изображения (в пикселях или процентах):', selectedStyle.maxWidth === '200px' ? '200px' : '300px') || '300px'
  const height: string | null = prompt('Введите высоту изображения (в пикселях или оставьте пустым для авто):', '') || null
  
  // Формируем инлайн стили
  const styleProps = `float: ${selectedStyle.float}; margin: ${selectedStyle.margin}; max-width: ${selectedStyle.maxWidth}; width: ${width}; height: ${height || 'auto'}; display: ${selectedStyle.float === 'none' && selectedStyle.margin.includes('auto') ? 'block' : 'inline'};`
  
  return { 
    width, 
    height, 
    style: selectedStyle.name, 
    styleProps 
  }
}

// Функция для создания инлайн стилей изображения с обтеканием
const createImageStyleWithFloat = (floatDirection: 'left' | 'right' | 'center' | 'none', width: string, height: string | null): string => {
  const baseStyle = `width: ${width}; ${height ? `height: ${height};` : 'height: auto;'} max-width: 100%;`
  
  switch (floatDirection) {
    case 'left':
      return `${baseStyle} float: left; margin: 0 15px 10px 0; display: inline;`
    case 'right':
      return `${baseStyle} float: right; margin: 0 0 10px 15px; display: inline;`
    case 'center':
      return `${baseStyle} display: block; margin: 10px auto; float: none;`
    case 'none':
    default:
      return `${baseStyle} display: inline; margin: 0;`
  }
}

// Функция для определения позиции изображения в тексте
const determineImageFloat = (editor: TinyMCEEditor, x: number): 'left' | 'right' | 'center' => {
  try {
    const editorBody = editor.getBody()
    const bodyRect = editorBody.getBoundingClientRect()
    const bodyWidth = bodyRect.width
    
    // Вычисляем относительную позицию
    const relativeX = x - bodyRect.left
    const percentage = relativeX / bodyWidth
    
    if (percentage < 0.25) {
      return 'left'
    } else if (percentage > 0.75) {
      return 'right'
    } else {
      return 'center'
    }
  } catch (error) {
    console.error('Error determining float direction:', error)
    return 'left'
  }
}


// Функция для определения типа контента и создания соответствующего HTML
const createContentByMimeType = (file: FileItem, withStyleDialog: boolean = false): string => {
  const { url, originalName, mimeType } = file
  
  if (mimeType.startsWith('image/')) {
    if (withStyleDialog) {
      const { styleProps } = showImageStyleDialog()
      return `<img src="${url}" alt="${originalName}" style="${styleProps}" />`
    } else {
      // Без диалога используем адаптивный стиль
      return `<img src="${url}" alt="${originalName}" style="max-width: 100%; height: auto; display: block; margin: 10px 0;" />`
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
      let url = result.file.url
      
      // Для локальной разработки убеждаемся, что URL правильный
      if (typeof window !== 'undefined' && !url.startsWith('http')) {
        // Если URL начинается с /api/files/, добавляем origin
        if (url.startsWith('/api/files/') || url.startsWith('/uploads/')) {
          url = `${window.location.origin}${url}`
        } else if (!url.startsWith('/')) {
          url = `${window.location.origin}/${url}`
        }
      }
      
      return url
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
        .then(url => {
          // Для drag&drop не показываем диалог, используем стиль по умолчанию
          resolve(url)
        })
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
        // Настройки URL для правильной обработки путей к файлам
        relative_urls: false,
        remove_script_host: false,
        document_base_url: typeof window !== 'undefined' ? window.location.origin : '/',
        // Отключаем автоматическую обработку URL TinyMCE
        convert_urls: false,
        urlconverter_callback: (url: string) => {
          // Возвращаем URL как есть, без обработки TinyMCE
          return url
        },
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | image media link filemanager | ' +
          'table | clearfloat | code fullscreen | help',
        content_style: `
          body { 
            font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; 
            font-size: 14px; 
            line-height: 1.4; 
          }
          /* Базовые стили для изображений - инлайн стили имеют приоритет */
          img {
            max-width: 100%;
            height: auto;
          }
          /* Стили для таблиц */
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
        image_draggable: true,
        object_resizing: true,
        resize_img_proportional: false,
        // image_class_list убран, так как используются инлайн стили через диалог
        // style_formats убраны, так как используются инлайн стили через диалог
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
                  
                  // Показываем диалог выбора стиля и размера
                  const { styleProps } = showImageStyleDialog()
                  
                  // Вставляем изображение с выбранными стилями
                  callback(url, { 
                    alt: file.name,
                    style: styleProps
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
                    if (file.mimeType.startsWith('image/')) {
                      // Для изображений используем диалог выбора стиля
                      const { styleProps } = showImageStyleDialog()
                      const imgTag = `<img src="${file.url}" alt="${file.originalName}" style="${styleProps}" />`
                      editor.insertContent(imgTag)
                    } else {
                      // Для других файлов используем стандартную функцию
                      const content = createContentByMimeType(file, false)
                      editor.insertContent(content)
                    }
                  }
                }
              })
              window.dispatchEvent(event)
            }
          })

          // Добавляем кнопку для очистки float элементов
          editor.ui.registry.addButton('clearfloat', {
            text: 'Clear',
            tooltip: 'Clear floating elements',
            icon: 'new-document',
            onAction: () => {
              editor.insertContent('<div style="clear: both; height: 0; margin: 0; padding: 0;"></div>')
            }
          })

          // Обработчик перетаскивания изображений
          editor.on('drop', (e: Event) => {
            setTimeout(() => {
              // Находим изображение, которое было перемещено
              const selection = editor.selection.getNode()
              if (selection && selection.tagName === 'IMG') {
                // Получаем координаты drop
                const mouseEvent = e as MouseEvent
                const dropX = mouseEvent.clientX
                
                // Определяем направление float
                const floatDirection = determineImageFloat(editor, dropX)
                
                // Получаем текущий размер изображения
                const imgElement = selection as HTMLImageElement
                const currentWidth = imgElement.style.width || imgElement.getAttribute('width') || '300px'
                const currentHeight = imgElement.style.height || null
                
                // Создаем новые стили
                const newStyle = createImageStyleWithFloat(floatDirection, currentWidth, currentHeight)
                
                // Применяем новые стили
                imgElement.style.cssText = newStyle
                
                console.log(`Image moved with float: ${floatDirection}`)
              }
            }, 100) // Небольшая задержка для завершения операции drop
          })

          // Обработчик двойного клика по изображению для изменения стиля
          editor.on('dblclick', (e: Event) => {
            const mouseEvent = e as MouseEvent
            const target = mouseEvent.target as HTMLElement
            if (target && target.tagName === 'IMG') {
              // Показываем диалог изменения стиля
              const { styleProps } = showImageStyleDialog()
              const imgElement = target as HTMLImageElement
              imgElement.style.cssText = styleProps
              console.log('Image style updated via double-click')
            }
          })
        }
      }}
    />
  )
}