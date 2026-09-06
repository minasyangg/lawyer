import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

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