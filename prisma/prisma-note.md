 Порядок команд для правильной работы с БД:

  1. Сброс и создание БД:
  # Удалить БД файл
  rm prisma/dev.db

  # Создать БД из схемы
  npx prisma db push

  # Генерировать клиент
  npx prisma generate

  2. Заполнение данными (seeds):
  # Запустить все seed файлы
  npx tsx prisma/seeds/seedServices.ts
  npx tsx prisma/seeds/seedServiceDetails.ts

  3. Для разработки (повседневные команды):
  # Применить изменения схемы к БД
  npx prisma db push

  # Создать миграцию (для production)
  npx prisma migrate dev --name migration_name

  # Просмотр БД в браузере
  npx prisma studio

  4. В случае проблем:
  # Пересоздать клиент
  npx prisma generate

  # Проверить статус
  npx prisma migrate status
