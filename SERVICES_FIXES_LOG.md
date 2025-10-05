# Исправления дизайна страницы услуг

## Дата: 5 октября 2025 (обновление)

### Исправленные проблемы:

## 1. ✅ Hero Section - восстановлено изображение
**Проблема:** После редактирования пропало фоновое изображение

**Исправление:**
- Убран z-index у Image (был z-0)
- Overlay перемещен перед контентом
- Правильная структура слоев:
  1. Image (фон)
  2. Overlay (градиент затемнения)
  3. Контент (z-10)

```tsx
<section className="relative w-full h-[463px]">
  {/* Фоновое изображение - БЕЗ z-index */}
  <Image src={heroImage} fill className="object-cover" />
  
  {/* Overlay - затемнение */}
  <div className="absolute inset-0 bg-gradient-to-b from-[#0426A1] to-[#0B1C48]" />
  
  {/* Контент поверх всего - z-10 */}
  <div className="relative z-10">...</div>
</section>
```

## 2. ✅ Контейнеры для всех секций
**Проблема:** Контент не был в едином контейнере

**Исправление:** Добавлен контейнер `max-w-[1320px] mx-auto` во все секции:

### Hero Section:
```tsx
<div className="relative z-10 w-full max-w-[1320px] mx-auto px-5 md:px-[60px] lg:px-0 lg:pl-[140px]">
```

### ServiceDescriptionSection:
```tsx
<div className="max-w-[1320px] mx-auto px-5 md:px-[60px] lg:px-0 lg:pl-[140px] lg:pr-[20px]">
```

### ServicePracticeSection:
```tsx
<div className="max-w-[1320px] mx-auto px-5 md:px-[60px] lg:px-0 lg:pl-[140px] lg:pr-[140px]">
```

### ServicePublicationsSection:
```tsx
<div className="max-w-[1320px] mx-auto px-5 md:px-[60px] lg:px-0 lg:pl-[140px] lg:pr-[140px]">
```

### ButtonFeedback:
```tsx
<div className="max-w-[1320px] mx-auto px-5 md:px-[60px] lg:px-0 lg:pl-[60px] lg:pr-[60px]">
```

### ReadPublicationsCTA:
```tsx
<div className="max-w-[1320px] mx-auto px-5 md:px-[60px] lg:px-0 lg:pl-[60px] lg:pr-[60px]">
```

## 3. ✅ Footer - обновлен на новый компонент
**Проблема:** Использовался старый Footer из `@/components/ui/Footer`

**Исправление:**
```tsx
// Старый импорт
import Footer from '@/components/ui/Footer'

// Новый импорт
import Footer from '@/components/section/Footer'
```

Теперь используется тот же Footer, что и на главной странице (`src/components/section/Footer.tsx`)

## 4. ✅ Изображение-заглушка для публикаций
**Проблема:** Использовалась неправильная заглушка

**Исправление:**
- Скачано изображение из Figma: `publication-placeholder-7fe93d.png`
- Размеры: 2950x1222 (cropped)
- Путь: `/img/publication-placeholder-7fe93d.png`

```tsx
<Image
  src="/img/publication-placeholder-7fe93d.png"
  alt={article.title}
  fill
  className="object-cover"
/>
```

## 5. ✅ Дизайн карточек публикаций
**Проблема:** Карточки не соответствовали дизайну Figma

**Исправления согласно Figma (node 43:500):**

### Размеры:
- Ширина карточки: `w-[344px]` (фиксированная)
- Высота карточки: `h-[460px]` (фиксированная)
- Высота изображения: `h-[145px]` (вместо 202px)

### Цвета:
- Фон карточки: `bg-[#F2F7FA]` (светло-серый, вместо белого)
- Кнопка: `bg-[#0426A1]` (синяя)
- Текст: `#060606` (черный)

### Типографика:
- Заголовок: Inter, 32px, bold, line-height: 1.2
- Описание: Inter, 16px, normal, line-height: 1.2
- Line-clamp: заголовок 2 строки, описание 3 строки

### Структура:
```tsx
<div className="bg-[#F2F7FA] rounded-2xl w-[344px] h-[460px] flex flex-col justify-end">
  {/* Изображение 145px */}
  <div className="h-[145px]">...</div>
  
  {/* Контент с padding */}
  <div className="p-5 pb-[26px]">
    <h3 className="text-[32px] font-bold line-clamp-2">...</h3>
    <p className="text-base line-clamp-3">...</p>
    <button>Иконка стрелки</button>
  </div>
</div>
```

### Тень:
```css
box-shadow: 0px 0px 1px 0px rgba(0, 0, 0, 0.4), 
            0px 12px 12px -6px rgba(0, 0, 0, 0.16);
```

## Структура контейнера

Все секции теперь используют единый контейнер:

```tsx
// Desktop (≥1024px)
max-w-[1320px] mx-auto
lg:pl-[140px] lg:pr-[140px] // Основной контент
lg:pl-[60px] lg:pr-[60px]   // CTA секции

// Tablet (768-1023px)
md:px-[60px]

// Mobile (<768px)
px-5 (20px)
```

## Файлы с изменениями:

1. ✅ `src/app/(services)/[slug]/page.tsx` - Hero section, Footer импорт
2. ✅ `src/components/services/ServiceDescriptionSection.tsx` - контейнер
3. ✅ `src/components/services/ServicePracticeSection.tsx` - контейнер
4. ✅ `src/components/services/ServicePublicationsSection.tsx` - дизайн карточек, изображение, контейнер
5. ✅ `src/components/ui/buttons/ButtonFeedback.tsx` - контейнер
6. ✅ `src/components/services/ReadPublicationsCTA.tsx` - контейнер
7. ✅ `public/img/publication-placeholder-7fe93d.png` - новое изображение

## Тестирование

### Проверьте:
1. ✅ Hero изображение отображается с градиентом
2. ✅ Все секции выровнены по левому краю с одинаковым отступом (140px на desktop)
3. ✅ Footer отображается правильно (новый компонент)
4. ✅ Изображения в карточках публикаций из Figma
5. ✅ Карточки публикаций светло-серые (#F2F7FA)
6. ✅ Размеры карточек: 344×460px с изображением 145px
7. ✅ Адаптивность на всех экранах

## Figma References

- **Карточка публикации**: Node 43:500
- **URL**: https://www.figma.com/design/md1FLSdbzgqnHCmrGio3Ns/Юр-услуги?node-id=43-500&m=dev
- **Изображение**: ba5e15b7f65ebc45fd2b7074fc9aed0e98e1d3d9 (cropped: 7fe93d)

## Контрольный список для финальной проверки

- [x] Hero изображение видно через градиент
- [x] Контейнеры max-w-[1320px] во всех секциях
- [x] Footer из `@/components/section/Footer`
- [x] Изображение `publication-placeholder-7fe93d.png` используется
- [x] Карточки публикаций bg-[#F2F7FA]
- [x] Размеры карточек 344×460px
- [x] Изображение в карточке 145px высота
- [x] Все тексты выровнены консистентно
