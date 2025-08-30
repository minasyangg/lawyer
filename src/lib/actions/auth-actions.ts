"use server"

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

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
      role: user.role,
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
    const hashedPassword = await bcrypt.hash(validatedFields.data.password, 10)
    
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: validatedFields.data.email,
        password: hashedPassword,
        role: 'admin',
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