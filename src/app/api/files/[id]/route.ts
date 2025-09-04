import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

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

    // Получаем физический путь к файлу
    const filePath = path.join(process.cwd(), 'public', file.path)
    
    try {
      // Проверяем существование файла
      await fs.access(filePath)
      
      // Читаем файл
      const fileBuffer = await fs.readFile(filePath)
      
      // Создаем ответ с файлом
      const response = new NextResponse(new Uint8Array(fileBuffer))
      
      // Устанавливаем заголовки
      response.headers.set('Content-Type', file.mimeType)
      // Кодируем имя файла для поддержки кириллицы
      const encodedFileName = encodeURIComponent(file.originalName)
      response.headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodedFileName}`)
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      
      return response
      
    } catch (fileError) {
      console.error('File access error:', fileError)
      return NextResponse.json(
        { error: 'File not accessible' },
        { status: 404 }
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