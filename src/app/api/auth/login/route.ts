import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/actions/auth-actions'
import { cookies } from 'next/headers'
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth/session'
import { z } from 'zod'

const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = LoginBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data
    const user = await authenticateUser(email, password)

    if (!user) {
      // Намеренно обезличенное сообщение: не раскрываем, существует ли аккаунт.
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const redirectUrl =
      user.userRole === 'ADMIN' ? '/admin' : user.userRole === 'EDITOR' ? '/editor' : '/'

    // Подписанный токен вместо прежнего plaintext JSON — подделать нельзя.
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      userRole: user.userRole,
    })

    const response = NextResponse.json({ success: true, user, redirectUrl })
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)

  return NextResponse.json({ success: true })
}
