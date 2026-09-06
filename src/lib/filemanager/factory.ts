"use server"

import { getCurrentUser } from '@/lib/auth/session'
import { UserRole } from '@prisma/client'
import { RoleBasedFileManagerProvider } from './provider'
import { FileManagerProvider } from './types'

/**
 * Фабрика для создания провайдера файлового менеджера
 */
export async function createFileManagerProvider(): Promise<FileManagerProvider | null> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return null
    }
    
    if (!user?.id || !user?.userRole) {
      return null
    }

    return new RoleBasedFileManagerProvider(user.userRole as UserRole, user.id)
  } catch (error) {
    console.error('Error creating file manager provider:', error)
    return null
  }
}