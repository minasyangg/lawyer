"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export interface VirtualLinkResult {
  success: boolean
  virtualLink?: string
  error?: string
}

/**
 * Получить виртуальную ссылку для файла (для использования в статьях)
 * @param fileId ID файла
 */
export async function getFileVirtualLink(fileId: number): Promise<VirtualLinkResult> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return { success: false, error: 'Unauthorized' }
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { id: true, originalName: true, uploadedBy: true }
    })

    if (!file) {
      return { success: false, error: 'File not found' }
    }

    const user = JSON.parse(sessionCookie.value)
    if (file.uploadedBy !== user.id) {
      return { success: false, error: 'Access denied' }
    }

    return {
      success: true,
      virtualLink: `virtual://file-${fileId}`
    }

  } catch (error) {
    console.error('Error getting virtual link:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Получить виртуальную ссылку для папки (для использования в статьях)
 * @param folderId ID папки
 */
export async function getFolderVirtualLink(folderId: number): Promise<VirtualLinkResult> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return { success: false, error: 'Unauthorized' }
    }

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, name: true, ownerId: true }
    })

    if (!folder) {
      return { success: false, error: 'Folder not found' }
    }

    const user = JSON.parse(sessionCookie.value)
    if (folder.ownerId !== user.id) {
      return { success: false, error: 'Access denied' }
    }

    return {
      success: true,
      virtualLink: `virtual://folder-${folderId}`
    }

  } catch (error) {
    console.error('Error getting virtual link:', error)
    return { success: false, error: 'Internal server error' }
  }
}
