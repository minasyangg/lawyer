import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

/**
 * Генерирует уникальный виртуальный ID
 */
function generateVirtualId() {
  return randomBytes(12).toString('base64url')
}

/**
 * Генерирует виртуальный путь для папки на основе иерархии
 */
async function generateVirtualPath(folderId: number | null): Promise<string> {
  if (!folderId) return '/'
  
  const pathParts: string[] = []
  let currentFolderId: number | null = folderId
  
  while (currentFolderId) {
    const folder: { name: string; parentId: number | null } | null = await prisma.folder.findUnique({
      where: { id: currentFolderId },
      select: { name: true, parentId: true }
    })
    
    if (!folder) break
    
    pathParts.unshift(folder.name)
    currentFolderId = folder.parentId
  }
  
  return '/' + pathParts.join('/')
}

/**
 * Инициализирует виртуальные поля для существующих записей
 */
async function initializeVirtualFields() {
  console.log('Начинаем инициализацию виртуальных полей...')

  try {
    // 1. Обновляем все папки
    console.log('Обновляем папки...')
    const folders = await prisma.folder.findMany({
      orderBy: { id: 'asc' },
      include: { parent: true }
    })

    for (const folder of folders) {
      const virtualPath = await generateVirtualPath(folder.id)
      const virtualId = generateVirtualId()
      
      await prisma.folder.update({
        where: { id: folder.id },
        data: { 
          virtualPath,
          virtualId 
        }
      })
      
      console.log(`Папка ${folder.name} обновлена: ${virtualPath}`)
    }

    // 2. Обновляем все файлы
    console.log('Обновляем файлы...')
    const files = await prisma.file.findMany({
      include: { folder: true }
    })

    for (const file of files) {
      const virtualPath = file.folder 
        ? await generateVirtualPath(file.folder.id)
        : '/'
      const virtualId = generateVirtualId()
      
      await prisma.file.update({
        where: { id: file.id },
        data: { 
          virtualPath,
          virtualId 
        }
      })
      
      console.log(`Файл ${file.originalName} обновлен: ${virtualPath}`)
    }

    console.log('✅ Инициализация виртуальных полей завершена успешно!')
    
  } catch (error) {
    console.error('❌ Ошибка при инициализации виртуальных полей:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Запускаем если файл выполняется напрямую
if (require.main === module) {
  initializeVirtualFields()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { initializeVirtualFields }
