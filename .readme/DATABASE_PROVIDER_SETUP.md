# Database Provider System (Simplified)

Упрощенная система для работы с разными базами данных в зависимости от среды.

## 📋 Описание

Простое решение для автоматического выбора правильных переменных окружения и обработки специфики Supabase миграций.

## 🔧 Среды

### Local (разработка)
- **Файл**: `.env.local`
- **База данных**: PostgreSQL в Docker
- **Команды**: обычные Prisma команды

### Production (Supabase)
- **Файл**: `.env.production`  
- **База данных**: Supabase PostgreSQL
- **Особенность**: используется DIRECT_URL для миграций (обход pgbouncer)

## 🚀 Команды

### Локальная разработка
```bash
npm run db:migrate          # prisma migrate dev
npm run db:seed             # seed данные
npm run db:studio           # Prisma Studio
npm run db:reset            # сброс БД
npm run db:fresh            # reset + seed
```

### Продакшн (Supabase)
```bash
npm run db:migrate:prod     # migrate deploy с DIRECT_URL
npm run db:deploy:prod      # то же что migrate:prod
npm run db:seed:prod        # seed в Supabase
npm run db:studio:prod      # Studio для Supabase
npm run db:fresh:prod       # reset + seed в Supabase
```

## 🔧 Как это работает

### Простой runner скрипт
Файл `scripts/prisma-runner.js` выполняет:

1. **Загружает нужный .env файл** (.env.local или .env.production)
2. **Для Supabase миграций** заменяет DATABASE_URL на DIRECT_URL
3. **Запускает обычную Prisma команду** с правильными переменными

### Ключевая особенность для Supabase
```javascript
// Для продакшн миграций автоматически используем DIRECT_URL
if (isProd && command === 'migrate') {
  process.env.DATABASE_URL = envVars.DIRECT_URL; // Обход pgbouncer!
}
```

## 🛠 Переменные окружения

### .env.local
```bash
DATABASE_URL="postgresql://postgres:1234@localhost:5432/mydb?schema=public"
DIRECT_URL="postgresql://postgres:1234@localhost:5432/mydb?schema=public"
```

### .env.production  
```bash
# Обычное подключение через connection pooling
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Прямое подключение для миграций (БЕЗ pgbouncer!)
DIRECT_URL="postgresql://postgres.xxx:[PASSWORD]@aws-xxx.pooler.supabase.com:5432/postgres"
```

## ✅ Преимущества упрощенного решения

1. **Один файл** вместо множества .mjs файлов
2. **Простая логика** - легко понять и поддерживать  
3. **Правильная обработка Supabase** - автоматическое использование DIRECT_URL
4. **Знакомые команды** - обычные npm run команды
5. **Минимум кода** - решает конкретную проблему без избыточности

## 🚨 Решение проблемы с редактированием статей

Проблема в продакшене была связана с тем, что миграции не применились к Supabase БД.

**Решение:**
```bash
npm run db:migrate:prod
```

Эта команда правильно применит все миграции к Supabase используя DIRECT_URL.
