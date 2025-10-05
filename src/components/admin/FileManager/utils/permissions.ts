import { FileItem, UserRole, FileManagerPermissions } from '../types'

/**
 * Проверяет права пользователя на удаление файла
 */
export function canDeleteFile(file: FileItem, userRole: UserRole): boolean {
  if (userRole === 'ADMIN') {
    return true
  }
  
  if (userRole === 'EDITOR') {
    // EDITOR не может удалять файлы, используемые в статьях
    if (file.isUsed) {
      return false
    }
    // TODO: Добавить проверку владельца файла
    return true
  }
  
  return false
}

/**
 * Проверяет права пользователя на переименование папки
 */
export function canRenameFolder(userRole: UserRole): boolean {
  return userRole === 'ADMIN' || userRole === 'EDITOR'
}

/**
 * Проверяет права пользователя на создание папки
 */
export function canCreateFolder(userRole: UserRole): boolean {
  return userRole === 'ADMIN' || userRole === 'EDITOR'
}

/**
 * Проверяет права пользователя на загрузку файлов
 */
export function canUploadFiles(userRole: UserRole): boolean {
  return userRole === 'ADMIN' || userRole === 'EDITOR'
}

/**
 * Получает разрешения для пользователя на основе его роли
 */
export function getUserPermissions(userRole: UserRole): FileManagerPermissions {
  return {
    canUpload: canUploadFiles(userRole),
    canDelete: userRole === 'ADMIN',
    canDeleteUsed: userRole === 'ADMIN',
    canDeleteOthers: userRole === 'ADMIN',
    canManageFolders: canCreateFolder(userRole)
  }
}

/**
 * Получает сообщение об ошибке при попытке удаления файла
 */
export function getDeleteErrorMessage(file: FileItem, userRole: UserRole): string {
  if (userRole === 'EDITOR' && file.isUsed) {
    return 'Вы не можете удалить файл, используемый в статьях. Обратитесь к администратору.'
  }
  
  if (userRole === 'EDITOR') {
    return 'Вы можете удалять только свои файлы.'
  }
  
  return 'Недостаточно прав для удаления файла.'
}