// Единая точка работы с сессией: выпуск, чтение и проверка прав.
//
// Сессия хранится в cookie `admin-session` как ПОДПИСАННЫЙ И ЗАШИФРОВАННЫЙ JWT
// (JWE, next-auth/jwt поверх NEXTAUTH_SECRET). Раньше здесь лежал обычный
// JSON.stringify(user) без подписи — любой мог отправить
// `admin-session={"userRole":"ADMIN"}` и получить полный доступ (см. аудит, C1).
//
// Все проверки прав в приложении должны идти через эти функции, а не через
// прямое чтение cookie, иначе легко забыть проверку (так возникли C2/C3/H4).

import { cookies } from 'next/headers'
import { encode, decode } from 'next-auth/jwt'
import { UserRole } from '@prisma/client'

export const SESSION_COOKIE = 'admin-session'

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 дней

export type SessionUser = {
  id: number
  email: string
  name: string
  userRole: UserRole
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret || secret === 'your-secret-key-here') {
    throw new Error(
      'NEXTAUTH_SECRET не задан или содержит значение-заглушку. ' +
      'Сгенерируйте секрет: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    )
  }
  return secret
}

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'number' &&
    typeof v.email === 'string' &&
    typeof v.name === 'string' &&
    (v.userRole === 'ADMIN' || v.userRole === 'EDITOR' || v.userRole === 'USER')
  )
}

/** Выпускает подписанный токен сессии. */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return encode({
    token: {
      id: user.id,
      email: user.email,
      name: user.name,
      userRole: user.userRole,
    },
    secret: getSecret(),
    maxAge: MAX_AGE_SECONDS,
  })
}

/** Параметры cookie сессии — едины для входа и выхода. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  }
}

/**
 * Текущий пользователь из подписанной cookie, либо null.
 * Токен с неверной подписью, истёкший или в старом (неподписанном) формате
 * отбрасывается. Исключений не бросает.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const raw = store.get(SESSION_COOKIE)?.value
  if (!raw) return null

  try {
    const payload = await decode({ token: raw, secret: getSecret() })
    if (!payload) return null

    const candidate = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      userRole: payload.userRole,
    }
    return isSessionUser(candidate) ? candidate : null
  } catch {
    // Сюда попадают в том числе старые plaintext-куки: подписи нет — доступа нет.
    return null
  }
}

/** Требует авторизованного пользователя. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/** Требует роль ADMIN. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.userRole !== 'ADMIN') {
    throw new Error('Недостаточно прав')
  }
  return user
}

/** Требует роль ADMIN или EDITOR. */
export async function requireAdminOrEditor(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.userRole !== 'ADMIN' && user.userRole !== 'EDITOR') {
    throw new Error('Недостаточно прав')
  }
  return user
}
