# File Manager System

Комплексная система управления файлами с ролевой моделью доступа для Next.js приложения.

## 📋 Содержание

- [Обзор системы](#обзор-системы)
- [Архитектура](#архитектура)
- [Структура файлов](#структура-файлов)
- [Ролевая модель](#ролевая-модель)
- [API Reference](#api-reference)
- [Использование](#использование)
- [Примеры кода](#примеры-кода)
- [Миграция данных](#миграция-данных)

## 🔍 Обзор системы

File Manager System предоставляет единый интерфейс для работы с файлами в приложении с поддержкой:

- **Ролевой модели доступа** (ADMIN, EDITOR, USER)
- **Server Actions** для оптимальной производительности
- **Виртуальной файловой системы** для безопасности
- **Автоматического отслеживания владельца** файлов
- **Гибких ограничений** по размеру и типам файлов

## 🏗️ Архитектура

Система построена на паттерне Provider с использованием Server Actions:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │───▶│  Server Actions  │───▶│  FileManager    │
│                 │    │                  │    │    Provider     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   Prisma DB     │
                                                │  File System    │
                                                └─────────────────┘
```

## 📁 Структура файлов

```
src/lib/filemanager/
├── types.ts          # Типы и интерфейсы системы
├── provider.ts       # Основной класс RoleBasedFileManagerProvider
└── factory.ts        # Server Action фабрика для создания провайдера

src/app/actions/filemanager/
├── files.ts          # Server Actions для работы с файлами
├── folders.ts        # Server Actions для работы с папками
└── editor.ts         # Упрощенные Server Actions для редактора

src/components/
└── FileManagerTest.tsx  # Тестовый компонент (пример использования)
```

## 👥 Ролевая модель

### ADMIN (Администратор)
```typescript
{
  canUpload: true,          // Может загружать файлы
  canDelete: true,          // Может удалять любые файлы
  canViewAll: true,         // Видит все файлы
  canManageFolders: true,   // Может создавать/удалять папки
  maxFileSize: 50 * 1024 * 1024,  // 50MB
  allowedTypes: ['*']       // Все типы файлов
}
```

### EDITOR (Редактор)
```typescript
{
  canUpload: true,          // Может загружать файлы
  canDelete: true,          // Может удалять только свои файлы
  canViewAll: false,        // Видит только свои файлы
  canManageFolders: false,  // Не может управлять папками
  maxFileSize: 25 * 1024 * 1024,  // 25MB
  allowedTypes: [           // Ограниченный список типов
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
}
```

### USER (Пользователь)
```typescript
{
  canUpload: false,         // Не может загружать
  canDelete: false,         // Не может удалять
  canViewAll: false,        // Видит только публичные файлы
  canManageFolders: false,  // Не может управлять папками
  maxFileSize: 0,           // Размер не важен
  allowedTypes: []          // Типы не важны
}
```

## 📚 API Reference

### Server Actions для файлов (`/app/actions/filemanager/files.ts`)

#### `uploadFiles(formData: FormData)`
Загрузка файлов с проверкой прав доступа.

**Параметры:**
- `formData` - FormData с файлами и опциональным `folderId`

**Возвращает:**
```typescript
{
  success: boolean;
  files?: FileManagerFile[];
  error?: string;
}
```

#### `getFilesList(folderId?: number)`
Получение списка файлов с учетом ролевых ограничений.

**Параметры:**
- `folderId` - ID папки (опционально)

#### `deleteFile(fileId: number)`
Удаление файла с проверкой прав доступа.

### Server Actions для папок (`/app/actions/filemanager/folders.ts`)

#### `getFoldersList(parentId?: number)`
Получение списка папок.

#### `createFolder(name: string, parentId?: number)`
Создание новой папки (только для ADMIN).

#### `deleteFolder(folderId: number)`
Удаление папки (только для ADMIN).

### Server Actions для редактора (`/app/actions/filemanager/editor.ts`)

#### `getUserFilePermissions()`
Получение разрешений текущего пользователя.

#### `getEditorFiles()`
Получение файлов для редактора (упрощенная версия).

## 🚀 Использование

### 1. Базовое использование в компоненте

```tsx
"use client"

import { useState, useEffect } from 'react'
import { uploadFiles, getFilesList, deleteFile } from '@/app/actions/filemanager/files'
import { getUserFilePermissions } from '@/app/actions/filemanager/editor'

export default function MyFileManager() {
  const [files, setFiles] = useState([])
  const [permissions, setPermissions] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [filesResult, permissionsResult] = await Promise.all([
      getFilesList(),
      getUserFilePermissions()
    ])

    if (filesResult.success) {
      setFiles(filesResult.files)
    }

    if (permissionsResult.success) {
      setPermissions(permissionsResult.permissions)
    }
  }

  const handleUpload = async (event) => {
    const formData = new FormData()
    const files = event.target.files
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }

    const result = await uploadFiles(formData)
    if (result.success) {
      loadData() // Перезагружаем список
    }
  }

  return (
    <div>
      {permissions?.canUpload && (
        <input type="file" multiple onChange={handleUpload} />
      )}
      
      <div>
        {files.map(file => (
          <div key={file.id}>
            <span>{file.filename}</span>
            {permissions?.canDelete && (
              <button onClick={() => deleteFile(file.id)}>
                Удалить
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 2. Работа с папками

```tsx
import { getFoldersList, createFolder } from '@/app/actions/filemanager/folders'

const handleCreateFolder = async (name: string) => {
  const result = await createFolder(name)
  if (result.success) {
    console.log('Папка создана:', result.folder)
  }
}

const loadFolders = async () => {
  const result = await getFoldersList()
  if (result.success) {
    setFolders(result.folders)
  }
}
```

### 3. Проверка разрешений

```tsx
import { getUserFilePermissions } from '@/app/actions/filemanager/editor'

const checkPermissions = async () => {
  const result = await getUserFilePermissions()
  if (result.success) {
    const { permissions } = result
    
    if (permissions.canUpload) {
      // Показать кнопку загрузки
    }
    
    if (permissions.canManageFolders) {
      // Показать управление папками
    }
    
    console.log('Максимальный размер файла:', permissions.maxFileSize)
    console.log('Разрешенные типы:', permissions.allowedTypes)
  }
}
```

## 💡 Примеры кода

### Компонент загрузки с проверкой ограничений

```tsx
const FileUploader = () => {
  const [permissions, setPermissions] = useState(null)

  const validateFile = (file: File) => {
    if (!permissions) return false

    // Проверка размера
    if (file.size > permissions.maxFileSize) {
      toast.error(`Файл слишком большой. Максимум: ${permissions.maxFileSize / 1024 / 1024}MB`)
      return false
    }

    // Проверка типа
    if (!permissions.allowedTypes.includes('*') && 
        !permissions.allowedTypes.includes(file.type)) {
      toast.error(`Тип файла не поддерживается: ${file.type}`)
      return false
    }

    return true
  }

  const handleUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(validateFile)
    
    if (validFiles.length === 0) {
      toast.error('Нет валидных файлов для загрузки')
      return
    }

    const formData = new FormData()
    validFiles.forEach(file => formData.append('files', file))

    const result = await uploadFiles(formData)
    // Обработка результата...
  }

  return (
    // JSX компонента...
  )
}
```

### Файловый браузер с папками

```tsx
const FileBrowser = () => {
  const [currentFolder, setCurrentFolder] = useState(null)
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])

  const navigateToFolder = async (folderId: number | null) => {
    const [filesResult, foldersResult] = await Promise.all([
      getFilesList(folderId),
      getFoldersList(folderId)
    ])

    if (filesResult.success) setFiles(filesResult.files)
    if (foldersResult.success) setFolders(foldersResult.folders)
    setCurrentFolder(folderId)
  }

  return (
    <div>
      {/* Навигация по папкам */}
      <div>
        {folders.map(folder => (
          <div key={folder.id} onClick={() => navigateToFolder(folder.id)}>
            📁 {folder.name}
          </div>
        ))}
      </div>

      {/* Список файлов */}
      <div>
        {files.map(file => (
          <div key={file.id}>
            📄 {file.filename}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 🔄 Миграция данных

### Добавление поля uploadedBy к существующим файлам

Если у вас есть существующие файлы без поля `uploadedBy`, выполните миграцию:

```sql
-- Обновление существующих файлов (назначить админу)
UPDATE "File" SET "uploadedBy" = (
  SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1
) WHERE "uploadedBy" IS NULL;
```

### Скрипт для синхронизации файлов

```javascript
// scripts/syncFileOwnership.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function syncFileOwnership() {
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    console.error('Администратор не найден')
    return
  }

  const updatedFiles = await prisma.file.updateMany({
    where: { uploadedBy: null },
    data: { uploadedBy: adminUser.id }
  })

  console.log(`Обновлено файлов: ${updatedFiles.count}`)
}

syncFileOwnership()
```

## 🔧 Конфигурация

### Настройка ролевых ограничений

Измените конфигурацию в `src/lib/filemanager/types.ts`:

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: {
    // Ваши настройки для админа
  },
  EDITOR: {
    // Ваши настройки для редактора
    maxFileSize: 10 * 1024 * 1024, // Изменить на 10MB
    allowedTypes: ['image/jpeg', 'image/png'] // Только изображения
  },
  USER: {
    // Настройки для пользователя
  }
}
```

### Добавление новых типов файлов

```typescript
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

// Добавить в allowedTypes для нужной роли
```

## 🚨 Безопасность

1. **Виртуальные пути**: Все файлы доступны через виртуальные ID, не показывая реальную структуру
2. **Ролевая проверка**: Каждое действие проверяется на уровне сервера
3. **Валидация файлов**: Проверка типа, размера и содержимого файлов
4. **Отслеживание владельца**: Каждый файл привязан к пользователю

## 📈 Производительность

- **Server Actions**: Оптимизированная передача данных без дополнительных HTTP запросов
- **Lazy Loading**: Подгрузка файлов по мере необходимости
- **Кэширование**: Использование Next.js кэша с revalidatePath
- **Chunked Upload**: Поддержка больших файлов через FormData

## 🐛 Отладка

### Включение логирования

```typescript
// В provider.ts добавьте логирование
console.log('FileManager operation:', {
  userId: this.userId,
  userRole: this.userRole,
  operation: 'upload',
  fileCount: files.length
})
```

### Проверка разрешений

```typescript
const permissions = await getUserFilePermissions()
console.log('User permissions:', permissions)
```

---

## 📞 Поддержка

При возникновении проблем проверьте:

1. **Права доступа**: Убедитесь, что пользователь авторизован
2. **Роль пользователя**: Проверьте правильность роли в базе данных
3. **Размер файлов**: Соответствие ограничениям роли
4. **Типы файлов**: Валидность MIME типов
5. **Структура папок**: Корректность связей parent-child

Для получения дополнительной помощи обратитесь к исходному коду в соответствующих файлах системы.