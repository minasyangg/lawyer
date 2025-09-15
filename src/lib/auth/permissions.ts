// Система разрешений и ролей для новой аутентификации
// src/lib/auth/permissions.ts

import { UserRole as PrismaUserRole } from '@prisma/client'

export type UserRole = PrismaUserRole

export const PERMISSIONS = {
  // === Управление пользователями ===
  MANAGE_USERS: 'manage_users',           // Просмотр всех пользователей
  CREATE_USERS: 'create_users',           // Создание новых пользователей напрямую
  APPROVE_REGISTRATIONS: 'approve_registrations', // Модерация заявок на регистрацию
  SUSPEND_USERS: 'suspend_users',         // Блокировка/разблокировка пользователей
  VIEW_USER_LOGS: 'view_user_logs',       // Просмотр логов входов
  
  // === Настройки сайта ===
  MANAGE_SITE_SETTINGS: 'manage_site_settings', // Конфигурация сайта
  MANAGE_SERVICES: 'manage_services',     // Управление услугами
  MANAGE_TAGS: 'manage_tags',             // Управление тегами
  
  // === Статьи ===
  CREATE_ARTICLES: 'create_articles',     // Создание статей
  EDIT_ALL_ARTICLES: 'edit_all_articles', // Редактирование любых статей
  EDIT_OWN_ARTICLES: 'edit_own_articles', // Редактирование только своих статей
  DELETE_ALL_ARTICLES: 'delete_all_articles', // Удаление любых статей
  DELETE_OWN_ARTICLES: 'delete_own_articles', // Удаление только своих статей
  VIEW_ALL_ARTICLES: 'view_all_articles', // Просмотр всех статей (включая черновики)
  VIEW_OWN_ARTICLES: 'view_own_articles', // Просмотр только своих статей
  PUBLISH_ARTICLES: 'publish_articles',   // Публикация статей
  
  // === Файлы ===
  MANAGE_ALL_FILES: 'manage_all_files',   // Управление всеми файлами
  MANAGE_OWN_FILES: 'manage_own_files',   // Управление только своими файлами
  UPLOAD_FILES: 'upload_files',           // Загрузка файлов
  DELETE_FILES: 'delete_files',           // Удаление файлов
  
  // === Личный кабинет ===
  ACCESS_USER_CABINET: 'access_user_cabinet', // Доступ к личному кабинету
  VIEW_ASSIGNED_DOCUMENTS: 'view_assigned_documents', // Просмотр назначенных документов
  
  // === Административная панель ===
  ACCESS_ADMIN_PANEL: 'access_admin_panel', // Доступ к админке
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Определение ролей и их разрешений
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Полные права администратора
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.APPROVE_REGISTRATIONS,
    PERMISSIONS.SUSPEND_USERS,
    PERMISSIONS.VIEW_USER_LOGS,
    
    PERMISSIONS.MANAGE_SITE_SETTINGS,
    PERMISSIONS.MANAGE_SERVICES,
    PERMISSIONS.MANAGE_TAGS,
    
    PERMISSIONS.CREATE_ARTICLES,
    PERMISSIONS.EDIT_ALL_ARTICLES,
    PERMISSIONS.DELETE_ALL_ARTICLES,
    PERMISSIONS.VIEW_ALL_ARTICLES,
    PERMISSIONS.PUBLISH_ARTICLES,
    
    PERMISSIONS.MANAGE_ALL_FILES,
    PERMISSIONS.UPLOAD_FILES,
    PERMISSIONS.DELETE_FILES,
    
    PERMISSIONS.ACCESS_USER_CABINET,
    PERMISSIONS.VIEW_ASSIGNED_DOCUMENTS,
    PERMISSIONS.ACCESS_ADMIN_PANEL,
  ],
  
  EDITOR: [
    // Права редактора - ограниченные
    PERMISSIONS.CREATE_ARTICLES,
    PERMISSIONS.EDIT_OWN_ARTICLES,      // Только свои статьи
    PERMISSIONS.DELETE_OWN_ARTICLES,    // Только свои статьи
    PERMISSIONS.VIEW_ALL_ARTICLES,      // Может просматривать чужие (но не редактировать)
    PERMISSIONS.VIEW_OWN_ARTICLES,
    
    PERMISSIONS.MANAGE_ALL_FILES,       // Полный доступ к файловому менеджеру
    PERMISSIONS.UPLOAD_FILES,
    PERMISSIONS.DELETE_FILES,
    
    PERMISSIONS.ACCESS_USER_CABINET,
    PERMISSIONS.VIEW_ASSIGNED_DOCUMENTS,
    PERMISSIONS.ACCESS_ADMIN_PANEL,     // Ограниченный доступ к админке
  ],
  
  USER: [
    // Права обычного пользователя - минимальные
    PERMISSIONS.ACCESS_USER_CABINET,
    PERMISSIONS.VIEW_ASSIGNED_DOCUMENTS, // Только документы, назначенные админом
    PERMISSIONS.MANAGE_OWN_FILES,        // Только в рамках личного кабинета
  ],
} as const

/**
 * Проверяет, есть ли у пользователя конкретное разрешение
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  return rolePermissions?.includes(permission) ?? false
}

/**
 * Проверяет, есть ли у пользователя любое из указанных разрешений
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Проверяет, есть ли у пользователя все указанные разрешения
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * Получает все разрешения для указанной роли
 */
export function getRolePermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] ?? []
}

/**
 * Проверяет, может ли пользователь редактировать статью
 * @param userRole роль пользователя
 * @param userId ID пользователя
 * @param articleAuthorId ID автора статьи
 */
export function canEditArticle(userRole: UserRole, userId: number, articleAuthorId: number): boolean {
  // Админ может редактировать любые статьи
  if (hasPermission(userRole, PERMISSIONS.EDIT_ALL_ARTICLES)) {
    return true
  }
  
  // Редактор может редактировать только свои статьи
  if (hasPermission(userRole, PERMISSIONS.EDIT_OWN_ARTICLES) && userId === articleAuthorId) {
    return true
  }
  
  return false
}

/**
 * Проверяет, может ли пользователь удалить статью
 */
export function canDeleteArticle(userRole: UserRole, userId: number, articleAuthorId: number): boolean {
  // Админ может удалять любые статьи
  if (hasPermission(userRole, PERMISSIONS.DELETE_ALL_ARTICLES)) {
    return true
  }
  
  // Редактор может удалять только свои статьи
  if (hasPermission(userRole, PERMISSIONS.DELETE_OWN_ARTICLES) && userId === articleAuthorId) {
    return true
  }
  
  return false
}

/**
 * Проверяет доступ к админской панели
 */
export function canAccessAdminPanel(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.ACCESS_ADMIN_PANEL)
}

/**
 * Проверяет права на управление пользователями
 */
export function canManageUsers(userRole: UserRole): boolean {
  return hasPermission(userRole, PERMISSIONS.MANAGE_USERS)
}