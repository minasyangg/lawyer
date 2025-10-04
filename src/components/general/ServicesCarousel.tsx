'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ServiceCard from './ServiceCard'

const services = [
  {
    id: 1,
    title: 'Услуги налоговой практики',
    imageSrc: '/img/service-tax-7fe93d.png',
    imageHeight: 145,
  },
  {
    id: 2,
    title: 'Разрешение споров и взыскание',
    imageSrc: '/img/service-dispute-770963.png',
    imageHeight: 146,
  },
  {
    id: 3,
    title: 'Услуги практики банкротства',
    imageSrc: '/img/service-bankruptcy-2e9617.png',
    imageHeight: 131,
  },
  {
    id: 4,
    title: 'Частным клиентам',
    imageSrc: '/img/service-private-638726.png',
    imageHeight: 127,
  },
  {
    id: 5,
    title: 'Разрешение споров и взыскание',
    imageSrc: '/img/service-dispute-2-4cd064.png',
    imageHeight: 143,
  },
  {
    id: 6,
    title: 'Услуги практики по интеллектуальным правам',
    imageSrc: '/img/service-intellectual-27f422.png',
    imageHeight: 222,
  },
]

export default function ServicesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="relative w-full">
      {/* Часть 1: Синий блок с градиентом + карусель */}
      <section className="w-full bg-gradient-primary" style={{ padding: '80px 60px 80px 200px', height: '422px' }}>
        <div className="container mx-auto max-w-screen-xl">
          <div className="flex flex-col gap-10">
            {/* Заголовок + Текст + Кнопка */}
            <div className="flex items-center justify-center gap-[60px]">
              {/* Заголовок слева */}
              <h2 className="text-[48px] font-bold text-white leading-[1.2] whitespace-nowrap">
                Услуги ПФК
              </h2>

              {/* Текст и кнопка справа */}
              <div className="flex flex-col gap-10">
                {/* Текст */}
                <p className="text-[20px] text-white leading-[1.2] w-[715px] h-[61px]">
                  Консультации, сопровождение сделок, представительство в суде и комплексная поддержка.
                </p>

                {/* CTA Кнопка */}
                <Link 
                  href="/contacts" 
                  className="group inline-flex items-center justify-center gap-4 text-[16px] font-bold text-black bg-white rounded-lg w-fit"
                  style={{ padding: '16px 16px 16px 24px' }}
                >
                  <span>Связаться с нами</span>
                  <Image 
                    src="/img/icon-chevron-right.svg" 
                    alt="" 
                    width={6} 
                    height={10}
                    className="transition-transform duration-200 group-hover:translate-x-[5px]"
                  />
                </Link>
              </div>
            </div>

            {/* Карусель */}
            <div className="relative z-20">
              {/* Контейнер карусели - показываем 3.5 карточки */}
              <div
                ref={scrollRef}
                className="flex gap-5 overflow-x-auto scroll-smooth"
                style={{ 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none',
                  maxWidth: '1204px' // 344*3 + 172 + 60 = 1204px (3 полных + 0.5 + 3 gap)
                }}
              >
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    title={service.title}
                    imageSrc={service.imageSrc}
                    imageHeight={service.imageHeight}
                  />
                ))}
              </div>

              {/* Навигация - в нижнем правом углу, 30px от карточек */}
              <div className="absolute right-20    bottom-[-100px] flex gap-0 z-30">
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
          </div>
        </div>
      </section>

      {/* Часть 2: Фото (600px высота) */}
      <div className="relative w-full h-[600px]">
        <Image
          src="/img/services-section-photo-6058bc.png"
          alt="Офис"
          fill
          className="object-cover"
        />
      </div>

      {/* Часть 3: Белый фон (120px высота) */}
      <div className="relative w-full h-[120px] bg-white">
        {/* Блок "Кому подойдут наши услуги?" - примыкает к правому нижнему углу части 3 */}
        <div 
          className="absolute rounded-tl-2xl rounded-bl-2xl" 
          style={{ 
            width: '65%',
            height: '220px',
            right: '0',
            bottom: '0',
            padding: '80px 60px',
            background: 'linear-gradient(90deg, rgba(4, 38, 161, 1) 0%, rgba(0, 39, 179, 1) 100%)'
          }}
        >
          <h2 className="text-[48px] font-bold text-white leading-[1.2]">
            Кому подойдут наши услуги?
          </h2>
        </div>
      </div>

      <style jsx>{`
        .scroll-smooth::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
