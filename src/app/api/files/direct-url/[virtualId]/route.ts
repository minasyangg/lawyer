import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getFileUrl } from '@/lib/utils/universal-file-utils'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

/**
 * API route для получения прямого URL изображения
 * GET /api/files/direct-url/[virtualId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ virtualId: string }> }
) {
  try {
    const { virtualId } = await params
    
    // Ищем файл по virtualId
    const file = await prisma.file.findUnique({
      where: { virtualId }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Проверяем, что это изображение
    if (!file.mimeType.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image file' }, { status: 400 })
    }

    // Проверяем доступ к файлу
    if (!file.isPublic) {
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get('admin-session')
      
      if (!sessionCookie?.value) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const user = JSON.parse(sessionCookie.value)
      
      if (!user?.id) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Проверяем права доступа
      if (user.userRole !== 'ADMIN' && file.uploadedBy !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    try {
      // Получаем прямой URL из storage
      const directUrl = await getFileUrl(file.path)
      
      // Возвращаем URL в JSON формате
      return NextResponse.json({ url: directUrl })
      
    } catch (storageError) {
      console.error('Storage error for file:', file.path, storageError)
      
      // Fallback: возвращаем URL через виртуальный API
      return NextResponse.json({ 
        url: `/api/files/virtual/${virtualId}`
      })
    }

  } catch (error) {
    console.error('Direct URL API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}