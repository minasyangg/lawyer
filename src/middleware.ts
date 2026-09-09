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

/**
 * Origin для редиректов, собранный из заголовков запроса, а не из request.url.
 *
 * Next.js при вызове middleware собирает request.url сам — из hostname, на котором
 * слушает Node-процесс, игнорируя Host-заголовок (next-server.js, runMiddleware).
 * За reverse-proxy (VPS + Nginx) это давало редиректы на http://localhost:3000/...
 * вместо реального домена, и конфигом это поведение не отключается.
 *
 * Host и X-Forwarded-Proto до middleware доходят корректно (их проставляет Nginx),
 * поэтому origin берём из них. Относительный Location тут не подходит: Next.js
 * валидирует заголовок и требует абсолютный URL (ERR_INVALID_URL).
 */
function getRequestOrigin(request: NextRequest): string {
  const host = request.headers.get('host')
  if (!host) return request.nextUrl.origin

  const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  return `${proto}://${host}`
}

function redirectTo(request: NextRequest, pathname: string, searchParams?: Record<string, string>) {
  const url = new URL(pathname, getRequestOrigin(request))
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value)
    }
  }
  return NextResponse.redirect(url)
}

function redirectToLogin(request: NextRequest, pathname: string) {
  return redirectTo(request, '/login', { next: pathname })
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
      return redirectTo(request, '/editor')
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
