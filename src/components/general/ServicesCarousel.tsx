'use client'

import React, { useRef, useLayoutEffect, useState } from 'react'
import ContactRedirectButton from '@/components/ui/ContactRedirectButton'
import Image from 'next/image'
import ServiceCard from './ServiceCard'

type ServiceDto = {
  id: number
  title: string
  description: string
  cardImage?: string | null
  heroImage?: string | null
  cardExcerpt?: string | null
}

interface Props {
  services: ServiceDto[]
}

export default function ServicesCarousel({ services }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const firstImageRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)
  // Оборачивает карусель карточек + точки-индикаторы — по нему меряем высоту
  // синей секции на mobile/tablet, чтобы индикаторы не обрезались фоном
  const carouselBlockRef = useRef<HTMLDivElement | null>(null)
  const [blueHeight, setBlueHeight] = useState<number | null>(null)
  const navRef = useRef<HTMLDivElement | null>(null)
  // Индекс активной карточки в области видимости — используется для точек-индикаторов
  // скролла на mobile/tablet, чтобы визуально показать, что карточек несколько
  const [activeIndex, setActiveIndex] = useState(0)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 364 // ширина карточки (344px) + gap (20px)
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount)
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }
  }

  // Measure the bottom of the first card image relative to the blue section
  useLayoutEffect(() => {
    function recalc() {
      if (!sectionRef.current || !firstImageRef.current) return
      const sectionRect = sectionRef.current.getBoundingClientRect()
      const imageRect = firstImageRef.current.getBoundingClientRect()

      // For mobile/tablet ensure the blue section covers the full carousel
      // (including the scroll-indicator dots below the cards) so nothing is clipped
      const viewportWidth = window.innerWidth
      if (viewportWidth < 1024 && carouselBlockRef.current) {
        const blockRect = carouselBlockRef.current.getBoundingClientRect()
        const blockBottomRelative = blockRect.bottom - sectionRect.top
        // add small padding to avoid tight clipping
        setBlueHeight(Math.max(0, Math.round(blockBottomRelative + 16)))
        return
      }

      const imageBottomRelative = imageRect.bottom - sectionRect.top
      // set a minimum to avoid collapsing too small
      setBlueHeight(Math.max(0, Math.round(imageBottomRelative)))
    }

    recalc()
    window.addEventListener('resize', recalc)

    // align nav buttons with the visible right edge of the scroll container
    function alignNav() {
      const nav = navRef.current
      if (!nav) return

      const marginRight = 0 // px — убираем отступ, выравниваем по правому краю секции

      if (sectionRef.current) {
        const sRect = sectionRef.current.getBoundingClientRect()
        const rightOffset = Math.max(0, Math.round(window.innerWidth - sRect.right + marginRight))
        nav.style.right = `${rightOffset}px`
        return
      }

      // Fallback: если секция не найдена, выравниваем по scroll container
      const sc = scrollRef.current
      if (!sc) return
      const rect = sc.getBoundingClientRect()
      const rightOffset = Math.max(0, Math.round(window.innerWidth - (rect.left + rect.width) + marginRight))
      nav.style.right = `${rightOffset}px`
    }

    alignNav()
    window.addEventListener('resize', alignNav)

    // Отслеживаем, какая карточка ближе всего к левому краю видимой области,
    // чтобы подсвечивать соответствующую точку-индикатор на mobile/tablet
    function updateActiveIndex() {
      const sc = scrollRef.current
      if (!sc) return
      const cardWidth = sc.firstElementChild instanceof HTMLElement
        ? sc.firstElementChild.getBoundingClientRect().width + 20 // + gap-5
        : 1
      const index = Math.round(sc.scrollLeft / cardWidth)
      setActiveIndex(Math.max(0, Math.min(services.length - 1, index)))
    }

    const scEl = scrollRef.current
    if (scEl) {
      scEl.addEventListener('scroll', alignNav)
      scEl.addEventListener('scroll', updateActiveIndex)
    }

    return () => {
      window.removeEventListener('resize', recalc)
      window.removeEventListener('resize', alignNav)
      if (scEl) {
        scEl.removeEventListener('scroll', alignNav)
        scEl.removeEventListener('scroll', updateActiveIndex)
      }
    }
  }, [services.length])

  return (
    <div className="relative w-full">
      {/* Часть 1: Синий блок с градиентом + карусель - адаптивная высота */}
      <section 
        ref={sectionRef}
        className="w-full bg-primary px-[25px] pt-0 md:pt-[50px] lg:pt-[80px] pb-[40px] md:pb-[50px] lg:pb-[80px] md:px-[40px] lg:px-[60px] xl:pl-[200px]"
        style={{ 
          height: blueHeight ? `${blueHeight}px` : undefined,
          minHeight: '240px',
          transition: 'height 200ms ease'
        }}
      >
        <div className="container mx-auto max-w-screen-xl">
          <div className="flex flex-col gap-6 md:gap-8 lg:gap-10">
            {/* Заголовок + Текст + Кнопка - адаптивная раскладка */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-6 md:gap-8 lg:gap-[60px]">
              {/* Заголовок */}
              <h2 className="text-[32px] md:text-[40px] lg:text-[48px] font-bold text-white leading-[1.2]">
                Услуги ПФК
              </h2>

              {/* Текст и кнопка */}
              <div className="flex flex-col gap-5 md:gap-7 lg:gap-10">
                {/* Текст - адаптивная ширина */}
                <p className="text-[14px] md:text-[17px] lg:text-[20px] text-white leading-[1.2] max-w-full lg:max-w-[715px]">
                  Консультации, сопровождение сделок, представительство в суде и комплексная поддержка.
                </p>

                {/* CTA Кнопка - адаптивные отступы */}
                <ContactRedirectButton
                  className="group inline-flex items-center justify-center gap-3 md:gap-3.5 lg:gap-4 text-[14px] md:text-[15px] lg:text-[16px] font-bold text-black bg-white rounded-lg w-fit px-5 py-3 md:px-6 md:py-3.5 lg:px-6 lg:py-4 lg:pl-6"
                  loadingLabel="Переход..."
                >
                  <span>Связаться с нами</span>
                  <Image
                    src="/img/icon-chevron-right.svg"
                    alt=""
                    width={6}
                    height={10}
                    className="transition-transform duration-200 group-hover:translate-x-[5px]"
                  />
                </ContactRedirectButton>
              </div>
            </div>

            {/* Карусель + точки-индикаторы — обёрнуты вместе, чтобы высота синей секции
                на mobile/tablet (см. recalc()) включала и то, и другое */}
            <div ref={carouselBlockRef}>
              <div className="relative z-20">
                {/* Контейнер карусели - адаптивное количество карточек */}
                <div
                  ref={scrollRef}
                  className="flex gap-5 overflow-x-auto overflow-y-hidden scroll-smooth"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    maxWidth: '100%'
                  }}
                >
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex-shrink-0"
                      style={{
                        // Mobile: показываем 1 карточку + 20% следующей
                        // Tablet: показываем 2 карточки
                        // Desktop: показываем 3.5 карточки (фиксированная ширина 344px)
                        width: 'calc(80vw - 30px)',
                        maxWidth: '344px'
                      }}
                    >
                      <ServiceCard
                        title={service.title}
                        description={service.cardExcerpt || service.description}
                        imageSrc={service.cardImage || service.heroImage || '/img/services-section-photo-6058bc.png'}
                        imageContainerRef={service.id === services[0].id ? firstImageRef : undefined}
                      />
                    </div>
                  ))}
                </div>

                {/* Затухание по правому краю — визуально подсказывает, что карточки продолжаются за пределами видимой области.
                    Показываем на всех viewport: на mobile/tablet уже сама обрезанная карточка + fade дают понять, что это скролл. */}
                <div
                  className="pointer-events-none absolute top-0 right-0 bottom-0 w-10 md:w-12 lg:w-16 z-30"
                  style={{ background: 'linear-gradient(to right, transparent, var(--color-primary))' }}
                  aria-hidden="true"
                />

                {/* Навигация - скрываем на mobile/tablet, показываем только на desktop */}
                <div ref={navRef} className="hidden lg:flex absolute bottom-[-100px] gap-0 z-30">
                  {/* Стрелка влево */}
                  <button
                    onClick={() => scroll('left')}
                    className="w-12 h-12 bg-white shadow-lg cursor-pointer flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
                    aria-label="Предыдущая услуга"
                  >
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Стрелка вправо */}
                  <button
                    onClick={() => scroll('right')}
                    className="w-12 h-12 bg-white shadow-lg flex cursor-pointer items-center justify-center hover:bg-gray-100 transition-colors duration-200"
                    aria-label="Следующая услуга"
                  >
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Точки-индикаторы скролла — видны только на mobile/tablet, где нет стрелок навигации.
                  Дают понять, что карточек несколько и текущая позиция в списке. */}
              <div className="flex lg:hidden justify-center gap-2 mt-4" aria-hidden="true">
                {services.map((service, index) => (
                  <span
                    key={service.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Часть 2: Фото - делаем абсолютным и позиционируем по вычисленному blueHeight. */}
      {/* Spacer нужен, чтобы сохранить высоту потока документа. */}
  <div className="hidden lg:block w-full h-[600px]" aria-hidden="true" />

      <div
        className="hidden md:block pointer-events-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: blueHeight ? `${blueHeight}px` : undefined,
          height: 'auto',
          zIndex: 10,
        }}
      >
        <div className="relative w-full h-[200px] md:h-[300px] lg:h-[600px]">
          <Image
            src="/img/services-section-photo-6058bc.png"
            alt="Офис"
            fill
            className="object-cover"
          />
        </div>
      </div>

  {/* Часть 3: Белый фон - адаптивная высота */}
  <div className="relative w-full h-auto lg:h-[120px] bg-white">
        {/* Блок "Кому подойдут наши услуги?" - 70% ширины экрана */}
        <div
          className="relative lg:absolute left-0 right-0 lg:left-auto lg:right-0 rounded-none lg:rounded-tl-2xl lg:rounded-bl-2xl px-[20px] py-[27px] md:px-[30px] md:py-[35px] lg:px-[60px] w-screen md:w-screen lg:w-[70vw] z-50 translate-y-0 lg:translate-y-[-40%] lg:h-[160px] lg:flex lg:items-center bg-gradient-to-r from-[#0426A1] to-[#0027B3]"
        >
          <h2 className="text-[24px] md:text-[36px] lg:text-[48px] font-bold text-white leading-[1.2]">
            Кому подойдут наши услуги?
          </h2>
        </div>
      </div>

      <style jsx>{`
        .scroll-smooth::-webkit-scrollbar {
          display: none;
        }
        
        @media (min-width: 768px) and (max-width: 1023px) {
          .flex-shrink-0 {
            width: calc(47vw - 30px) !important;
          }
        }
      `}</style>
    </div>
  )
}
