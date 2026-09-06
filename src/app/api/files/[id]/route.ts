import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/utils/universal-file-utils'
import { getCurrentUser } from '@/lib/auth/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    let file = null

    // Проверяем, является ли ID числовым (обычный ID) или строковым (виртуальный ID)
    const numericId = parseInt(id, 10)

    if (!isNaN(numericId)) {
      file = await prisma.file.findUnique({
        where: { id: numericId },
        include: { folder: true }
      })
    } else {
      file = await prisma.file.findFirst({
        where: { virtualId: id },
        include: { folder: true }
      })
    }

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Проверяем публичный доступ - если файл публичный, разрешаем доступ всем
    if (!file.isPublic) {
      // Для приватных файлов требуется авторизация
      const user = await getCurrentUser()

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized access to private file' },
          { status: 401 }
        )
      }

      // Проверяем права доступа к приватному файлу
      // ADMIN может видеть все файлы, EDITOR может видеть свои файлы
      if (user.userRole !== 'ADMIN' && file.uploadedBy !== user.id) {
        return NextResponse.json(
          { error: 'Access denied to private file' },
          { status: 403 }
        )
      }
    }

    try {
      // Генерируем правильный URL через универсальную систему
      const fileUrl = await getFileUrl(file.path)
      return NextResponse.redirect(fileUrl)
    } catch (error) {
      console.error('Error generating file URL:', error)
      return NextResponse.json(
        { error: 'Failed to generate file URL' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
