import { z } from 'zod'
import { validateAndProcessFolderName } from '@/lib/utils/folder-validation'

// Схема валидации для названий папок с автоматической транслитерацией
export const folderNameSchema = z
  .string()
  .min(1, 'Название папки не может быть пустым')
  .max(100, 'Название папки не может быть длиннее 100 символов')
  .transform((name) => {
    // Используем существующую функцию валидации для Supabase
    const result = validateAndProcessFolderName(name.trim(), 'supabase')
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    return result.data.safeName
  })
  .refine(
    (safeName) => safeName.length > 0,
    'Название папки не может быть преобразовано в безопасный формат'
  )

// Схема для проверки и предупреждения о транслитерации (используется в UI)
export const folderNameValidationSchema = z
  .string()
  .min(1, 'Название папки не может быть пустым')
  .max(100, 'Название папки не может быть длиннее 100 символов')
  .refine((name) => {
    const result = validateAndProcessFolderName(name.trim(), 'supabase')
    return result.success
  }, 'Некорректное название папки')

// Функция для получения информации о транслитерации
export function getFolderNamePreview(name: string) {
  const result = validateAndProcessFolderName(name.trim(), 'supabase')
  
  if (!result.success) {
    return {
      isValid: false,
      error: result.error,
      suggestions: result.suggestions || []
    }
  }
  
  return {
    isValid: true,
    originalName: result.data.originalName,
    safeName: result.data.safeName,
    wasTransliterated: result.data.wasTransliterated,
    warning: result.data.wasTransliterated 
      ? `Название будет изменено на: "${result.data.safeName}"` 
      : null
  }
}

export const createFolderSchema = z.object({
  name: folderNameSchema,
  parentId: z.number().optional().nullable()
})

export const renameFolderSchema = z.object({
  id: z.number().positive('ID папки должен быть положительным числом'),
  name: folderNameSchema
})

export type CreateFolderInput = z.infer<typeof createFolderSchema>
export type RenameFolderInput = z.infer<typeof renameFolderSchema>