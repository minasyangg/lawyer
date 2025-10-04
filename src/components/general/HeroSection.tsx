import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative w-full h-[820px] flex items-center justify-center overflow-hidden">
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
      <div className="relative z-10 container mx-auto max-w-screen-xl px-[60px] text-white">
        <div className="max-w-[700px]">
          {/* Заголовок H1 */}
          <h1 className="text-[64px] font-bold leading-tight mb-6">
            Юридические услуги для бизнеса и частных лиц
          </h1>

          {/* Подзаголовок */}
          <p className="text-[20px] leading-relaxed mb-8 opacity-90">
            Консультации, сопровождение сделок, защита интересов в суде — полный спектр юридических услуг для вашего бизнеса
          </p>

          {/* Список преимуществ */}
          <ul className="space-y-4 mb-10">
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-[20px] font-bold">Быстрое реагирование на запросы</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-[20px] font-bold">Опытные специалисты</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-[20px] font-bold">Индивидуальный подход</span>
            </li>
          </ul>

          {/* CTA Кнопка */}
          <Link 
            href="/contacts" 
            className="group inline-flex items-center gap-3 px-8 py-4 text-[16px] font-bold text-white bg-primary rounded-lg shadow-button hover:bg-primary-dark transition-all duration-200"
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
