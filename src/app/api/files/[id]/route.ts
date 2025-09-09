import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getFileUrl, getStorageInfo } from '@/lib/utils/universal-file-utils'

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
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Получаем информацию о провайдере хранения
    const storageInfo = getStorageInfo();
    
    try {
      // Генерируем правильный URL через универсальную систему
      const fileUrl = await getFileUrl(file.path);
      
      console.log(`[Virtual API] Redirecting ${storageInfo.provider} file:`, {
        virtualId: file.virtualId,
        path: file.path,
        url: fileUrl
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