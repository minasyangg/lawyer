import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin-session')

  if (!session) {
    return NextResponse.json({ authenticated: false })
  }

  try {
    const user = JSON.parse(session.value)
    return NextResponse.json({ authenticated: true, user })
  } catch {
    return NextResponse.json({ authenticated: false, error: 'Invalid session' })
  }
}
