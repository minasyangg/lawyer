import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Middleware работает в Edge-рантайме, поэтому здесь используется getToken
// (совместим с Edge), а не серверный helper из lib/auth/session.
//
// Cookie `admin-session` содержит подписанный JWT: подделать роль,
// подставив свой JSON, больше нельзя.

type Role = 'ADMIN' | 'EDITOR' | 'USER'

async function readRole(request: NextRequest): Promise<Role | null> {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return null

  try {
    const token = await getToken({
      req: request,
      secret,
      cookieName: 'admin-session',
    })
    const role = token?.userRole
    return role === 'ADMIN' || role === 'EDITOR' || role === 'USER' ? role : null
  } catch {
    return null
  }
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = new URL('/login', request.url)
  url.searchParams.set('next', pathname)
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const role = await readRole(request)

  // Защита API роутов
  if (pathname.startsWith('/api/upload') || pathname.startsWith('/api/tags')) {
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isTagMutation =
      pathname.startsWith('/api/tags') &&
      (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE')

    if (isTagMutation || pathname.startsWith('/api/upload')) {
      if (role !== 'ADMIN' && role !== 'EDITOR') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }
  }

  // Админ-панель: только ADMIN. EDITOR уводим в свою зону.
  if (pathname.startsWith('/admin')) {
    if (!role) return redirectToLogin(request, pathname)
    if (role === 'EDITOR') {
      return NextResponse.redirect(new URL('/editor', request.url))
    }
    if (role !== 'ADMIN') return redirectToLogin(request, pathname)
  }

  // Зона редактора: EDITOR работает здесь, ADMIN тоже допускается
  // (раньше администратора выбрасывало на /login — это выглядело как сбой входа).
  if (pathname.startsWith('/editor')) {
    if (!role) return redirectToLogin(request, pathname)
    if (role !== 'EDITOR' && role !== 'ADMIN') {
      return redirectToLogin(request, pathname)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/files/:path*',
    '/api/upload/:path*',
    '/api/tags/:path*',
    '/admin/:path*',
    '/editor/:path*',
    '/uploads/:path*',
  ],
}
