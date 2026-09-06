import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getFileUrl, getStorageInfo } from '@/lib/utils/universal-file-utils'
import { getCurrentUser } from '@/lib/auth/session'
const prisma = new PrismaClient()

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
      // Обычный числовой ID
      file = await prisma.file.findUnique({
        where: { id: numericId },
        include: { folder: true }
      })
    } else {
      // Виртуальный ID (строка base64url)
      file = await prisma.file.findFirst({
        where: { virtualId: id },
        include: { folder: true }
      })
    }

    if (!file) {
      console.log(`❌ [File API] File not found for id: ${id}`)
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    console.log(`🔍 [File API] Found file:`, {
      id: file.id,
      virtualId: file.virtualId,
      originalName: file.originalName,
      isPublic: file.isPublic,
      isProtected: file.isProtected,
      uploadedBy: file.uploadedBy
    });

    // Проверяем публичный доступ - если файл публичный, разрешаем доступ всем
    if (file.isPublic) {
      // Для публичных файлов доступ открыт всем пользователям
      console.log(`[Public File API] Serving public file:`, {
        id: file.id,
        virtualId: file.virtualId,
        originalName: file.originalName,
        isPublic: file.isPublic
      });
    } else {
      // Для приватных файлов требуется авторизация
      const user = await getCurrentUser()

    if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized access to private file' },
          { status: 401 }
        )
      }
      
      if (!user?.id) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
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

      console.log(`[Private File API] Serving private file to authorized user:`, {
        id: file.id,
        virtualId: file.virtualId,
        originalName: file.originalName,
        userRole: user.userRole,
        isPublic: file.isPublic
      });
    }

    // Получаем информацию о провайдере хранения
    const storageInfo = getStorageInfo();
    
    try {
      // Генерируем правильный URL через универсальную систему
      const fileUrl = await getFileUrl(file.path);
      
      console.log(`[File API] Redirecting ${storageInfo.provider} file:`, {
        virtualId: file.virtualId,
        path: file.path,
        url: fileUrl,
        isPublic: file.isPublic
      });
      
      // Редирект на правильный URL
      return NextResponse.redirect(fileUrl);
      
    } catch (error) {
      console.error('[Virtual API] Error generating file URL:', error);
      
      return NextResponse.json(
        { error: 'Failed to generate file URL' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}