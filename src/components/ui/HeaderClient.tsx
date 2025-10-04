'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSlugFromTitle } from '@/lib/services'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import BurgerMenu from '@/components/ui/BurgerMenu'

interface HeaderClientProps {
  services: Array<{ id: number; title: string }>
}

const customStyles = `
  @keyframes fadeInUp {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
`

export default function HeaderClient({ services }: HeaderClientProps) {
  const [isServicesOpen, setIsServicesOpen] = useState(false)
  const [showAllServices, setShowAllServices] = useState(false)
  const { user } = useCurrentUser()
  const router = useRouter()

  const maxVisibleServices = 6
  const displayServices = showAllServices ? services : services.slice(0, maxVisibleServices)
  const hasMoreServices = services.length > maxVisibleServices

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = customStyles
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="container mx-auto max-w-screen-xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/img/logo.svg" alt="AlexSite Logo" width={40} height={40} priority />
          <span className="font-bold text-xl" style={{ fontFamily: 'Montserrat, Inter, Segoe UI, Arial, sans-serif' }}>ПФК</span>
        </div>

        <nav className="hidden lg:flex gap-8 items-center">
          <Link href="/" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Главная</Link>

          <div className="relative" onMouseEnter={() => setIsServicesOpen(true)} onMouseLeave={() => setIsServicesOpen(false)}>
            <button aria-haspopup="menu" aria-expanded={isServicesOpen} className="text-sm font-medium text-gray-700 hover:text-primary flex items-center gap-1">
              Услуги
              <svg className={`w-4 h-4 transition-transform duration-200 ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className={`absolute top-full left-0 mt-2 w-80 rounded-lg shadow-xl bg-white border border-gray-100 z-50 transition-all duration-300 transform ${isServicesOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'}`}>
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-gray-100 mb-2">Выберите услугу</div>
                {displayServices.map((service, index) => (
                  <Link key={service.id} href={`/${createSlugFromTitle(service.title)}`} className="group block px-4 py-3 text-sm text-gray-700 font-medium transition-all duration-200 transform hover:translate-x-0.5 border-l-2 border-transparent hover:border-primary" style={{ animation: isServicesOpen ? `fadeInUp 0.3s ease-out ${index * 50}ms both` : 'none' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm leading-5">{service.title}</span>
                      <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}

                {hasMoreServices && !showAllServices && (
                  <button onClick={() => setShowAllServices(true)} className="w-full px-4 py-3 text-center text-sm font-medium text-gray-700 hover:text-primary transition-colors duration-200 border-t border-gray-100 mt-1">Показать еще ({services.length - maxVisibleServices})</button>
                )}

                {showAllServices && hasMoreServices && (
                  <button onClick={() => setShowAllServices(false)} className="w-full px-4 py-3 text-center text-sm font-medium transition-colors duration-200 border-t border-gray-100 mt-1 text-gray-500">Свернуть</button>
                )}
              </div>
            </div>
          </div>

          <Link href="/publications" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Публикации</Link>
          <Link href="/contacts" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">Контакты</Link>

          <div className="ml-4">
            {!user ? (
              <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-md shadow-sm hover:bg-[#03206f] transition-colors">Войти</Link>
            ) : (
              <button onClick={() => { if (user.userRole === 'ADMIN') router.push('/admin'); else if (user.userRole === 'EDITOR') router.push('/editor'); else router.push('/client'); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors">Личный кабинет</button>
            )}
          </div>
        </nav>

        <BurgerMenu services={services} />
      </div>
    </header>
  )
}