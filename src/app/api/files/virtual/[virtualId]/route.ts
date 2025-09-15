import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { getFileUrl } from '@/lib/utils/universal-file-utils'

const prisma = new PrismaClient()

/**
 * API route для получения файлов по virtualId
 * GET /api/files/virtual/[virtualId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ virtualId: string }> }
) {
  try {
    const { virtualId } = await params
    
    // Проверяем сессию для защищенных файлов
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = JSON.parse(sessionCookie.value)
    
    if (!user?.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Ищем файл по virtualId
    const file = await prisma.file.findUnique({
      where: { virtualId },
      include: {
        uploader: true,
        folder: true
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Проверяем права доступа
    // ADMIN может видеть все файлы, EDITOR может видеть свои файлы
    if (user.role !== 'ADMIN' && file.uploadedBy !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
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