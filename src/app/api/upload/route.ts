import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { 
  generateFileName, 
  isAllowedFileType, 
  saveFile, 
  MAX_FILE_SIZE,
  isImageFile 
} from '@/lib/utils/file-utils'
import sharp from 'sharp'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
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

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const folderId = data.get('folderId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    if (!isAllowedFileType(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    let buffer: Buffer = Buffer.from(bytes)

    // Optimize images
    if (isImageFile(file.type)) {
      const optimizedBuffer = await sharp(buffer)
        .resize(2000, 2000, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 80 })
        .toBuffer()
      buffer = optimizedBuffer
    }

    const filename = generateFileName(file.name)
    const filePath = await saveFile(buffer, filename, user.id)

    // Save file metadata to database
    const savedFile = await prisma.file.create({
      data: {
        originalName: file.name,
        filename,
        path: filePath,
        mimeType: file.type,
        size: buffer.length,
        uploadedBy: user.id,
        folderId: folderId ? parseInt(folderId) : null,
      },
      include: {
        folder: true,
      }
    })

    return NextResponse.json({
      success: true,
      file: {
        id: savedFile.id,
        originalName: savedFile.originalName,
        filename: savedFile.filename,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
        folder: savedFile.folder,
        createdAt: savedFile.createdAt,
        url: `/api/files/${savedFile.id}`
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}