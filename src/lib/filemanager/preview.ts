/**
 * Получает иконку для типа файла
 */
export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('word') || mimeType.includes('doc')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📋'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '📦'
  if (mimeType.includes('text')) return '📃'
  
  return '📁'
}

/**
 * Получает текстовое описание типа файла
 */
export function getFileTypeName(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Изображение'
  if (mimeType.startsWith('video/')) return 'Видео'
  if (mimeType.startsWith('audio/')) return 'Аудио'
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word') || mimeType.includes('doc')) return 'Word'
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'Excel'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'Архив'
  if (mimeType.includes('text')) return 'Текст'
  
  return 'Файл'
}