import { NextRequest, NextResponse } from 'next/server'
import { renameFolder } from '@/app/actions/filemanager/renameFolder'

export async function POST(request: NextRequest) {
  try {
    const { folderId, newName } = await request.json()

    if (!folderId || !newName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await renameFolder(folderId, newName)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Rename folder API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}