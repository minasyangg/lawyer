import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Защита API роутов для файлов
  if (pathname.startsWith('/api/files') || 
      pathname.startsWith('/api/upload') || 
      pathname.startsWith('/api/tags')) {
    
    const sessionCookie = request.cookies.get('admin-session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const user = JSON.parse(sessionCookie.value)
      
      // Дополнительная проверка для административных операций с тегами
      if ((pathname.startsWith('/api/tags') && 
           (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE')) ||
          pathname.startsWith('/api/upload')) {
        if (user.role !== 'admin') {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
  }

  // Проверка доступа к админ панели
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionCookie = request.cookies.get('admin-session')

    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const user = JSON.parse(sessionCookie.value)
      if (user.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/files/:path*',
    '/api/upload/:path*', 
    '/api/tags/:path*',
    '/admin/:path*'
  ]
}