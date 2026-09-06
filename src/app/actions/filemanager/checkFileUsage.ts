'use server'

import { prisma } from '@/lib/prisma'

/**
 * Проверяет, используется ли файл в статьях
 * @param fileId ID файла для проверки
 * @returns объект с информацией об использовании
 */
export async function checkFileUsage(fileId: number) {
  const results = await checkMultipleFilesUsage([fileId])
  return results[fileId] || { isUsed: false, usedIn: [] }
}

/**
 * Проверяет использование нескольких файлов одновременно (оптимизированная версия)
 * @param fileIds массив ID файлов для проверки
 * @returns объект с информацией об использовании каждого файла
 */
export async function checkMultipleFilesUsage(fileIds: number[]) {
  try {
    if (fileIds.length === 0) {
      return {}
    }

    const results: Record<number, { isUsed: boolean; usedIn: Array<{ id: number; title: string; type: 'content' | 'document' }> }> = {}
    
    // Инициализируем результаты
    fileIds.forEach(fileId => {
      results[fileId] = { isUsed: false, usedIn: [] }
    })

    // Получаем файлы одним запросом
    const files = await prisma.file.findMany({
      where: { id: { in: fileIds } },
      select: { id: true, filename: true, virtualId: true }
    })

    // Получаем все связи файлов со статьями одним запросом
    const articleFiles = await prisma.articleFile.findMany({
      where: { fileId: { in: fileIds } },
      include: {
        article: {
          select: { id: true, title: true }
        }
      }
    })

    // Обрабатываем связи файлов со статьями
    articleFiles.forEach(af => {
      if (!results[af.fileId].usedIn.some(u => u.id === af.article.id && u.type === 'document')) {
        results[af.fileId].usedIn.push({
          id: af.article.id,
          title: af.article.title,
          type: 'document'
        })
        results[af.fileId].isUsed = true
      }
    })

    // Ищем упоминания файла в HTML-контенте статей через SQL contains (ILIKE в Postgres) —
    // фильтрация выполняется в БД по индексируемому паттерну, а не загрузкой всего content
    // в память Node.js и прогоном regex по каждой паре файл×статья (было O(файлы × статьи)
    // с полным текстом каждой статьи, теперь один точечный запрос-кандидат на файл).
    // Content кандидатов подгружается только для уже отфильтрованного небольшого набора —
    // нужен для точной word-boundary проверки (чтобы /api/files/5 не совпал с /api/files/55).
    await Promise.all(
      files.map(async (file) => {
        const needles = [`/api/files/${file.id}`, file.filename]
        if (file.virtualId) needles.push(`/api/files/${file.virtualId}`)

        const candidates = await prisma.article.findMany({
          where: {
            OR: needles.map(needle => ({ content: { contains: needle } }))
          },
          select: { id: true, title: true, content: true }
        })

        const fileIdPattern = new RegExp(`/api/files/${file.id}(?![0-9])`)
        const virtualIdPattern = file.virtualId
          ? new RegExp(`/api/files/${file.virtualId}(?![a-zA-Z0-9_-])`)
          : null
        const filenamePattern = new RegExp(file.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

        candidates.forEach(article => {
          const found =
            fileIdPattern.test(article.content) ||
            (virtualIdPattern?.test(article.content) ?? false) ||
            filenamePattern.test(article.content)

          if (found && !results[file.id].usedIn.some(u => u.id === article.id && u.type === 'content')) {
            results[file.id].usedIn.push({
              id: article.id,
              title: article.title,
              type: 'content'
            })
            results[file.id].isUsed = true
          }
        })
      })
    )

    return results
  } catch (error) {
    console.error('Error checking multiple files usage:', error)
    return {}
  }
}
