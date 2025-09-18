#!/usr/bin/env node

/**
 * Скрипт для исправления папок с кириллическими символами
 * Транслитерирует названия папок в латиницу для совместимости с Supabase Storage
 */

const { PrismaClient } = require('@prisma/client')

// Карта транслитерации (такая же как в folder-validation.ts)
const TRANSLITERATION_MAP = {
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
}

/**
 * Транслитерация строки в латиницу
 */
function transliterate(text) {
  return text
    .split('')
    .map(char => TRANSLITERATION_MAP[char] || char)
    .join('')
    .replace(/[^a-zA-Z0-9_-]/g, '') // Удаляем все небезопасные символы
    .replace(/_{2,}/g, '_') // Заменяем множественные подчеркивания на одно
    .replace(/^_+|_+$/g, '') // Убираем подчеркивания в начале и конце
    .toLowerCase()
}

/**
 * Проверяет, содержит ли строка кириллические символы
 */
function hasCyrillic(text) {
  return /[а-яё]/i.test(text)
}

async function fixCyrillicFolders() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Поиск папок с кириллическими символами...')
    
    // Находим все папки
    const folders = await prisma.folder.findMany({
      include: {
        files: true,
        children: true
      }
    })
    
    const cyrillicFolders = folders.filter(folder => hasCyrillic(folder.name))
    
    if (cyrillicFolders.length === 0) {
      console.log('✅ Папки с кириллическими символами не найдены')
      return
    }
    
    console.log(`📁 Найдено ${cyrillicFolders.length} папок с кириллическими символами:`)
    
    const updates = []
    
    for (const folder of cyrillicFolders) {
      const oldName = folder.name
      const newName = transliterate(oldName)
      
      // Проверяем, что новое имя не пустое
      if (!newName) {
        console.log(`⚠️  Папка "${oldName}" (ID: ${folder.id}) не может быть транслитерирована`)
        continue
      }
      
      // Проверяем, что новое имя уникально среди siblings
      const siblings = await prisma.folder.findMany({
        where: {
          parentId: folder.parentId,
          id: { not: folder.id }
        }
      })
      
      let finalName = newName
      let counter = 1
      
      while (siblings.some(sibling => sibling.name === finalName)) {
        finalName = `${newName}_${counter}`
        counter++
      }
      
      updates.push({
        folder,
        oldName,
        newName: finalName
      })
      
      console.log(`  "${oldName}" → "${finalName}" (ID: ${folder.id})`)
    }
    
    if (updates.length === 0) {
      console.log('⚠️  Нет папок для обновления')
      return
    }
    
    // Подтверждение
    console.log(`\n❓ Обновить ${updates.length} папок? (y/N):`)
    
    // В Node.js скрипте используем простое решение
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    rl.question('', async (answer) => {
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ Операция отменена')
        rl.close()
        await prisma.$disconnect()
        return
      }
      
      console.log('\n🔄 Обновление папок...')
      
      for (const update of updates) {
        try {
          await prisma.folder.update({
            where: { id: update.folder.id },
            data: { name: update.newName }
          })
          
          console.log(`✅ Обновлено: "${update.oldName}" → "${update.newName}"`)
        } catch (error) {
          console.error(`❌ Ошибка обновления папки "${update.oldName}":`, error.message)
        }
      }
      
      console.log('\n✨ Готово!')
      console.log('\n⚠️  ВАЖНО: Вам нужно также переименовать папки в Supabase Storage вручную или через админ-панель')
      
      rl.close()
      await prisma.$disconnect()
    })
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Запуск скрипта
if (require.main === module) {
  fixCyrillicFolders()
}