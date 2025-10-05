"use server"

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { withCache, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'

const prisma = new PrismaClient()

export interface FolderTreeNode {
  id: number
  name: string
  path: string
  parentId: number | null
  children: FolderTreeNode[]
  createdAt: string
}

/**
 * Получить дерево папок пользователя
 */
export async function getFolderTree(): Promise<FolderTreeNode[]> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin-session')
    
    if (!sessionCookie?.value) {
      throw new Error('Unauthorized')
    }

    const user = JSON.parse(sessionCookie.value)

    if (!user?.id) {
      throw new Error('User not found')
    }

    // Create cache key for user's folder tree
    const cacheKey = `${CACHE_KEYS.FOLDER_TREE}:${user.id}`

    return await withCache(
      cacheKey,
      CACHE_TTL.FOLDER_TREE,
      async () => {
        // Получаем все папки пользователя
        const folders = await prisma.folder.findMany({
          where: {
            ownerId: user.id
          },
          orderBy: {
            name: 'asc'
          }
        })

        // Строим дерево папок
        const folderMap = new Map<number, FolderTreeNode>()
        const rootFolders: FolderTreeNode[] = []

        // Создаем узлы для всех папок
        folders.forEach(folder => {
          const node: FolderTreeNode = {
            id: folder.id,
            name: folder.name,
            path: folder.path,
            parentId: folder.parentId,
            children: [],
            createdAt: folder.createdAt.toISOString()
          }
          folderMap.set(folder.id, node)
        })

        // Строим иерархию
        folders.forEach(folder => {
          const node = folderMap.get(folder.id)!
          
          if (folder.parentId === null) {
            // Корневая папка
            rootFolders.push(node)
          } else {
            // Дочерняя папка
            const parent = folderMap.get(folder.parentId)
            if (parent) {
              parent.children.push(node)
            }
          }
        })

        return rootFolders
      }
    )

  } catch (error) {
    console.error('Get folder tree error:', error)
    throw error
  }
}
