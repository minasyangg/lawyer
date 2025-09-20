import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Защита API роутов
  if (pathname.startsWith('/api/tags')) {
    
    const sessionCookie = request.cookies.get('admin-session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const user = JSON.parse(sessionCookie.value)
      
      // Дополнительная проверка для административных операций с тегами
      if (pathname.startsWith('/api/tags') && 
          (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE')) {
        if (user.userRole !== 'ADMIN' && user.userRole !== 'EDITOR') {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
  }

  // Проверка доступа к админ панели
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    console.log('🔍 Middleware: Checking admin access for path:', pathname)
    const sessionCookie = request.cookies.get('admin-session')

    if (!sessionCookie?.value) {
      console.log('❌ Middleware: No session cookie found')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const user = JSON.parse(sessionCookie.value)
      console.log('🔍 Middleware: Session data:', user)
      
      // Только ADMIN может заходить в админ область
      if (user.userRole !== 'ADMIN') {
        console.log('❌ Middleware: Access denied - user role is:', user.userRole)
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      
      console.log('✅ Middleware: Admin access granted')
    } catch (error) {
      console.log('❌ Middleware: Error parsing session cookie:', error)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Проверка доступа к editor панели
  if (pathname.startsWith('/editor')) {
    const sessionCookie = request.cookies.get('admin-session')

    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const user = JSON.parse(sessionCookie.value)
      
      // Только EDITOR может заходить в editor область
      if (user.userRole !== 'EDITOR') {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Защищаем доступ к загруженным файлам
  if (pathname.startsWith('/uploads/')) {
    // Для простоты, пока разрешаем доступ ко всем файлам из uploads
    // В продакшене нужно добавить проверку на использование файла в опубликованных статьях
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/files/:path*',
    '/api/tags/:path*',
    '/admin/:path*',
    '/editor/:path*',
    '/uploads/:path*'
  ]
}