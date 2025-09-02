import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const CreateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  parentId: z.number().optional()
})

type CreateFolderRequest = z.infer<typeof CreateFolderSchema>

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = JSON.parse(sessionCookie.value)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body: unknown = await request.json()
    const validatedData: CreateFolderRequest = CreateFolderSchema.parse(body)
    
    const { name, parentId } = validatedData

    // Определяем путь к папке
    let fullPath = name
    let parentFolder = null
    
    if (parentId) {
      parentFolder = await prisma.folder.findUnique({
        where: { id: parentId },
        select: { path: true }
      })
      
      if (parentFolder) {
        fullPath = `${parentFolder.path}/${name}`
      }
    }

    // Создаем папку в базе данных
    const folder = await prisma.folder.create({
      data: {
        name,
        path: fullPath,
        ownerId: user.id,
        parentId: parentId || null
      }
    })

    // Создаем физическую папку
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const physicalPath = path.join(uploadsDir, fullPath)
    
    if (!fs.existsSync(physicalPath)) {
      fs.mkdirSync(physicalPath, { recursive: true })
    }

    // Возвращаем папку в формате FileItem
    const folderResult = {
      id: folder.id,
      originalName: folder.name,
      filename: folder.name,
      mimeType: 'folder',
      size: 0,
      createdAt: folder.createdAt.toISOString(),
      url: `/uploads/${folder.path}`,
      isFolder: true,
      path: folder.path
    }

    return NextResponse.json({
      success: true,
      folder: folderResult
    })

  } catch (error) {
    console.error('Create folder error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Неверные данные: ' + error.issues.map(e => e.message).join(', ')
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      message: 'Ошибка при создании папки'
    }, { status: 500 })
  }
}