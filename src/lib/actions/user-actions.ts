"use server"

import { PrismaClient, UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const UserCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'EDITOR', 'USER'], { message: 'Role is required' }),
})

const UserUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'EDITOR', 'USER'], { message: 'Role is required' }),
})

export type User = {
  id: number
  name: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export async function getUsers(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    throw new Error('Failed to fetch users')
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    })
    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    throw new Error('Failed to fetch user')
  }
}

export async function createUser(data: FormData) {
  const validatedFields = UserCreateSchema.safeParse({
    name: data.get('name'),
    email: data.get('email'),
    password: data.get('password'),
    role: data.get('role'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedFields.data.password, 12)
    
    await prisma.user.create({
      data: {
        name: validatedFields.data.name,
        email: validatedFields.data.email,
        password: hashedPassword,
        role: validatedFields.data.role as UserRole,
      }
    })
    
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error creating user:', error)
    return {
      errors: { general: ['Failed to create user'] }
    }
  }
}

export async function updateUser(id: number, data: FormData) {
  const validatedFields = UserUpdateSchema.safeParse({
    name: data.get('name'),
    email: data.get('email'),
    role: data.get('role'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: validatedFields.data.name,
        email: validatedFields.data.email,
        role: validatedFields.data.role as UserRole,
      }
    })
    
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error updating user:', error)
    return {
      errors: { general: ['Failed to update user'] }
    }
  }
}

export async function deleteUser(id: number) {
  try {
    await prisma.user.delete({
      where: { id }
    })
    
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return {
      errors: { general: ['Failed to delete user'] }
    }
  }
}