"use server"

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { cookies } from 'next/headers'


const prisma = new PrismaClient()

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function authenticateUser(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.password) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      userRole: user.userRole,
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export async function createAdminUser(data: FormData) {
  const validatedFields = LoginSchema.safeParse({
    email: data.get('email'),
    password: data.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@admin.com',
        password: await bcrypt.hash('password123', 10),
        userRole: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
      }
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error creating admin user:', error)
    return {
      errors: { general: ['Failed to create admin user'] }
    }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin-session')
  // redirect('/') убран для корректной работы realtime logout
}