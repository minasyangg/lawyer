# FileManager: Анализ Server Actions и API использования

## Используемые Server Actions в FileManager компонентах

### 1. FileManagerPage.tsx (главная страница файлового менеджера)
Импортирует и использует следующие Server Actions:
```typescript
import { 
  uploadFile, 
  createFolder, 
  listFiles, 
  deleteFile, 
  deleteFolder,
  renameFolder,
  getFolderTree,
  debugSession,
  type FileManagerItem,
  type FolderTreeNode
} from '@/app/actions/filemanager'
```

### 2. FileManager.tsx (модальная версия)
Импортирует и использует:
```typescript
import { 
  uploadFile, 
  createFolder, 
  listFiles, 
  deleteFile, 
  deleteFolder,
  renameFolder,
  getFolderTree,
  type FileManagerItem,
  type FolderTreeNode
} from '@/app/actions/filemanager'
```

### 3. FileViewer.tsx
Использует:
```typescript
import { getFile } from '@/app/actions/filemanager/getFile'
```

### 4. RichTextEditor.tsx
Динамически импортирует:
```typescript
const { uploadFileForEditor } = await import('@/app/actions/filemanager/editor')
```

## Используемые API роуты

### Активно используемые API
1. **`/api/filemanager/rename-folder`** - используется в `RenameFolderModal.tsx`
   - Файл: `src/app/api/filemanager/rename-folder/route.ts`
   - Статус: **ОСТАВИТЬ** (используется компонентом)

2. **`/api/files/[id]`** - для прямого доступа к файлам
   - Файл: `src/app/api/files/[id]/route.ts`
   - Статус: **ОСТАВИТЬ** (необходим для Supabase Storage)

3. **`/api/files/virtual/[virtualId]`** - для доступа к файлам по виртуальному ID
   - Файл: `src/app/api/files/virtual/[virtualId]/route.ts`
   - Статус: **ОСТАВИТЬ** (необходим для Supabase Storage)

### Неиспользуемые API (кандидаты на удаление)

1. **`/api/filemanager/files`** (GET, POST)
   - Файл: `src/app/api/filemanager/files/route.ts`
   - Статус: **УДАЛИТЬ** (функциональность дублируется Server Actions)

2. **`/api/filemanager/files/[id]`** (GET, DELETE)
   - Файл: `src/app/api/filemanager/files/[id]/route.ts`
   - Статус: **УДАЛИТЬ** (функциональность дублируется Server Actions)

3. **`/api/filemanager/folders`** (GET, POST)
   - Файл: `src/app/api/filemanager/folders/route.ts`
   - Статус: **УДАЛИТЬ** (функциональность дублируется Server Actions)

4. **`/api/upload`** (POST)
   - Файл: `src/app/api/upload/route.ts`
   - Статус: **УДАЛИТЬ** (функциональность дублируется Server Actions)

## Рекомендуемые действия

### 1. Удалить неиспользуемые API файлы:
```bash
rm src/app/api/filemanager/files/route.ts
rm src/app/api/filemanager/files/[id]/route.ts  
rm src/app/api/filemanager/folders/route.ts
rm src/app/api/upload/route.ts
```

### 2. Обновить middleware.ts
Удалить ссылки на удаленные API маршруты из файла `src/middleware.ts`:
- Убрать `/api/upload/:path*` из matcher
- Проверить другие ссылки на удаленные маршруты

### 3. Оставить без изменений
- **RenameFolderModal.tsx** - оставить использование API как есть
- **Server Actions** - не трогать, они работают корректно
- **API для доступа к файлам** - оставить для Supabase Storage

## Преимущества такого подхода

1. **Гибкость**: API для работы с Supabase Storage остается независимым от UI
2. **Минимальные изменения**: не нужно переписывать RenameFolderModal
3. **Чистота кода**: удаляем только действительно неиспользуемые API
4. **Совместимость**: сохраняем работоспособность всех компонентов

## Заключение

Текущая архитектура уже эффективно использует Server Actions для основных операций файлового менеджера. Единственный компонент, использующий API напрямую - это RenameFolderModal, что является приемлемым решением. Удаление неиспользуемых API роутов упростит кодовую базу без нарушения функциональности.