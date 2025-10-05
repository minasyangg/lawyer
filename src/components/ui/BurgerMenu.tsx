'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createSlugFromTitle } from '@/lib/services'

interface BurgerMenuProps {
  services?: Array<{ id: number; title: string }>
}

export default function BurgerMenu({ services }: BurgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isServicesOpen, setIsServicesOpen] = useState(false)

  // Блокировка скролла при открытом меню
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Burger Icon - видимо только на mobile/tablet */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden w-8 h-8 flex flex-col justify-center items-center gap-1.5"
        aria-label="Открыть меню"
      >
        <span className="w-4 h-0.5 bg-black"></span>
        <span className="w-4 h-0.5 bg-black"></span>
      </button>

      {/* Full Screen Menu Overlay - slide-in from right */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header внутри меню - белый фон */}
        <div className="flex justify-between items-center p-5 bg-white">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <Image
              src="/img/logo-vector.svg"
              alt="ПФК Логотип"
              width={44}
              height={22}
              priority
            />
            <span className="text-[20px] font-black text-black">ПФК</span>
          </Link>

          {/* Close Button (X) - синий цвет */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-[#0426A1] text-3xl leading-none font-light"
            aria-label="Закрыть меню"
          >
            ×
          </button>
        </div>

        {/* Menu Content - с градиентом */}
        <div 
          className="flex flex-col justify-between h-[calc(100%-72px)]"
          style={{
            background: 'linear-gradient(180deg, rgba(4, 38, 161, 1) 0%, rgba(11, 28, 72, 1) 100%)'
          }}
        >
          {/* Top Section: Menu Title + Login Button + Nav Links */}
          <div className="flex flex-col gap-5 pt-[30px]">
            {/* Menu Title + Login Button */}
            <div className="flex justify-center items-center gap-2.5 px-5">
              <h2 className="flex-1 text-[32px] font-bold text-white leading-[1.2]">Меню</h2>
              <Link
                href="/login"
                className="flex items-center gap-1 px-3 py-1 bg-white rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-[14px] font-semibold text-black leading-[1.71]">Войти</span>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M9.75 7.5L14.25 12L9.75 16.5" stroke="black" strokeWidth="2" />
                </svg>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col px-5">
              <Link
                href="/"
                className="flex justify-between items-center px-0 py-4 text-[16px] font-bold text-white leading-[1.5] hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span>Главная</span>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M9.75 7.5L14.25 12L9.75 16.5" stroke="white" strokeWidth="1" />
                </svg>
              </Link>
              
              {/* Услуги - Аккордион */}
              <div className="flex flex-col">
                <button
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                  className="flex justify-between items-center px-0 py-4 text-[16px] font-bold text-white leading-[1.5] hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span>Услуги</span>
                  <svg 
                    className={`w-6 h-6 transition-transform duration-300 ${isServicesOpen ? 'rotate-90' : ''}`} 
                    viewBox="0 0 24 24" 
                    fill="none"
                  >
                    <path d="M9.75 7.5L14.25 12L9.75 16.5" stroke="white" strokeWidth="1" />
                  </svg>
                </button>
                
                {/* Список услуг */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ${
                    isServicesOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="flex flex-col pl-4 overflow-y-auto max-h-[350px]">
                    {services && services.length > 0 ? (
                      services.map((service) => (
                        <Link
                          key={service.id}
                          href={`/${createSlugFromTitle(service.title)}`}
                          className="py-3 text-[14px] font-normal text-white/90 hover:text-white leading-[1.5] transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          {service.title}
                        </Link>
                      ))
                    ) : (
                      <div className="py-3 text-[14px] font-normal text-white/70">
                        Услуги не найдены
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <Link
                href="/contacts"
                className="flex justify-between items-center px-0 py-4 text-[16px] font-bold text-white leading-[1.5] hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span>Контакты</span>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M9.75 7.5L14.25 12L9.75 16.5" stroke="white" strokeWidth="1" />
                </svg>
              </Link>
              <Link
                href="/publications"
                className="flex justify-between items-center px-0 py-4 text-[16px] font-bold text-white leading-[1.5] hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span>Публикации</span>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M9.75 7.5L14.25 12L9.75 16.5" stroke="white" strokeWidth="1" />
                </svg>
              </Link>
            </nav>
          </div>

          {/* Bottom Section: Footer Info */}
          <div className="flex flex-col gap-3 px-5 pb-[44px]">
            <h3 className="text-[20px] font-bold text-white leading-[1.5]">ПФК</h3>
            <div className="flex flex-col gap-3">
              <p className="text-[14px] font-normal text-white leading-[1.43]">
                Профессиональная юридическая помощь для бизнеса и частных лиц
              </p>
              <p className="text-[12px] font-normal text-white leading-[1.33]">
                © 2025 ПФК. Все права защищены.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
