/**
 * Транслитерация русского текста в латиницу
 */
const transliterationMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
}

/**
 * Транслитерирует русский текст в латиницу
 */
function transliterate(text: string): string {
  return text
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('')
}

/**
 * Генерирует slug из заголовка с транслитерацией
 */
export function generateSlug(title: string): string {
  if (!title.trim()) return ''
  
  return transliterate(title)
    .toLowerCase()
    // Заменяем все не-латинские символы, цифры и дефисы на пробелы
    .replace(/[^a-z0-9\s-]/g, ' ')
    // Заменяем множественные пробелы на одиночные
    .replace(/\s+/g, ' ')
    // Обрезаем пробелы по краям
    .trim()
    // Заменяем пробелы на дефисы
    .replace(/\s/g, '-')
    // Убираем множественные дефисы
    .replace(/-+/g, '-')
    // Убираем дефисы в начале и конце
    .replace(/^-|-$/g, '')
}

/**
 * Проверяет валидность slug
 */
export function isValidSlug(slug: string): boolean {
  if (!slug.trim()) return false
  
  // Slug должен содержать только латинские буквы, цифры и дефисы
  const slugRegex = /^[a-z0-9-]+$/
  
  return slugRegex.test(slug) && 
         !slug.startsWith('-') && 
         !slug.endsWith('-') && 
         !slug.includes('--')
}

/**
 * Очищает slug от недопустимых символов
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}