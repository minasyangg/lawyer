"use server"

import { cookies } from 'next/headers'
import { UserRole } from '@prisma/client'
import { RoleBasedFileManagerProvider } from './provider'
import { FileManagerProvider } from './types'

/**
 * Фабрика для создания провайдера файлового менеджера
 */
export async function createFileManagerProvider(): Promise<FileManagerProvider | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return null
    }

    const user = JSON.parse(sessionCookie.value)
    
    if (!user?.id || !user?.userRole) {
      return null
    }

    return new RoleBasedFileManagerProvider(user.userRole as UserRole, user.id)
  } catch (error) {
    console.error('Error creating file manager provider:', error)
    return null
  }
}