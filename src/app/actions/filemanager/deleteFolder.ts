"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { rmdir } from 'fs/promises'
import { join } from 'path'

const prisma = new PrismaClient()

export interface DeleteFolderResult {
  success: boolean
  error?: string
}

/**
 * Удалить папку (должна быть пустой)
 * @param folderId ID папки для удаления
 */
export async function deleteFolder(folderId: number): Promise<DeleteFolderResult> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = JSON.parse(sessionCookie.value)

    if (!user?.id) {
      return { success: false, error: 'User not found' }
    }

    // Находим папку в базе данных
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        files: true,
        children: true
      }
    })

    if (!folder) {
      return { success: false, error: 'Folder not found' }
    }

    // Проверяем права доступа
    if (folder.ownerId !== user.id) {
      return { success: false, error: 'Access denied' }
    }

    // Проверяем, что папка пустая
    if (folder.files.length > 0 || folder.children.length > 0) {
      return { success: false, error: 'Folder is not empty' }
    }

    // Удаляем физическую папку
    try {
      const absolutePath = join(process.cwd(), 'public', 'uploads', folder.path)
      await rmdir(absolutePath)
    } catch (fsError) {
      console.error('Failed to delete folder from filesystem:', fsError)
      // Продолжаем удаление из БД даже если физическая папка не удалена
    }

    // Удаляем запись из базы данных
    await prisma.folder.delete({
      where: { id: folderId }
    })

    return { success: true }

  } catch (error) {
    console.error('Folder deletion error:', error)
    return { success: false, error: 'Failed to delete folder' }
  }
}
