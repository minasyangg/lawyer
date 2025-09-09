// Клиентские утилиты для работы с файлами (без Node.js зависимостей)

// Константы валидации
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
]

// Валидация файла (только для клиента)
export function validateFile(file: File): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Проверка размера
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`Файл "${file.name}" слишком большой (${formatFileSize(file.size)}). Максимальный размер: ${formatFileSize(MAX_FILE_SIZE)}`)
  }

  // Проверка типа
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    errors.push(`Файл "${file.name}" имеет неподдерживаемый тип: ${file.type}`)
  }

  // Проверка расширения как дополнительная мера
  const extension = file.name.split('.').pop()?.toLowerCase()
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv']
  
  if (!extension || !allowedExtensions.includes(extension)) {
    errors.push(`Файл "${file.name}" имеет неподдерживаемое расширение: .${extension}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Форматирование размера файла
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Проверка размера файла
export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE
}
