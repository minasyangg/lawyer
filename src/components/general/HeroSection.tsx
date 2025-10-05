import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative w-full h-[650px] md:h-[720px] lg:h-[820px] flex items-center justify-center overflow-hidden">
      {/* Фоновое изображение */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/img/hero-moscow-skyline-6cd318.png"
          alt="Москва"
          fill
          className="object-cover"
          priority
        />
        {/* Градиент overlay */}
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Контент */}
      <div className="relative z-10 container mx-auto max-w-screen-xl px-[25px] md:px-[40px] lg:px-[60px] text-white">
        <div className="max-w-[700px]">
          {/* Заголовок H1 - адаптивный размер */}
          <h1 className="text-[32px] md:text-[48px] lg:text-[64px] font-bold leading-tight mb-4 md:mb-5 lg:mb-6">
            Юридические услуги для бизнеса и частных лиц
          </h1>

          {/* Подзаголовок - адаптивный размер */}
          <p className="text-[12px] md:text-[16px] lg:text-[20px] leading-relaxed mb-6 md:mb-7 lg:mb-8 opacity-90">
            Консультации, сопровождение сделок, защита интересов в суде — полный спектр юридических услуг для вашего бизнеса
          </p>

          {/* Список преимуществ */}
          <ul className="space-y-3 md:space-y-3.5 lg:space-y-4 mb-8 md:mb-9 lg:mb-10">
            <li className="flex items-start gap-2 md:gap-2.5 lg:gap-3">
              <svg className="w-5 h-5 md:w-5.5 md:h-5.5 lg:w-6 lg:h-6 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-[14px] md:text-[17px] lg:text-[20px] font-bold">Быстрое реагирование на запросы</span>
            </li>
            <li className="flex items-start gap-2 md:gap-2.5 lg:gap-3">
              <svg className="w-5 h-5 md:w-5.5 md:h-5.5 lg:w-6 lg:h-6 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-[14px] md:text-[17px] lg:text-[20px] font-bold">Опытные специалисты</span>
            </li>
            <li className="flex items-start gap-2 md:gap-2.5 lg:gap-3">
              <svg className="w-5 h-5 md:w-5.5 md:h-5.5 lg:w-6 lg:h-6 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-[14px] md:text-[17px] lg:text-[20px] font-bold">Индивидуальный подход</span>
            </li>
          </ul>

          {/* CTA Кнопка - адаптивный размер */}
          <Link 
            href="/contacts" 
            className="group inline-flex items-center gap-2 md:gap-2.5 lg:gap-3 px-5 py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-4 text-[14px] md:text-[15px] lg:text-[16px] font-bold text-white bg-primary rounded-lg shadow-button hover:bg-primary-dark transition-all duration-200"
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
    </section>
  )
}
