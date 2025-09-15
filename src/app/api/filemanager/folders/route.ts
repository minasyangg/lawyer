import { NextRequest, NextResponse } from 'next/server'
import { createFileManagerProvider } from '@/lib/filemanager/factory'

/**
 * API для получения списка папок
 * GET /api/filemanager/folders?parentId=1
 */
export async function GET(request: NextRequest) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const parentId = searchParams.get('parentId') ? parseInt(searchParams.get('parentId')!) : undefined

    const result = await provider.listFolders(parentId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        folders: result.data,
        permissions: provider.permissions
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Folders API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * API для создания папки
 * POST /api/filemanager/folders
 */
export async function POST(request: NextRequest) {
  try {
    const provider = await createFileManagerProvider()
    
    if (!provider) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, parentId } = await request.json()

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Folder name is required'
      }, { status: 400 })
    }

    const result = await provider.createFolder(name, parentId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        folder: result.data,
        permissions: provider.permissions
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Create folder API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}