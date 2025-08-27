# Сайт юридических услуг
## Структура:
- `src/app` - App Router страницы
- `/components` - UI компоненты  
- `/lib` - Утилиты
- `/public` - Статические файлы

## Технологии:
- Next.js 15
- TypeScript
- Tailwind CSS
- Prisma (база данных)

## Особенности
-	Использую Server Components
- API Routes в src/app/api/
- Middleware для авторизации
- используется prisma и SQLlite
- админ панель AdminJs

## Навигация
- pages
	- home
	- services
	- publications
	-	contacts
	- describe

### homePage
Структура страницы представлена сверху вниз:
	section homeInfo
	section services
	button feedback
		описание: при клике на кнопку всплывает форма обратной связи с отправкой данных клиента и сохранением данных в таблицу feedback
	section actuality
	section articles
		описание: всегда отображается последние три опубликованные статьи из БД. При клике на кнопку otherArticleButton первод на страницу /publications
	button subscribe
	section footer

### publicationPage
Структура страницы представлена сверху вниз:
	
		