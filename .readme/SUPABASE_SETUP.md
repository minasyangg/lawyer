# Настройка Supabase для проекта

## Подготовка

1. Зайдите в [Supabase](https://supabase.com) и создайте новый проект
2. Выберите регион (лучше ближе к вашим пользователям)
3. Установите пароль для базы данных

## Получение конфигурации

### В Supabase Dashboard:

1. **Project Settings → API**:
   - `Project URL` → скопируйте в `SUPABASE_URL`
   - `anon public` ключ → скопируйте в `SUPABASE_ANON_KEY`
   - `service_role` ключ → скопируйте в `SUPABASE_SERVICE_ROLE_KEY`

2. **Project Settings → Database**:
   - Скопируйте строку подключения из раздела "Connection string"
   - Формат: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - Вставьте в `DATABASE_URL` и `DIRECT_URL`

## Локальная настройка

1. Обновите `.env` файл с вашими Supabase данными
2. Выполните команды:

```bash
# Генерация Prisma клиента
npm run postinstall

# Применение миграций к Supabase БД
npm run db:push

# Опционально: просмотр данных
npm run db:studio
```

## Настройка Vercel

1. Зайдите в настройки вашего проекта на Vercel
2. Перейдите в раздел "Environment Variables"
3. Добавьте все переменные из `.env.production`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` 
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - Остальные переменные проекта

4. Сделайте redeploy проекта

## Миграция данных (если нужна)

Если у вас есть данные в старой SQLite базе:

1. Установите sqlite3: `npm install sqlite3`
2. Запустите: `node scripts/migrate-to-supabase.js`

## Проверка

1. Откройте Supabase Dashboard → Table Editor
2. Убедитесь, что все таблицы созданы
3. Проверьте работу приложения на Vercel

## Полезные команды

```bash
# Просмотр статуса миграций
npx prisma migrate status

# Сброс БД (только для разработки!)
npm run db:reset

# Применение изменений схемы
npm run db:push

# Создание новой миграции
npm run db:migrate

# Применение миграций на продакшене
npm run db:deploy
```
