const { PrismaClient } = require('@prisma/client')
const { randomBytes } = require('crypto')

const prisma = new PrismaClient()

/**
 * Генерирует уникальный виртуальный ID
 */
function generateVirtualId() {
  return randomBytes(12).toString('base64url')
}

/**
 * Генерирует виртуальный путь для папки на основе иерархии с учетом пользователя
 */
async function generateVirtualPath(folderId, ownerId) {
  if (!folderId) return `/user_${ownerId}`
  
  const pathParts = []
  let currentFolderId = folderId
  
  while (currentFolderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentFolderId },
      select: { name: true, parentId: true, ownerId: true }
    })
    
    if (!folder) break
    
    pathParts.unshift(folder.name)
    currentFolderId = folder.parentId
  }
  
  return `/user_${ownerId}/` + pathParts.join('/')
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
      const virtualPath = await generateVirtualPath(folder.id, folder.ownerId)
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
        ? await generateVirtualPath(file.folder.id, file.folder.ownerId)
        : `/user_${file.uploadedBy}`
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
