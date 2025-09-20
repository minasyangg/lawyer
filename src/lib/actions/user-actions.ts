"use server"

import { PrismaClient, UserRole, UserStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()


const UserCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  userRole: z.enum(['USER', 'EDITOR', 'ADMIN'])
})

const UserUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  userRole: z.enum(['USER', 'EDITOR', 'ADMIN'])
})

export type User = {
  id: number
  name: string
  email: string
  userRole: UserRole
  status: UserStatus
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
    userRole: data.get('userRole'),
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
        userRole: validatedFields.data.userRole as UserRole,
        status: 'ACTIVE'
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
    userRole: data.get('userRole'),
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
        userRole: validatedFields.data.userRole as UserRole,
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