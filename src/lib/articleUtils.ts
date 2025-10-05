import { resolveArticleDocuments } from '@/lib/virtualPaths'

/**
 * Функция для разрешения виртуальных ссылок в документах статьи
 */
export async function resolveArticleContent(documents: unknown): Promise<unknown> {
  if (!documents) return null
  return await resolveArticleDocuments(documents)
}

/**
 * Функция для вставки виртуальной ссылки на файл в JSON документ статьи
 */
export function insertFileLink(fileId: number): string {
  return `virtual://file-${fileId}`
}

/**
 * Функция для вставки виртуальной ссылки на папку в JSON документ статьи
 */
export function insertFolderLink(folderId: number): string {
  return `virtual://folder-${folderId}`
}

/**
 * Проверяет, является ли строка виртуальной ссылкой
 */
export function isVirtualLink(value: string): boolean {
  return typeof value === 'string' && value.startsWith('virtual://')
}

/**
 * Извлекает ID и тип из виртуальной ссылки
 */
export function parseVirtualLink(virtualLink: string): { type: 'file' | 'folder', id: number } | null {
  const match = virtualLink.match(/virtual:\/\/(file|folder)-(\d+)/)
  if (match) {
    const [, type, id] = match
    return {
      type: type as 'file' | 'folder',
      id: parseInt(id, 10)
    }
  }
  return null
}
