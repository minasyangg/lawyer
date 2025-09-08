const { PrismaClient } = require('@prisma/client')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Подключение к старой SQLite базе
const sqliteDbPath = path.join(__dirname, '../prisma/dev.db')
const sqliteDb = new sqlite3.Database(sqliteDbPath)

// Подключение к новой PostgreSQL базе
const prisma = new PrismaClient()

async function migrateData() {
  console.log('Начинаем миграцию данных из SQLite в PostgreSQL...')
  
  try {
    // Миграция пользователей
    console.log('Мигрируем пользователей...')
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM User', (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    for (const user of users) {
      await prisma.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role || 'user',
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      })
    }
    console.log(`Мигрировано ${users.length} пользователей`)

    // Миграция сервисов
    console.log('Мигрируем сервисы...')
    const services = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM Service', (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    for (const service of services) {
      await prisma.service.create({
        data: {
          id: service.id,
          title: service.title,
          description: service.description,
          extraInfo: service.extraInfo
        }
      })
    }
    console.log(`Мигрировано ${services.length} сервисов`)

    // Миграция статей
    console.log('Мигрируем статьи...')
    const articles = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM Article', (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    for (const article of articles) {
      await prisma.article.create({
        data: {
          id: article.id,
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          slug: article.slug,
          published: Boolean(article.published),
          categoryId: article.categoryId,
          authorId: article.authorId,
          documents: article.documents ? JSON.parse(article.documents) : null,
          createdAt: new Date(article.createdAt),
          updatedAt: new Date(article.updatedAt)
        }
      })
    }
    console.log(`Мигрировано ${articles.length} статей`)

    // Дополнительные таблицы можно добавить по аналогии...
    
    console.log('Миграция данных завершена успешно!')
  } catch (error) {
    console.error('Ошибка при миграции:', error)
  } finally {
    await prisma.$disconnect()
    sqliteDb.close()
  }
}

if (require.main === module) {
  migrateData()
}

module.exports = { migrateData }
