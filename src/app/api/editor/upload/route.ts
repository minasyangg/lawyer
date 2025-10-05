import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/app/actions/filemanager/uploadFile'

/**
 * API route для загрузки файлов через RichTextEditor
 * Использует ту же логику, что и файловый менеджер
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Вызываем Server Action uploadFile
    const result = await uploadFile(formData)
    
    if (result.success && result.files.length > 0) {
      // Возвращаем первый файл в формате, ожидаемом TinyMCE
      const file = result.files[0]
      return NextResponse.json({
        success: true,
        file: {
          id: file.id,
          url: file.url,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Upload failed'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Editor upload error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
