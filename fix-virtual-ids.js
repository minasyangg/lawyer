const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

async function fixMissingVirtualIds() {
  try {
    console.log('Проверяем файлы без virtualId...')
    
    // Найти файлы без virtualId
    const filesWithoutVirtualId = await prisma.file.findMany({
      where: {
        OR: [
          { virtualId: null },
          { virtualId: '' }
        ]
      },
      select: {
        id: true,
        originalName: true,
        virtualId: true
      }
    })
    
    console.log(`Найдено файлов без virtualId: ${filesWithoutVirtualId.length}`)
    
    for (const file of filesWithoutVirtualId) {
      // Генерируем новый virtualId
      const virtualId = crypto.randomBytes(12).toString('base64url')
      
      await prisma.file.update({
        where: { id: file.id },
        data: { virtualId }
      })
      
      console.log(`Файл ${file.id} (${file.originalName}): добавлен virtualId = ${virtualId}`)
    }
    
    console.log('Готово!')
    
    // Показать последние 5 файлов для проверки
    const recentFiles = await prisma.file.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        virtualId: true,
        path: true
      }
    })
    
    console.log('\nПоследние файлы:')
    recentFiles.forEach(file => {
      console.log(`${file.id}: ${file.originalName} -> virtualId: ${file.virtualId}`)
    })
    
  } catch (error) {
    console.error('Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMissingVirtualIds()
