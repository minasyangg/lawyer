#!/usr/bin/env node

/**
 * CLI команда для синхронизации путей файлов
 * Использование: npm run sync-file-paths
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs').promises

const prisma = new PrismaClient()

async function syncFilePaths() {
  console.log('🔄 Начинаем синхронизацию путей файлов...')
  
  try {
    const allFiles = await prisma.file.findMany({
      include: {
        folder: {
          include: {
            parent: true
          }
        }
      }
    })

    let updatedCount = 0
    let errorCount = 0

    for (const file of allFiles) {
      try {
        const correctPath = await calculateFilePath(file)
        
        if (correctPath && correctPath !== file.path) {
          await prisma.file.update({
            where: { id: file.id },
            data: { path: correctPath }
          })
          
          console.log(`✅ Обновлен: ${file.originalName} -> ${correctPath}`)
          updatedCount++
        }
      } catch (error) {
        console.error(`❌ Ошибка для файла ${file.originalName}:`, error.message)
        errorCount++
      }
    }

    console.log(`\n📊 Результаты синхронизации:`)
    console.log(`   - Обновлено файлов: ${updatedCount}`)
    console.log(`   - Ошибок: ${errorCount}`)
    console.log(`   - Всего файлов: ${allFiles.length}`)

    // Проверяем битые ссылки в статьях
    await checkArticleLinks()

  } catch (error) {
    console.error('❌ Ошибка синхронизации:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function calculateFilePath(file) {
  if (!file.folder) {
    return `uploads/${file.filename}`
  }
  
  const folderPath = await calculateFolderPath(file.folder.id)
  return `uploads/${folderPath}/${file.filename}`
}

async function calculateFolderPath(folderId) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: { parent: true }
  })
  
  if (!folder) return ''
  
  if (!folder.parent) {
    return folder.name
  }
  
  const parentPath = await calculateFolderPath(folder.parent.id)
  return `${parentPath}/${folder.name}`
}

async function checkArticleLinks() {
  console.log('\n🔍 Проверяем ссылки в статьях...')
  
  const articles = await prisma.article.findMany({
    where: {
      documents: {
        not: null
      }
    }
  })

  let brokenLinksCount = 0

  for (const article of articles) {
    try {
      const documentIds = JSON.parse(article.documents)
      const validIds = []

      for (const fileId of documentIds) {
        const file = await prisma.file.findUnique({
          where: { id: fileId }
        })

        if (file) {
          validIds.push(fileId)
        } else {
          console.log(`⚠️  Битая ссылка в статье "${article.title}": файл ID ${fileId} не найден`)
          brokenLinksCount++
        }
      }

      if (validIds.length !== documentIds.length) {
        console.log(`🔧 Исправляем статью: ${article.title}`)
        await prisma.article.update({
          where: { id: article.id },
          data: {
            documents: JSON.stringify(validIds)
          }
        })
      }
    } catch (error) {
      console.error(`❌ Ошибка в статье "${article.title}":`, error.message)
    }
  }

  console.log(`   - Найдено битых ссылок: ${brokenLinksCount}`)
}

// Запускаем синхронизацию
syncFilePaths()
