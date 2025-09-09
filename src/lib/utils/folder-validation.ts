import { z } from 'zod';

// Карта транслитерации русского языка в латиницу
const TRANSLITERATION_MAP: Record<string, string> = {
  // Русские буквы (строчные)
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  
  // Русские буквы (заглавные)
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
  
  // Украинские специфические буквы
  'і': 'i', 'ї': 'yi', 'є': 'ye', 'ґ': 'g',
  'І': 'I', 'Ї': 'Yi', 'Є': 'Ye', 'Ґ': 'G',
  
  // Пробелы и специальные символы
  ' ': '_',
  '-': '_',
  '.': '_',
  ',': '_',
  '!': '',
  '?': '',
  ':': '',
  ';': '',
  '"': '',
  "'": '',
  '(': '',
  ')': '',
  '[': '',
  ']': '',
  '{': '',
  '}': '',
  '@': '',
  '#': '',
  '$': '',
  '%': '',
  '^': '',
  '&': '',
  '*': '',
  '+': '',
  '=': '',
  '|': '',
  '\\': '',
  '/': '_',
  '<': '',
  '>': ''
};

/**
 * Транслитерация строки в латиницу, безопасную для файловых систем
 */
export function transliterate(text: string): string {
  return text
    .split('')
    .map(char => TRANSLITERATION_MAP[char] || char)
    .join('')
    .replace(/[^a-zA-Z0-9_-]/g, '') // Удаляем все небезопасные символы
    .replace(/_{2,}/g, '_') // Заменяем множественные подчеркивания на одно
    .replace(/^_+|_+$/g, '') // Убираем подчеркивания в начале и конце
    .toLowerCase();
}

/**
 * Схема валидации для названия папки
 */
export const folderNameSchema = z.object({
  name: z.string()
    .min(1, 'Название папки не может быть пустым')
    .max(100, 'Название папки не может быть длиннее 100 символов')
    .refine(
      (name) => name.trim().length > 0,
      'Название папки не может состоять только из пробелов'
    )
});

/**
 * Схема валидации для транслитерированного названия папки (для Supabase)
 */
export const supabaseFolderNameSchema = z.object({
  name: z.string()
    .min(1, 'Название папки не может быть пустым после обработки')
    .max(100, 'Название папки слишком длинное')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Название папки может содержать только латинские буквы, цифры, дефисы и подчеркивания'
    )
    .refine(
      (name) => !name.startsWith('_') && !name.endsWith('_'),
      'Название папки не может начинаться или заканчиваться подчеркиванием'
    )
    .refine(
      (name) => name !== '_',
      'Некорректное название папки'
    )
});

/**
 * Типы ошибок валидации
 */
export type ValidationResult = {
  success: true;
  data: {
    originalName: string;
    safeName: string;
    wasTransliterated: boolean;
  };
} | {
  success: false;
  error: string;
  suggestions?: string[];
};

/**
 * Валидирует и обрабатывает название папки
 */
export function validateAndProcessFolderName(
  name: string,
  storageProvider: 'local' | 'supabase' = 'local'
): ValidationResult {
  // Базовая валидация
  const basicValidation = folderNameSchema.safeParse({ name });
  if (!basicValidation.success) {
    return {
      success: false,
      error: basicValidation.error.issues[0].message
    };
  }

  const trimmedName = name.trim();
  
  // Для локального хранилища - более мягкие требования
  if (storageProvider === 'local') {
    // Проверяем на запрещенные символы для Windows/Linux файловых систем
    const forbiddenChars = /[<>:"\/\\|?*\x00-\x1f]/g;
    
    if (forbiddenChars.test(trimmedName)) {
      const safeName = transliterate(trimmedName);
      
      if (safeName.length === 0) {
        return {
          success: false,
          error: 'Название содержит только недопустимые символы',
          suggestions: ['documents', 'files', 'folder']
        };
      }
      
      return {
        success: true,
        data: {
          originalName: trimmedName,
          safeName,
          wasTransliterated: true
        }
      };
    }
    
    return {
      success: true,
      data: {
        originalName: trimmedName,
        safeName: trimmedName,
        wasTransliterated: false
      }
    };
  }
  
  // Для Supabase - строгие требования
  const transliteratedName = transliterate(trimmedName);
  
  if (transliteratedName.length === 0) {
    return {
      success: false,
      error: 'Название не может быть преобразовано в безопасный формат',
      suggestions: [
        'documents',
        'files', 
        'images',
        'uploads',
        `folder_${Date.now().toString().slice(-6)}`
      ]
    };
  }
  
  // Валидация для Supabase
  const supabaseValidation = supabaseFolderNameSchema.safeParse({ 
    name: transliteratedName 
  });
  
  if (!supabaseValidation.success) {
    return {
      success: false,
      error: supabaseValidation.error.issues[0].message,
      suggestions: [
        `${transliteratedName}_folder`,
        `folder_${transliteratedName}`,
        `docs_${Date.now().toString().slice(-6)}`
      ]
    };
  }
  
  return {
    success: true,
    data: {
      originalName: trimmedName,
      safeName: transliteratedName,
      wasTransliterated: trimmedName !== transliteratedName
    }
  };
}

/**
 * Проверяет, безопасно ли название для конкретного провайдера
 */
export function isFolderNameSafe(
  name: string, 
  storageProvider: 'local' | 'supabase'
): boolean {
  const result = validateAndProcessFolderName(name, storageProvider);
  return result.success && !result.data.wasTransliterated;
}

/**
 * Генерирует предложения для исправления названия
 */
export function generateFolderNameSuggestions(originalName: string): string[] {
  const transliterated = transliterate(originalName);
  const timestamp = Date.now().toString().slice(-6);
  
  const suggestions = [];
  
  if (transliterated.length > 0) {
    suggestions.push(transliterated);
    suggestions.push(`${transliterated}_folder`);
    suggestions.push(`folder_${transliterated}`);
  }
  
  suggestions.push(`folder_${timestamp}`);
  suggestions.push(`documents_${timestamp}`);
  suggestions.push(`files_${timestamp}`);
  
  // Удаляем дубликаты
  return [...new Set(suggestions)];
}
