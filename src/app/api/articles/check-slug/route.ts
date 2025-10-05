import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const CheckSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  excludeId: z.number().optional()
})

type CheckSlugRequest = z.infer<typeof CheckSlugSchema>
type CheckSlugResponse = {
  success: boolean
  available: boolean
  message?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<CheckSlugResponse>> {
  try {
    const body: unknown = await request.json()
    const validatedData: CheckSlugRequest = CheckSlugSchema.parse(body)
    
    const { slug, excludeId } = validatedData

    // Проверяем существование статьи с таким slug
    const existingArticle = await prisma.article.findFirst({
      where: {
        slug,
        ...(excludeId && { NOT: { id: excludeId } })
      },
      select: { id: true }
    })

    const available = !existingArticle

    return NextResponse.json({
      success: true,
      available,
      message: available 
        ? 'Slug доступен'
        : 'Статья с таким URL уже существует. Измените заголовок или URL вручную.'
    })

  } catch (error) {
    console.error('Check slug error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        available: false,
        message: 'Неверные данные: ' + error.issues.map(e => e.message).join(', ')
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      available: false,
      message: 'Ошибка при проверке URL'
    }, { status: 500 })
  }
}