"use server"

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import { withCache, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'

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
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    if (!user?.id) {
      throw new Error('User not found')
    }

    // ADMIN видит дерево всех папок, остальные роли — только своих
    // (та же модель прав, что и в listFiles.ts)
    const isAdmin = user.userRole === 'ADMIN'

    // Create cache key for the folder tree
    const cacheKey = `${CACHE_KEYS.FOLDER_TREE}:${isAdmin ? 'admin' : user.id}`

    return await withCache(
      cacheKey,
      CACHE_TTL.FOLDER_TREE,
      async () => {
        // Получаем папки (все — для ADMIN, только свои — для остальных ролей)
        const folders = await prisma.folder.findMany({
          where: isAdmin ? {} : { ownerId: user.id },
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
