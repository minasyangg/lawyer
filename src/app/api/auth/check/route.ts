import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = JSON.parse(sessionCookie.value)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      userRole: user.userRole,
    })
  } catch (error) {
    console.error('Error checking auth:', error)
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }
}