import { NextRequest, NextResponse } from 'next/server'
import { getPublishedArticlesPaginated } from '@/lib/actions/article-actions'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const categoryParam = searchParams.get('category')
  const pageParam = searchParams.get('page')
  const pageSizeParam = searchParams.get('pageSize')

  const categoryId = categoryParam ? parseInt(categoryParam, 10) : undefined
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1
  const pageSize = pageSizeParam ? Math.max(1, parseInt(pageSizeParam, 10)) : 6

  try {
    const { items, total } = await getPublishedArticlesPaginated(categoryId, page, pageSize)
    return NextResponse.json({ items, total, page, pageSize })
  } catch {
    return NextResponse.json({ error: 'Failed to load articles' }, { status: 500 })
  }
}
