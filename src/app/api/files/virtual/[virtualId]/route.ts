import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import { getFileUrl } from '@/lib/utils/universal-file-utils'

/**
 * API route для получения файлов по virtualId
 * GET /api/files/virtual/[virtualId]
 * Поддерживает как авторизованные, так и публичные файлы
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ virtualId: string }> }
) {
  try {
    const { virtualId } = await params

    const file = await prisma.file.findUnique({
      where: { virtualId }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Проверяем, является ли файл публичным
    if (!file.isPublic) {
      // Приватный файл - требуется авторизация
      const user = await getCurrentUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized access to private file' }, { status: 401 })
      }

      // Проверяем права доступа к приватному файлу
      // ADMIN может видеть все файлы, EDITOR может видеть свои файлы
      if (user.userRole !== 'ADMIN' && file.uploadedBy !== user.id) {
        return NextResponse.json({ error: 'Access denied to private file' }, { status: 403 })
      }
    }

    try {
      // Получаем правильный URL файла из хранилища
      const fileUrl = await getFileUrl(file.path)

      // Если это внешний URL (S3, Supabase), делаем редирект
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        return NextResponse.redirect(fileUrl, 302)
      }

      // Если это локальный файл, перенаправляем на статический URL
      if (fileUrl.startsWith('/uploads/')) {
        return NextResponse.redirect(new URL(fileUrl, request.url), 302)
      }

      // Fallback: используем оригинальный API route
      return NextResponse.redirect(new URL(`/api/files/${file.id}`, request.url), 302)
    } catch (storageError) {
      console.error('Storage error for file:', file.path, storageError)
      // Fallback: используем оригинальный API route
      return NextResponse.redirect(new URL(`/api/files/${file.id}`, request.url), 302)
    }
  } catch (error) {
    console.error('Virtual file serving error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
