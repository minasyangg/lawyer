"use server"

import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function debugSession() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    console.log('🔍 Debug: Session cookie exists:', !!sessionCookie?.value)
    
    if (!sessionCookie?.value) {
      return { success: false, error: 'No session found' }
    }

    const user = JSON.parse(sessionCookie.value)
    console.log('🔍 Debug: User from session:', { id: user.id, email: user.email, userRole: user.userRole })

    // Проверяем, что пользователь существует в базе данных
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, email: true, userRole: true }
    })

    console.log('🔍 Debug: User from database:', dbUser)

    if (!dbUser) {
      return { success: false, error: 'User not found in database' }
    }

    return {
      success: true,
      sessionUser: user,
      dbUser: dbUser,
      idMatch: user.id === dbUser.id
    }
  } catch (error) {
    console.error('Debug session error:', error)
    return { success: false, error: 'Debug failed' }
  }
}