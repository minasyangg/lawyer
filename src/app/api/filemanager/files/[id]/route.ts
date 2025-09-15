import { NextRequest, NextResponse } from 'next/server'
import { createFileManagerProvider } from '@/lib/filemanager/factory'

/**
 * API для получения информации о файле
 * GET /api/filemanager/files/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fileId = parseInt((await params).id)
    
    if (isNaN(fileId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file ID'
      }, { status: 400 })
    }

    const result = await provider.getFileDetails(fileId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        file: result.data,
        permissions: provider.permissions
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: result.error === 'File access denied' ? 403 : 404 })
    }
  } catch (error) {
    console.error('File details API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * API для удаления файла
 * DELETE /api/filemanager/files/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fileId = parseInt((await params).id)
    
    if (isNaN(fileId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file ID'
      }, { status: 400 })
    }

    const result = await provider.deleteFile(fileId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        deletedIds: result.deletedIds,
        permissions: provider.permissions
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: result.error === 'File access denied' ? 403 : 400 })
    }
  } catch (error) {
    console.error('Delete file API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}