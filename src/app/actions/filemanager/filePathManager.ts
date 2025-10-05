'use server'

import { prisma } from '@/lib/prisma'

/**
 * Middleware для автоматического обновления путей файлов
 * при изменении структуры папок
 */
export class FilePathManager {
  
  /**
   * Обновляет пути всех файлов после переименования папки
   */
  static async updateFilePathsAfterFolderRename(folderId: number) {
    try {
      // Получаем все файлы в этой папке и подпапках
      const affectedFiles = await this.getAllFilesInFolderTree(folderId)
      
      // Обновляем путь каждого файла
      for (const file of affectedFiles) {
        const newPath = await this.calculateFilePath(file.id)
        if (newPath && newPath !== file.path) {
          await prisma.file.update({
            where: { id: file.id },
            data: { path: newPath }
          })
        }
      }
      
      console.log(`Updated paths for ${affectedFiles.length} files`)
    } catch (error) {
      console.error('Error updating file paths:', error)
      throw error
    }
  }

  /**
   * Получает все файлы в дереве папок (включая подпапки)
   */
  private static async getAllFilesInFolderTree(folderId: number): Promise<Array<{
    id: number
    path: string
    filename: string
    folderId: number | null
  }>> {
    const files = []
    
    // Получаем файлы в текущей папке
    const directFiles = await prisma.file.findMany({
      where: { folderId }
    })
    files.push(...directFiles)
    
    // Получаем подпапки
    const subfolders = await prisma.folder.findMany({
      where: { parentId: folderId }
    })
    
    // Рекурсивно получаем файлы из подпапок
    for (const subfolder of subfolders) {
      const subFiles = await this.getAllFilesInFolderTree(subfolder.id)
      files.push(...subFiles)
    }
    
    return files
  }

  /**
   * Вычисляет актуальный путь файла на основе текущей структуры папок
   */
  private static async calculateFilePath(fileId: number): Promise<string | null> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { folder: true }
    })
    
    if (!file) return null
    
    if (!file.folder) {
      return `uploads/${file.filename}`
    }
    
    const folderPath = await this.calculateFolderPath(file.folder.id)
    return `uploads/${folderPath}/${file.filename}`
  }

  /**
   * Вычисляет актуальный путь папки
   */
  private static async calculateFolderPath(folderId: number): Promise<string> {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { parent: true }
    })
    
    if (!folder) return ''
    
    if (!folder.parent) {
      return folder.name
    }
    
    const parentPath = await this.calculateFolderPath(folder.parent.id)
    return `${parentPath}/${folder.name}`
  }

  /**
   * Синхронизирует все пути файлов в системе
   * (для использования при миграции или исправлении данных)
   */
  static async syncAllFilePaths() {
    try {
      const allFiles = await prisma.file.findMany()
      let updatedCount = 0
      
      for (const file of allFiles) {
        const correctPath = await this.calculateFilePath(file.id)
        if (correctPath && correctPath !== file.path) {
          await prisma.file.update({
            where: { id: file.id },
            data: { path: correctPath }
          })
          updatedCount++
        }
      }
      
      console.log(`Synchronized ${updatedCount} file paths`)
      return { success: true, updatedCount }
    } catch (error) {
      console.error('Error syncing file paths:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

/**
 * Hook для интеграции с существующими actions
 */
export async function afterFolderUpdate(folderId: number) {
  await FilePathManager.updateFilePathsAfterFolderRename(folderId)
}
