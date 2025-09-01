import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { readFile, unlink } from 'fs/promises'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: idParam } = await params
    const fileId = parseInt(idParam)
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if user has access to this file
    if (file.uploadedBy !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const buffer = await readFile(file.path)

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Length': file.size.toString(),
        'Content-Disposition': `inline; filename="${file.originalName}"`,
      },
    })

  } catch (error) {
    console.error('File access error:', error)
    return NextResponse.json({ error: 'Failed to access file' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: idParam } = await params
    const fileId = parseInt(idParam)
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if user has access to this file
    if (file.uploadedBy !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete file from filesystem
    try {
      await unlink(file.path)
    } catch (fsError) {
      console.error('Failed to delete file from filesystem:', fsError)
    }

    // Delete file record from database
    await prisma.file.delete({
      where: { id: fileId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}