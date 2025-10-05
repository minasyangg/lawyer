# Файловый менеджер: API и Server Actions

## Обзор

Файловый менеджер в проекте использует как API роуты, так и Server Actions для выполнения операций с файлами и папками. В текущей реализации имеется дублирование функциональности между API и Server Actions.

## Server Actions

Server Actions расположены в директории `src/app/actions/filemanager/`. Эти функции могут быть вызваны напрямую из клиентских компонентов и обеспечивают полный функционал для работы с файлами.

### Основные Server Actions

| Имя | Файл | Описание | Параметры |
|-----|------|----------|-----------|
| `uploadFile` | `uploadFile.ts` | Загрузка файлов в выбранную папку | `formData`: FormData с файлами и folderId |
| `listFiles` | `listFiles.ts` | Получение списка файлов и папок для пользователя | `folderId`, `page`, `limit` |
| `createFolder` | `createFolder.ts` | Создание новой папки | `name`, `parentId` |
| `deleteFile` | `deleteFile.ts` | Удаление файла | `fileId`, `force` |
| `deleteFolder` | `deleteFolder.ts` | Удаление папки и её содержимого | `folderId`, `force` |
| `renameFolder` | `renameFolder.ts` | Переименование папки | `folderId`, `newName` |
| `getFile` | `getFile.ts` | Получение информации о файле | `fileId` |
| `getFolderTree` | `getFolderTree.ts` | Получение дерева папок | - |
| `checkFileUsage` | `checkFileUsage.ts` | Проверка использования файла в статьях | `fileId` |
| `checkMultipleFilesUsage` | `checkFileUsage.ts` | Проверка использования нескольких файлов | `fileIds` |

## API роуты

API роуты расположены в следующих директориях:
- `src/app/api/filemanager/`
- `src/app/api/upload/`
- `src/app/api/files/`

### API маршруты для файлового менеджера

| Маршрут | Метод | Файл | Описание | 
|---------|-------|------|----------|
| `/api/filemanager/files` | GET | `filemanager/files/route.ts` | Получение списка файлов |
| `/api/filemanager/files` | POST | `filemanager/files/route.ts` | Загрузка файлов |
| `/api/filemanager/files/[id]` | GET | `filemanager/files/[id]/route.ts` | Получение информации о файле |
| `/api/filemanager/files/[id]` | DELETE | `filemanager/files/[id]/route.ts` | Удаление файла |
| `/api/filemanager/folders` | GET | `filemanager/folders/route.ts` | Получение списка папок |
| `/api/filemanager/folders` | POST | `filemanager/folders/route.ts` | Создание новой папки |
| `/api/filemanager/rename-folder` | POST | `filemanager/rename-folder/route.ts` | Переименование папки |
| `/api/upload` | POST | `upload/route.ts` | Загрузка файла (устаревший метод) |
| `/api/files/[id]` | GET | `files/[id]/route.ts` | Получение файла по ID |
| `/api/files/virtual/[virtualId]` | GET | `files/virtual/[virtualId]/route.ts` | Получение файла по виртуальному ID |

## Анализ дублирования функциональности

Большинство API роутов дублируют функциональность, которая уже реализована через Server Actions. Это приводит к:

1. Избыточности кода
2. Потенциальным проблемам синхронизации при изменениях
3. Усложнению поддержки и развития системы

### Соответствие API и Server Actions

| API маршрут | Дублирующий Server Action |
|-------------|---------------------------|
| `GET /api/filemanager/files` | `listFiles` |
| `POST /api/filemanager/files` | `uploadFile` |
| `GET /api/filemanager/files/[id]` | `getFile` |
| `DELETE /api/filemanager/files/[id]` | `deleteFile` |
| `GET /api/filemanager/folders` | - (частично дублирует `listFiles`) |
| `POST /api/filemanager/folders` | `createFolder` |
| `POST /api/filemanager/rename-folder` | `renameFolder` |
| `POST /api/upload` | `uploadFile` |
| `GET /api/files/[id]` | - (требуется для прямого доступа к файлам) |
| `GET /api/files/virtual/[virtualId]` | - (требуется для прямого доступа к файлам) |

## Рекомендации по оптимизации

1. **Удалить избыточные API роуты:**
   - `GET /api/filemanager/files`
   - `POST /api/filemanager/files`
   - `GET /api/filemanager/files/[id]`
   - `DELETE /api/filemanager/files/[id]`
   - `POST /api/filemanager/folders`
   - `POST /api/filemanager/rename-folder`
   - `POST /api/upload`

2. **Оставить только необходимые API роуты:**
   - `GET /api/files/[id]` - для прямого доступа к файлам
   - `GET /api/files/virtual/[virtualId]` - для доступа к файлам по виртуальному ID

3. **Обновить компоненты для использования Server Actions:**
   - Заменить вызовы `fetch` на прямые вызовы Server Actions
   - Использовать `useTransition` для обработки состояния загрузки
   - Реализовать обработку ошибок на клиентской стороне

4. **Оптимизировать существующие Server Actions:**
   - Улучшить обработку ошибок
   - Добавить кеширование для повышения производительности
   - Реализовать пакетную обработку файлов

## Заключение

Переход на использование исключительно Server Actions для операций с файлами (за исключением прямого доступа к файлам) позволит:
- Упростить код
- Повысить производительность
- Улучшить безопасность
- Снизить затраты на поддержку