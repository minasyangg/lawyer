"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { rmdir, unlink } from 'fs/promises'
import { join } from 'path'
import { deleteFromS3, extractS3Key } from '@/lib/utils/s3-utils'

const prisma = new PrismaClient()

export interface DeleteFolderResult {
  success: boolean
  error?: string
}

/**
 * Удалить папку и все её содержимое рекурсивно
 * @param folderId ID папки для удаления
 * @param force если true, удаляет папку со всем содержимым
 */
export async function deleteFolder(folderId: number, force: boolean = false): Promise<DeleteFolderResult> {
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

    // Находим папку в базе данных с её содержимым
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        files: true,
        children: {
          include: {
            files: true,
            children: true
          }
        }
      }
    })

    if (!folder) {
      return { success: false, error: 'Folder not found' }
    }

    // Проверяем права доступа
    if (folder.ownerId !== user.id) {
      return { success: false, error: 'Access denied' }
    }

    // Если force не установлен, проверяем, что папка пустая
    if (!force && (folder.files.length > 0 || folder.children.length > 0)) {
      return { success: false, error: 'Folder is not empty. Use force=true to delete with contents.' }
    }

    // Рекурсивная функция для удаления всех файлов и папок
    const deleteRecursively = async (currentFolderId: number) => {
      // Получаем все файлы в текущей папке
      const files = await prisma.file.findMany({
        where: { folderId: currentFolderId }
      })

      // Удаляем все файлы
      for (const file of files) {
        try {
          if (process.env.NODE_ENV === 'production' && file.path.startsWith('https://')) {
            // В продакшене удаляем из S3
            const s3Key = extractS3Key(file.path)
            await deleteFromS3(s3Key)
          } else {
            // Локально удаляем из файловой системы
            const absolutePath = file.path.startsWith('uploads/') 
              ? join(process.cwd(), 'public', file.path)
              : file.path
            await unlink(absolutePath)
          }
        } catch (fsError) {
          console.error('Failed to delete file from storage:', fsError)
        }
        
        await prisma.file.delete({
          where: { id: file.id }
        })
      }

      // Получаем все дочерние папки
      const children = await prisma.folder.findMany({
        where: { parentId: currentFolderId }
      })

      // Рекурсивно удаляем дочерние папки
      for (const child of children) {
        await deleteRecursively(child.id)
      }

      // Удаляем саму папку из базы данных
      await prisma.folder.delete({
        where: { id: currentFolderId }
      })
    }

    // Удаляем рекурсивно
    await deleteRecursively(folderId)

    // Удаляем физическую папку
    try {
      const absolutePath = join(process.cwd(), 'public', 'uploads', folder.path)
      await rmdir(absolutePath, { recursive: true })
    } catch (fsError) {
      console.error('Failed to delete folder from filesystem:', fsError)
      // Не возвращаем ошибку, так как данные уже удалены из БД
    }

    return { success: true }

  } catch (error) {
    console.error('Folder deletion error:', error)
    return { success: false, error: 'Failed to delete folder' }
  }
}
