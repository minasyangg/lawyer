# Обновление дизайна страницы услуг по Figma

## Дата обновления: 5 октября 2025

### Изменения в дизайне страницы услуг

## 1. Hero Section
**Обновления:**
- ✅ Высота: фиксированная 463px (вместо min-height)
- ✅ Заголовок: Inter, 64px, font-bold, leading-[1.21], tracking-[-0.02em]
- ✅ Описание: Inter, 20px, font-normal, leading-[1.2]
- ✅ Кнопка "Заказать услугу" с иконкой chevron-right
- ✅ Градиент overlay: from-[#0426A1] to-[#0B1C48] (без прозрачности)
- ✅ Отступы: pl-[200px] на desktop
- ✅ Цвет текста заголовка: #F2F7FA

## 2. ServicePracticeSection (Услуги практики)
**Обновления:**
- ✅ Цвет карточек: bg-[#F2F7FA] (светло-серый, вместо белого)
- ✅ **НУМЕРАЦИЯ**: Добавлена автоматическая нумерация услуг (1. 2. 3. ...)
- ✅ Заголовок карточки: Inter, 48px, font-bold, leading-[1.2]
- ✅ Текст услуг: Inter, 20px, font-normal, leading-[1.5]
- ✅ Gap между карточками: 34px
- ✅ Тень: shadow-[0px_0px_1px_0px_rgba(0,0,0,0.4),0px_12px_12px_-6px_rgba(0,0,0,0.16)]
- ✅ Для налоговой практики: использует названия категорий из БД (Налоговые споры, Налоговый консалтинг)

## 3. ButtonFeedback (Мы всегда ждем Ваших обращений)
**Компонент:** `src/components/ui/buttons/ButtonFeedback.tsx`

**Обновления:**
- ✅ Фон: gradient from-[#0426A1] to-[#0027B3] (синий градиент)
- ✅ Заголовок: Inter, 48px, font-bold, leading-[1.2], color: #F2F7FA
- ✅ Кнопка: белая с текстом "Связаться с нами" и иконкой chevron-right
- ✅ Layout: flex-row justify-between (заголовок слева, кнопка справа)
- ✅ Padding: py-20 px-[60px]

## 4. ReadPublicationsCTA (Читать другие наши публикации)
**Новый компонент:** `src/components/services/ReadPublicationsCTA.tsx`

**Характеристики:**
- ✅ Фон: gradient from-[#0426A1] to-[#0027B3]
- ✅ Заголовок: "Читать другие наши публикации", Inter, 48px, font-bold
- ✅ Кнопка: "Читать" с иконкой chevron-right
- ✅ Ссылка: `/publications`
- ✅ Layout: flex-row justify-between

## 5. Структура страницы (порядок секций)

Новый порядок согласно Figma:

1. **Header** (навигация)
2. **Hero Section** (изображение + заголовок + описание + кнопка)
3. **ServiceDescriptionSection** (Описание услуги)
4. **ServicePracticeSection** (Услуги практики с нумерацией)
5. **ButtonFeedback** (Мы всегда ждем Ваших обращений) - CTA
6. **ServicePublicationsSection** (Последние публикации - 3 карточки)
7. **ReadPublicationsCTA** (Читать другие наши публикации) - CTA
8. **Footer**

### ❌ Удалено:
- Компонент `ServiceDetails` (старый функционал)
- Разделы с "features", "benefits", "price", "duration"

## Цветовая палитра из Figma

```css
/* Основные цвета */
--white: #FFFFFF (#6LEFHA)
--light-bg: #F2F7FA (#Z9KVSL) /* Светлый фон для карточек */
--black: #060606 (#IYI6JO) /* Основной текст */
--primary-blue: #0426A1 (#OZDLEX) /* Кнопки, акценты */
--gradient-blue: linear-gradient(90deg, #0426A1 0%, #0027B3 100%) (#UBWJM2)
--dark-blue: #0B1C48 /* Для градиентов hero */
--footer-bg: #56647F (#Z2P9NX) /* Фон footer */
```

## Типографика

```css
/* Заголовки */
h1 (Hero): Inter, 64px, bold, line-height: 1.21, tracking: -2%
h2 (Секции): Inter, 48px, bold, line-height: 1.2
h3 (Карточки): Inter, 48px, bold, line-height: 1.2

/* Текст */
Body Large: Inter, 20px, normal, line-height: 1.5
Body Medium: Inter, 16px, normal, line-height: 1.2
Button Text: Inter, 16px, bold, line-height: 1.5
```

## Тени

```css
/* Карточки */
box-shadow: 0px 0px 1px 0px rgba(0, 0, 0, 0.4), 
            0px 12px 12px -6px rgba(0, 0, 0, 0.16);
```

## Отступы

```css
/* Desktop (≥1024px) */
--section-padding-x: 200px (left), 60px (right для Hero)
--section-padding-y: 80px

/* Tablet (768-1023px) */
--section-padding-x: 60px
--section-padding-y: 60px

/* Mobile (<768px) */
--section-padding-x: 20px
--section-padding-y: 40px
```

## Тестирование

### Проверьте:
1. ✅ Нумерация услуг в карточках (1. 2. 3. ...)
2. ✅ Цвет карточек ServicePractice - светло-серый (#F2F7FA)
3. ✅ Градиентный фон у CTA-секций (синий градиент)
4. ✅ Кнопка "Заказать услугу" в Hero
5. ✅ Кнопка "Читать" ведет на `/publications`
6. ✅ Footer отображается внизу страницы
7. ✅ Для налоговой практики: два заголовка из БД (Налоговые споры, Налоговый консалтинг)
8. ✅ Адаптивность всех секций на mobile/tablet/desktop

## Figma Reference

- **Node ID**: 28:1189 (Услуги налоговой практики)
- **URL**: https://www.figma.com/design/md1FLSdbzgqnHCmrGio3Ns/Юр-услуги?node-id=28-1189&m=dev

## Файлы с изменениями

1. `src/app/(services)/[slug]/page.tsx` - основная страница услуги
2. `src/components/services/ServicePracticeSection.tsx` - карточки с нумерацией
3. `src/components/services/ReadPublicationsCTA.tsx` - новый CTA компонент
4. `src/components/ui/buttons/ButtonFeedback.tsx` - обновлен дизайн
5. `src/components/services/ServicePublicationsSection.tsx` - уже был создан ранее
