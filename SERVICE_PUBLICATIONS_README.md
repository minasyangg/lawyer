# Секция "Последние публикации" на странице услуги

## Описание функциональности

На каждой странице услуги отображается секция с 3 последними публикациями (статьями).

## Приоритет отображения статей

Логика реализована в функции `getRelatedArticles()` в `src/lib/services.ts`:

1. **Сначала** отображаются статьи из той же категории (где `categoryId === serviceId`)
2. **Если статей из категории меньше 3**, добавляются статьи из других категорий
3. **Учитываются статьи без категории** (`categoryId === null`)
4. **Всегда** отображаются только опубликованные статьи (`published === true`)
5. **Сортировка** по дате создания (сначала новые)

## Компоненты

### ServicePublicationsSection.tsx
`src/components/services/ServicePublicationsSection.tsx`

**Особенности:**
- Адаптивная 3-колоночная сетка (mobile: 1 колонка, tablet: 2, desktop: 3)
- Белые карточки с тенью по дизайну Figma
- Изображение-заглушка `/img/article-placeholder.svg`
- Кнопка со стрелкой для перехода к статье
- Line-clamp для заголовка (2 строки) и описания (3 строки)
- Hover-эффект: scale-[1.02]

**Props:**
```typescript
interface Article {
  id: number;
  title: string;
  excerpt: string | null;
  slug: string;
}

interface ServicePublicationsSectionProps {
  articles: Article[];
}
```

### Функция getRelatedArticles()
`src/lib/services.ts`

**Сигнатура:**
```typescript
export async function getRelatedArticles(
  serviceId: number, 
  limit: number = 3
): Promise<Article[]>
```

**Параметры:**
- `serviceId` - ID услуги для фильтрации статей по категории
- `limit` - максимальное количество статей (по умолчанию 3)

**Возвращает:**
Массив статей с полями: `id`, `title`, `excerpt`, `slug`

## Интеграция в страницу услуги

В `src/app/(services)/[slug]/page.tsx`:

```typescript
// Получение статей
const relatedArticles = await getRelatedArticles(service.id, 3)

// Отображение компонента
<ServicePublicationsSection articles={relatedArticles} />
```

## Тестирование

### Сценарии для тестирования:

1. **Услуга с ≥3 статьями в категории**
   - Должны отобразиться только 3 статьи из этой категории

2. **Услуга с 1-2 статьями в категории**
   - Должны отобразиться статьи из категории + статьи из других категорий до 3 шт.

3. **Услуга без статей в категории**
   - Должны отобразиться 3 последние статьи из любых категорий

4. **Услуга без категории (categoryId === null)**
   - Должны включаться в общий пул статей для заполнения

5. **Всего статей в БД < 3**
   - Должны отобразиться все доступные статьи (секция всё равно показывается)

6. **Нет опубликованных статей**
   - Секция не отображается (благодаря `if (articles.length === 0) return null`)

## Дизайн (Figma)

- Node ID: `28:1706` - Frame "Последние публикации"
- Карточки: Node IDs `28:1709`, `28:1716`, `28:1723`
- Макет: белые карточки 336×460px, gap 16px
- Тень: `0px 0px 1px 0px rgba(0,0,0,0.4), 0px 12px 12px -6px rgba(0,0,0,0.16)`
- Закругление: 16px
- Цвет кнопки: `#0426A1` (primary blue)

## Адаптивность

- **Mobile** (< 768px): 1 колонка, отступы 20px, заголовок 30px
- **Tablet** (768-1023px): 2 колонки, отступы 60px, заголовок 36px
- **Desktop** (≥1024px): 3 колонки, отступы 200px, заголовок 48px

## Связанные файлы

- `src/lib/services.ts` - функция `getRelatedArticles()`
- `src/components/services/ServicePublicationsSection.tsx` - компонент секции
- `src/app/(services)/[slug]/page.tsx` - интеграция в страницу услуги
- `prisma/schema.prisma` - модели `Article`, `Service`

## База данных

**Связь статей с услугами:**
```prisma
model Article {
  categoryId  Int?
  category    Service? @relation(fields: [categoryId], references: [id])
}

model Service {
  articles    Article[]
}
```

**Важно:** 
- `categoryId` может быть `null` (статья без категории)
- Только статьи с `published: true` отображаются на сайте
