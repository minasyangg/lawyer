import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/actions/auth-actions'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    console.log('🔍 Login attempt for email:', email)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await authenticateUser(email, password)
    console.log('🔍 Authentication result:', user)

    if (!user) {
      console.log('❌ Authentication failed - user not found or invalid password')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated successfully:', {
      id: user.id,
      email: user.email,
      userRole: user.userRole
    })

    // Create a simple session cookie
    const cookieStore = await cookies()
    const sessionData = JSON.stringify(user)
    console.log('🍪 Setting session cookie with data:', sessionData)
    
    cookieStore.set('admin-session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('❌ Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('admin-session')
  
  return NextResponse.json({ success: true })
}