const { PrismaClient } = require('@prisma/client')

async function checkFile() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Проверяем файл с virtualId: mCaK8wfwrusNagd4')
    
    const file = await prisma.file.findFirst({
      where: { virtualId: 'mCaK8wfwrusNagd4' },
      include: { folder: true }
    })
    
    if (file) {
      console.log('Файл найден:', {
        id: file.id,
        originalName: file.originalName,
        filename: file.filename,
        path: file.path,
        virtualPath: file.virtualPath,
        virtualId: file.virtualId,
        mimeType: file.mimeType,
        size: file.size,
        folderId: file.folderId,
        folder: file.folder ? file.folder.name : null
      })
    } else {
      console.log('Файл с данным virtualId не найден')
      
      // Посмотрим все файлы
      const allFiles = await prisma.file.findMany({
        select: {
          id: true,
          originalName: true,
          virtualId: true,
          path: true
        }
      })
      
      console.log('Все файлы в базе данных:')
      allFiles.forEach(f => {
        console.log(`- ID: ${f.id}, Name: ${f.originalName}, VirtualId: ${f.virtualId}, Path: ${f.path}`)
      })
    }
  } catch (error) {
    console.error('Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkFile()
