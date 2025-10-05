import { FileItem } from '../types'

/**
 * Форматирует размер файла в человеко-читаемый формат
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Валидирует файл перед загрузкой
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `Файл слишком большой. Максимальный размер: ${formatFileSize(MAX_FILE_SIZE)}`
    }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Неподдерживаемый тип файла'
    }
  }

  return { isValid: true }
}

/**
 * Фильтрует файлы по поисковому запросу
 */
export function filterFiles(files: FileItem[], searchTerm: string): FileItem[] {
  if (!searchTerm.trim()) {
    return files
  }

  const query = searchTerm.toLowerCase()
  return files.filter(file => 
    file.originalName.toLowerCase().includes(query)
  )
}

/**
 * Сортирует файлы: папки первыми, затем файлы по имени
 */
export function sortFiles(files: FileItem[]): FileItem[] {
  return [...files].sort((a, b) => {
    // Папки всегда идут первыми
    if (a.isFolder && !b.isFolder) return -1
    if (!a.isFolder && b.isFolder) return 1
    
    // Внутри группы сортируем по имени
    return a.originalName.localeCompare(b.originalName, 'ru', { numeric: true })
  })
}

/**
 * Получает иконку для типа файла
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    return '🖼️'
  }
  
  if (mimeType === 'application/pdf') {
    return '📄'
  }
  
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return '📝'
  }
  
  return '📁'
}

/**
 * Генерирует уникальный ID для временных операций
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}