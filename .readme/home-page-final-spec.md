# Структура главной страницы (Home Page) — ФИНАЛЬНЫЕ ТРЕБОВАНИЯ

## 📋 Общие правила
- Desktop-first подход (затем адаптация для tablet и mobile)
- Все цвета через переменные Tailwind
- Все hover effects с transition
- Типизация TypeScript для всех компонентов
- Lazy-loading для изображений

---

## 🎨 Цветовая палитра (добавить в tailwind.config.cjs)

```javascript
colors: {
  primary: '#0426A1',        // Основной синий
  'primary-dark': '#0B1C48', // Темный синий (hover)
  'secondary': '#0027B3',    // Вторичный синий
  'dark-gray': '#56647F',    // Темно-серый (footer)
  'light-gray': '#F2F7FA',   // Светло-серый (текст на темном)
  'border-gray': '#E0E0E0',  // Границы полей
  'text-gray': '#828282',    // Placeholder текст
  'black': '#060606',        // Черный (кнопки)
  'white': '#FFFFFF',        // Белый
}
```

---

## 📐 Секции страницы (сверху вниз)

### 1️⃣ **Header** (обновить существующий)
**Файл:** `src/components/ui/HeaderClient.tsx`

**Изменения:**
- Логотип: использовать `logo-vector.svg` + текст "ПФК"
- Кнопка "Войти": добавить иконку `icon-chevron-right.svg`

**Hover effect:** ✅
- Стрелочка на кнопке "Войти" сдвигается **вправо на 5px** при hover
- CSS: `group-hover:translate-x-[5px] transition-transform duration-200`

---

### 2️⃣ **Hero Section**
**Файл:** `src/components/general/HeroSection.tsx`

**Содержимое:**
- Фон: `hero-moscow-skyline-6cd318.png` + градиент overlay
- H1: "Юридические услуги для бизнеса и частных лиц" (64px, font-bold)
- Подзаголовок: "Консультации, сопровождение сделок..." (20px)
- Список преимуществ (3 пункта, 20px, font-bold):
  - Быстрое реагирование на запросы
  - Опытные специалисты
  - Индивидуальный подход
- CTA кнопка: "Связаться с нами" + иконка `icon-chevron-right.svg`

**Hover effect:** ✅
- Фон кнопки: `bg-primary` → `bg-primary-dark`
- Стрелочка сдвигается **вправо на 5px**
- CSS: `hover:bg-primary-dark transition-all duration-200`

---

### 3️⃣ **Services Carousel (Карусель услуг)**
**Файл:** `src/components/general/ServicesCarousel.tsx`

**Содержимое:**
- Заголовок: "Услуги ПФК" (48px, font-bold, белый)
- Подзаголовок: "Консультации, сопровождение сделок..." (20px, белый)
- Кнопка: "Связаться с нами" (белая на темном фоне) + hover effect (стрелка +5px)
- **Горизонтальная карусель из 6 карточек**

**Карточки услуг:**
1. Услуги налоговой практики → `service-tax-7fe93d.png`
2. Разрешение споров и взыскание → `service-dispute-770963.png`
3. Услуги практики банкротства → `service-bankruptcy-2e9617.png`
4. Частным клиентам → `service-private-638726.png`
5. Разрешение споров и взыскание (дубль) → `service-dispute-2-4cd064.png`
6. Услуги практики по интелектуальным правам → `service-intellectual-27f422.png`

**Структура карточки** (`ServiceCard.tsx`):
- Изображение (верх, 145px высота)
- Заголовок услуги (32px, font-bold)
- Краткое описание (16px, placeholder текст)
- Кнопка-иконка `icon-arrow-bottom-right.svg` (круглая, синяя)

**Фон секции:**  
`background: linear-gradient(180deg, #0426A1 0%, #0B1C48 100%)`

**Логика карусели:** ✅
- Всегда видны: **3 полные карточки + половина 4-й**
- Навигация: **стрелки влево/вправо** по бокам
- Прокрутка: **сдвиг на 1 карточку** при клике на стрелку
- Infinite scroll (по желанию — вернуться к началу после последней)

**Клик на карточку:** ✅
- Redirect на страницу услуги через slug
- Использовать `createSlugFromTitle(title)` из `lib/services.ts`
- `router.push(\`/\${createSlugFromTitle(service.title)}\`)`

**Hover effect (опционально):**
- Карточка: `scale-105` при hover
- Shadow увеличивается

---

### 4️⃣ **Interactive Cells Section (3 hover-ячейки)**
**Файл:** `src/components/general/InteractiveCellsSection.tsx`

**Содержимое:**
- 3 ячейки по **480px ширина** каждая (на desktop)
- Высота: **600px**
- Фон неактивной ячейки: `#0426A1`

**Ячейки:**
1. **Ячейка 1:** "01 - Для успешного бизнеса" + изображение `carousel-business-1-6d744d.png`
2. **Ячейка 2 (центральная, активна по умолчанию):** "02 - Для развивающегося бизнеса" + изображение `carousel-image.png`
3. **Ячейка 3:** "03 - Для частных клиентов" + изображение `carousel-private-3-15424d.png`

**Логика hover-переключения:** ✅

**Состояние по умолчанию (при загрузке):**
- Ячейка 2 (центральная) **активна**: показывает изображение + градиент + номер + заголовок + описание
- Ячейки 1 и 3 **неактивны**: сплошной синий фон + номер + заголовок

**При hover/клике на ячейку 1:**
- Ячейка 1 становится **активной** (показывает свое изображение + контент)
- Ячейки 2 и 3 сворачиваются (только фон + текст)

**При hover/клике на ячейку 3:**
- Ячейка 3 становится **активной** (показывает свое изображение + контент)
- Ячейки 1 и 2 сворачиваются

**Макет активной ячейки:**
- Изображение на весь фон
- Градиент overlay: `linear-gradient(180deg, rgba(4,38,161,0.6) 63%, rgba(11,28,72,1) 100%)`
- Номер (01/02/03) + заголовок вверху (padding: 80px 40px)
- Описание внизу (опционально)

**Макет неактивной ячейки:**
- Сплошной фон `#0426A1`
- Номер + заголовок по центру
- `cursor-pointer`

**Transition:**  
`transition-all duration-500 ease-in-out`

**Реализация:**
- React `useState` для активной ячейки (по умолчанию `activeCell = 2`)
- `onMouseEnter` / `onClick` меняют `activeCell`
- Условный рендеринг контента

---

### 5️⃣ **CTA Banner Section**
**Файл:** `src/components/general/CTABanner.tsx`

**Содержимое:**
- Заголовок: "Кому подойдут наши услуги?" (48px, font-bold, белый)
- Градиентный фон: `linear-gradient(90deg, #0426A1 0%, #0027B3 100%)`
- Padding: `80px 60px`

**Hover effect:** ✅
- Если есть кнопка со стрелкой → стрелка сдвигается вправо на 5px
- (В макете виден только заголовок — возможно кнопка не нужна)

---

### 6️⃣ **Contact Form Section (Форма обращения)**
**Файл:** `src/components/general/ContactFormSection.tsx`

**Содержимое:**

**Левая часть (40% ширины):**
- Фоновое изображение: `contact-background-7d3ad3.png`
- Градиент overlay: `linear-gradient(180deg, rgba(4,38,161,0.6) 63%, rgba(11,28,72,1) 100%)`
- Border-radius: `16px 0 0 16px`
- Заголовок: "Обращение" (48px, font-bold, белый)
- Текст-описание (20px, font-medium, белый):
  - "Благодарим Вас за интерес к нашей компании..."
  - "Просим Вас оставить обращение..."
  - "Информация является строго конфиденциальной."
  - "Первичная консультация всегда бесплатна."

**Правая часть (60% ширины):**
- Фон: белый `#FFFFFF`
- Border-radius: `0 16px 16px 0`
- Padding: `80px 60px`
- Заголовок: "Свяжитесь со мной" (32px, font-semibold)
- Поля формы (все required):
  - **Имя** (input, placeholder: "Jane")
  - **Фамилия** (input, placeholder: "Smitherton")
  - **ОГРН / ОГРНИП** (input, placeholder: "1111111111111")
  - **Email** (input, placeholder: "email@janesfakedomain.net")
  - **Опишите Ваш вопрос** (textarea, placeholder: "Enter your question or message")
- **Checkbox:** ✅
  - Текст: "Я согласен с обработкой [персональных данных](/docs/confidence.pdf)"
  - Ссылка на `/docs/confidence.pdf` (создать файл или placeholder)
- Кнопка: "Обращение" (черная `#060606`, белый текст, full width)

**Стили полей:**
- Border: `1px solid #E0E0E0`
- Border-radius: `8px`
- Padding: `12px 16px`
- Font-size: `16px`
- Box-shadow: `0px 1px 2px rgba(0,0,0,0.05)`
- Focus: border меняется на `primary`

**Функционал:** ✅
- Валидация полей (required, email format)
- Отправка данных (через server action или API route)
- Показать success/error message после отправки

---

### 7️⃣ **Footer**
**Файл:** `src/components/section/Footer.tsx` ✅

**Содержимое:**
- Фон: `#56647F`
- Padding: `44px 60px`
- 3 колонки (flexbox, gap 40px):

**Колонка 1: ПФК**
- Логотип ПФК (`logo-vector.svg` + текст "ПФК")
- Описание: "Профессиональная юридическая помощь для бизнеса и частных лиц"
- Копирайт: "© 2025 ПФК. Все права защищены." (12px, светло-серый)

**Колонка 2: Наши услуги**
- Заголовок: "Наши услуги" (20px, font-bold, белый)
- Список из 6 услуг (12px, светло-серый):
  1. Услуги налоговой практики
  2. Услуги частным клиентам
  3. Услуги практики по интелектуальным правам
  4. Услуги практики банкротства
  5. Решение споров и взыскание
  6. Услуги по комплексному сопровождению бизнеса
- Каждая услуга — ссылка на страницу услуги (через slug)

**Колонка 3: Навигация**
- Заголовок: "Навигация" (20px, font-bold, белый)
- Ссылки (16px, светло-серый):
  - Главная (`/`)
  - Публикации (`/publications`)
- Кнопка "Контакты" (синяя, `bg-primary`, с иконкой chevron)

**Hover effect:** ✅
- Ссылки: цвет меняется с `#F2F7FA` → светлее (opacity 0.8)
- Transition: `transition-colors duration-200`
- Кнопка "Контакты": стрелка сдвигается вправо на 5px

---

## 📂 Финальная структура компонентов

```
src/
├── components/
│   ├── general/
│   │   ├── HeroSection.tsx ✅
│   │   ├── ServicesCarousel.tsx ✅
│   │   ├── ServiceCard.tsx ✅
│   │   ├── InteractiveCellsSection.tsx ✅
│   │   ├── CTABanner.tsx ✅
│   │   └── ContactFormSection.tsx ✅
│   ├── section/
│   │   └── Footer.tsx ✅
│   └── ui/
│       ├── Button.tsx (обновить для Figma стилей)
│       ├── Input.tsx (создать для формы)
│       ├── Header.tsx (обновить логотип)
│       └── HeaderClient.tsx (добавить hover на стрелку "Войти")
├── app/
│   └── page.tsx (собрать все секции)
└── public/
    ├── img/
    │   ├── hero-moscow-skyline-6cd318.png ✅
    │   ├── service-tax-7fe93d.png ✅
    │   ├── service-dispute-770963.png ✅
    │   ├── service-bankruptcy-2e9617.png ✅
    │   ├── service-private-638726.png ✅
    │   ├── service-dispute-2-4cd064.png ✅
    │   ├── service-intellectual-27f422.png ✅
    │   ├── carousel-image.png ✅
    │   ├── carousel-business-1-6d744d.png ✅
    │   ├── carousel-private-3-15424d.png ✅
    │   ├── contact-background-7d3ad3.png ✅
    │   ├── logo-vector.svg ✅
    │   ├── icon-chevron-right.svg ✅
    │   └── icon-arrow-bottom-right.svg ✅
    └── docs/
        └── confidence.pdf (создать placeholder)
```

---

## 🚀 План реализации

### Этап 1: Настройка цветов и переменных
1. Обновить `tailwind.config.cjs` — добавить цветовую палитру
2. Проверить существующие токены в `design-tokens.css`

### Этап 2: Обновить Header
1. Добавить логотип `logo-vector.svg`
2. Добавить hover effect на кнопку "Войти" (стрелка +5px)

### Этап 3: Создать секции (по порядку)
1. HeroSection
2. ServicesCarousel + ServiceCard
3. InteractiveCellsSection
4. CTABanner
5. ContactFormSection
6. Footer

### Этап 4: Собрать главную страницу
- Обновить `src/app/page.tsx`
- Импортировать все секции
- Проверить layout и отступы

### Этап 5: Тестирование
- `npm run build` — проверка типизации
- `npm run dev` — проверка в браузере
- Проверить все hover effects
- Проверить интерактивность (карусель, ячейки, форма)

---

## ✅ Готово к работе!

Все требования зафиксированы. Начинаю реализацию с Этапа 1.
