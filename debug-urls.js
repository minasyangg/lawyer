const { PrismaClient } = require('@prisma/client')

async function debugFileUrls() {
  const prisma = new PrismaClient()
  
  try {
    // Получаем последние 5 файлов
    const files = await prisma.file.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        path: true,
        virtualId: true,
        virtualPath: true,
        createdAt: true
      }
    })
    
    console.log('=== ПОСЛЕДНИЕ ФАЙЛЫ ===')
    files.forEach(file => {
      console.log(`ID: ${file.id}`)
      console.log(`Имя: ${file.originalName}`)
      console.log(`Путь: ${file.path}`)
      console.log(`VirtualId: ${file.virtualId}`)
      console.log(`VirtualPath: ${file.virtualPath}`)
      console.log(`Создан: ${file.createdAt}`)
      console.log('---')
    })
    
    // Получаем последние 3 статьи
    const articles = await prisma.article.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true
      }
    })
    
    console.log('\n=== ПОСЛЕДНИЕ СТАТЬИ ===')
    articles.forEach(article => {
      console.log(`ID: ${article.id}`)
      console.log(`Заголовок: ${article.title}`)
      console.log(`Дата: ${article.createdAt}`)
      
      // Ищем URL файлов в контенте
      const fileUrls = article.content.match(/\/api\/files\/[^"'\s>]+/g) || []
      console.log(`URL файлов в контенте: ${fileUrls.length}`)
      fileUrls.forEach(url => console.log(`  - ${url}`))
      console.log('---')
    })
    
  } catch (error) {
    console.error('Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugFileUrls()
