# 📑 Черновик ТЗ — Система управления файлами и статьями

## 1. Общая концепция
Приложение должно обеспечивать централизованное хранение файлов и статей с разделением прав доступа на основе ролей **ADMIN** и **EDITOR**. Все операции выполняются через **Server Actions** (если возможно) или через **API**, с использованием **Supabase JS** и Prisma ORM.

---

## 2. Роли и права доступа

### ADMIN
- Полный доступ ко всему файловому хранилищу и статьям.
- Может удалять, редактировать, перемещать файлы и папки любых пользователей.
- Может удалять даже защищённые (`isProtected`) файлы и папки, но только с подтверждением (toast).
- Видит структуру хранилища, сгруппированную по пользователям (`/users/{userId}/root`).
- Видит флаги `isProtected`, `isPublic`, `userId` у файлов.

### EDITOR
- Доступ только к своему файловому хранилищу.
- Может создавать/удалять/редактировать свои папки и файлы.
- Не видит чужих пользователей и их файлов.
- Не может удалять файлы или папки с `isProtected = true`.

### USER (гости сайта)
- Могут просматривать и скачивать только те файлы, у которых `isPublic = true`.
- Доступ осуществляется через публичные ссылки Supabase.

---

## 3. Структура БД (Prisma)
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  role      Role     @default(EDITOR)
  files     FileEntity[]
  articles  Article[]
}

enum Role {
  ADMIN
  EDITOR
  USER (посетитель сайта)
}

model FileEntity {
  id          Int        @id @default(autoincrement())
  name        String
  path        String
  isFolder    Boolean    @default(false)
  isPublic    Boolean    @default(false)
  isProtected Boolean    @default(false)
  parentId    Int?
  parent      FileEntity? @relation("FolderChildren", fields: [parentId], references: [id])
  children    FileEntity[] @relation("FolderChildren")
  userId      Int
  user        User       @relation(fields: [userId], references: [id])
  articles    Article[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  deletedAt   DateTime?
}

model Article {
  id        Int          @id @default(autoincrement())
  title     String
  content   String
  files     FileEntity[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  deletedAt DateTime?
}
```

---

## 4. Флаги и правила
| Флаг | Описание |
|------|----------|
| `isPublic` | Автоматически становится `true`, если файл прикреплён к статье (доступен посетителям сайта). |
| `isProtected` | Автоматически становится `true`, если файл прикреплён хотя бы к одной статье (нельзя удалить случайно). |
| `deletedAt` | Используется для soft delete. При удалении происходит немедленное удаление файла из Supabase и пометка в БД. |

---

## 5. Логика удаления
- **Папка:** удаляется каскадно (все вложенные папки и файлы). Если хотя бы один файл защищён — EDITOR не может удалить, ADMIN может (с подтверждением которое вылезает ввиде toaster).
- **Файл:** EDITOR не может удалить `isProtected = true`, ADMIN может (с подтверждением которое вылезает ввиде toaster).
- **Статья:** при удалении проверяются все привязанные файлы, удаляются только те, что больше нигде не используются.

### UI-логика подтверждения
- Для ADMIN при удалении защищённых файлов/папок показывать **toast/modal**:
  - сообщение: "Файл используется в статьях, удаление приведёт к разрыву связей";
  - список статей или их количество;
  - кнопки: **Подтвердить удаление** (danger) / **Отмена**.
- Для EDITOR кнопка удаления недоступна для защищённых файлов (tooltip: "Файл используется в статье "название статьи или ссылка на неё"").

---

## 6. Server Actions и API
- **Server Actions:**
  - Создание/удаление/редактирование файлов и папок.
  - Загрузка файлов в Supabase и запись в Prisma.
  - Привязка/отвязка файлов к статьям (автоматическая установка флагов).
  - Каскадное удаление папок с проверкой прав.
  - Получение связанных статей для отображения в toaster.

- **API:**
  - Публичный список статей и файлов.
  - Генерация публичных Supabase URL (если используем подписанные ссылки)

- **Уже реализованные server Actions**
	- не нужно создавать отдельные serverActions для одного и тогоже либо схожего действия. Прежде чем создавать нужно изучить имеющиеся. Например все serverAction для  CRUI статей находятс по пути: /src/app/lib/app/lib/actions/article-actions.ts

> Примеры кода в документе являются рекомендованными и могут быть адаптированы агентом при условии, что не нарушается бизнес-логика.

---

## 7. Общие требования к коду
- Использовать **TypeScript** с явной типизацией.
- Для валидации входных данных — **Zod** или аналог.
- Для работы с БД — Prisma с использованием типизированных возвращаемых значений.
- Все действия должны возвращать типизированный результат (`{ success: boolean; message?: string }`).
- Ошибки — с понятными сообщениями для UI.

---

## 8. Требования к UI
- Полная стилизация через **Tailwind CSS**.
- Использовать существующую дизайн-систему проекта (shadcn/ui или аналоги).
- Все интерфейсы адаптивные, mobile-friendly.
- Флаги `isPublic` и `isProtected` отображаются значками или цветными бейджами.
- Поддержка темной темы, если она есть на сайте.

---

## 9. Примеры (рекомендации)

### Server Action: удаление папки
```ts
'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/session'

export async function deleteFolder(folderId: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const folder = await prisma.fileEntity.findUnique({
    where: { id: folderId, deletedAt: null },
    include: { children: true },
  })

  if (!folder) throw new Error('Папка не найдена')
  if (!folder.isFolder) throw new Error('Это не папка')

  if (user.role === 'EDITOR' && folder.userId !== user.id) {
    throw new Error('Нет доступа')
  }

  // Рекурсивное получение всех файлов, проверка isProtected, удаление из Supabase
  // ...
}
```

### Server Action: получение статей для файла
```ts
'use server'

export async function getFileArticles(fileId: number) {
  return prisma.fileEntity.findUnique({
    where: { id: fileId, deletedAt: null },
    include: { articles: { select: { id: true, title: true } } },
  })
}
```

### UI-тостер
```tsx
openConfirmToast({
  title: 'Файл используется в статьях',
  description: `Файл привязан к 3 статьям. Удаление приведет к разрыву связи`,
  confirmLabel: 'Удалить',
  cancelLabel: 'Отмена',
  onConfirm: () => deleteFileAction(file.id),
})
```