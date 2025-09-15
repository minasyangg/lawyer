import { NextRequest, NextResponse } from 'next/server'
import { createFileManagerProvider } from '@/lib/filemanager/factory'

/**
 * API для получения списка файлов
 * GET /api/filemanager/files?folderId=1&limit=20&offset=0
 */
export async function GET(request: NextRequest) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const filters = {
      folderId: searchParams.get('folderId') ? parseInt(searchParams.get('folderId')!) : undefined,
      uploadedBy: searchParams.get('uploadedBy') ? parseInt(searchParams.get('uploadedBy')!) : undefined,
      mimeTypes: searchParams.get('mimeTypes')?.split(','),
      searchQuery: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') as 'name' | 'size' | 'createdAt' | 'mimeType' || undefined,
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    }

    const result = await provider.listFiles(filters)

    if (result.success) {
      return NextResponse.json({
        success: true,
        files: result.data,
        permissions: provider.permissions
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Files API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * API для загрузки файлов
 * POST /api/filemanager/files
 */
export async function POST(request: NextRequest) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const folderId = formData.get('folderId') ? parseInt(formData.get('folderId') as string) : undefined

    if (!files.length) {
      return NextResponse.json({
        success: false,
        error: 'No files provided'
      }, { status: 400 })
    }

    const result = await provider.uploadFiles(files, folderId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        files: result.files,
        permissions: provider.permissions
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}