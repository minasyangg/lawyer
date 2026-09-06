"use server"

import { UserRole, UserStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { requireAdmin, requireAdminOrEditor } from '@/lib/auth/session'

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

// Поля, которые безопасно отдавать в админку (без password/токенов восстановления/2FA-секретов)
const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  userRole: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const

// Список пользователей нужен не только в /admin (управление пользователями),
// но и в /editor (выбор/отображение автора статьи) — поэтому чтение разрешено
// ADMIN и EDITOR, а не только ADMIN. Мутации (create/update/delete) — только ADMIN.
export async function getUsers(): Promise<User[]> {
  await requireAdminOrEditor()

  try {
    const users = await prisma.user.findMany({
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: 'desc' }
    })
    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    throw new Error('Failed to fetch users')
  }
}

export async function getUserById(id: number): Promise<User | null> {
  await requireAdminOrEditor()

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    })
    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    throw new Error('Failed to fetch user')
  }
}

export async function createUser(data: FormData) {
  await requireAdmin()

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
    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email: validatedFields.data.email } })
    if (existing) {
      return { errors: { email: ['Email already in use'] } }
    }

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
  const currentUser = await requireAdmin()

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
    // Нельзя понизить себе роль с ADMIN — иначе можно случайно потерять доступ
    if (currentUser.id === id && validatedFields.data.userRole !== 'ADMIN') {
      return { errors: { userRole: ['Нельзя понизить собственную роль администратора'] } }
    }

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
  const currentUser = await requireAdmin()

  try {
    if (currentUser.id === id) {
      return { errors: { general: ['Нельзя удалить собственную учётную запись'] } }
    }

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
