'use client'

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createSlugFromTitle } from "@/lib/services"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { logout } from "@/lib/actions/auth-actions"

interface HeaderClientProps {
  services: Array<{ id: number; title: string }>
}

// Add custom CSS for animations
const customStyles = `
  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

export default function HeaderClient({ services }: HeaderClientProps) {
  const [isServicesOpen, setIsServicesOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showAllServices, setShowAllServices] = useState(false)
  const [authKey, setAuthKey] = useState(0) // Ключ для принудительного обновления
  const { user } = useCurrentUser(authKey)
  const router = useRouter()
  
  const maxVisibleServices = 6
  const displayServices = showAllServices ? services : services.slice(0, maxVisibleServices)
  const hasMoreServices = services.length > maxVisibleServices

  const handleLogout = async () => {
    await logout()
    // Принудительно обновляем состояние аутентификации
    setAuthKey(prev => prev + 1)
    // Не делаем router.push, позволяем middleware перенаправить
  }

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = customStyles
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <header className="w-full" style={{ background: '#FFFFFF', borderBottom: '1px solid #E9ECEF' }}>
      <div className="container mx-auto max-w-screen-xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/img/logo.svg" alt="AlexSite Logo" width={40} height={40} priority />
          <span className="font-bold text-xl premium-accent" style={{ fontFamily: 'Montserrat, Inter, Segoe UI, Arial, sans-serif' }}>ПФК</span>
        </div>
        <nav className="hidden md:flex gap-8 items-center">
          <Link href="/" className="premium-link font-medium">
            Главная
          </Link>
          <div 
            className="relative"
            onMouseEnter={() => setIsServicesOpen(true)}
            onMouseLeave={() => setIsServicesOpen(false)}
          >
            <button className="premium-link font-medium flex items-center gap-1">
              Услуги
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isServicesOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div 
              className={`absolute top-full left-0 mt-2 w-80 rounded-lg shadow-xl premium-card z-50 transition-all duration-300 transform ${
                isServicesOpen 
                  ? 'opacity-100 translate-y-0 visible' 
                  : 'opacity-0 -translate-y-2 invisible'
              }`}
              onMouseEnter={() => setIsServicesOpen(true)}
              onMouseLeave={() => setIsServicesOpen(false)}
            >
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold premium-accent uppercase tracking-wider border-b premium-border mb-2">
                  Выберите услугу
                </div>
                {displayServices.map((service, index) => (
                  <Link
                    key={service.id}
                    href={`/${createSlugFromTitle(service.title)}`}
                    className="group block px-4 py-3 premium-link font-medium transition-all duration-200 transform hover:translate-x-0.5 border-l-2 border-transparent hover:premium-border"
                    style={{
                      animation: isServicesOpen ? `fadeInUp 0.3s ease-out ${index * 50}ms both` : 'none'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm leading-5">{service.title}</span>
                      <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
                {hasMoreServices && !showAllServices && (
                  <button
                    onClick={() => setShowAllServices(true)}
                    className="w-full px-4 py-3 text-center premium-link font-medium transition-colors duration-200 border-t premium-border mt-1"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm">Показать еще ({services.length - maxVisibleServices})</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                )}
                {showAllServices && hasMoreServices && (
                  <button
                    onClick={() => setShowAllServices(false)}
                    className="w-full px-4 py-3 text-center font-medium transition-colors duration-200 border-t premium-border mt-1" style={{ color: '#6C757D' }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm">Свернуть</span>
                      <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <Link href="/publications" className="premium-link font-medium">
            Публикации
          </Link>
          <Link href="/contacts" className="premium-link font-medium">
            Контакты
          </Link>
          
          {/* Auth Button */}
          <div className="ml-4">
            {!user ? (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Войти
              </Link>
            ) : (
              <button
                onClick={() => {
                  if (user.userRole === 'ADMIN') router.push('/admin')
                  else if (user.userRole === 'EDITOR') router.push('/editor')
                  else router.push('/client')
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
                title="Личный кабинет"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Личный кабинет
              </button>
            )}
          </div>
        </nav>
        
        <button 
          className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-accent-gold"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Image src="/img/menu.svg" alt="Открыть меню" width={24} height={24} />
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden premium-card border-t premium-border shadow-lg">
          <div className="container mx-auto max-w-screen-xl px-4 py-4">
            <nav className="flex flex-col gap-4">
              <Link 
                href="/" 
                className="premium-link font-medium py-2 px-2 rounded transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Главная
              </Link>
              
              <div>
                <button 
                  className="premium-link font-medium py-2 px-2 flex items-center justify-between w-full rounded transition-colors"
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                >
                  Услуги
                  <svg className={`w-4 h-4 transform transition-transform duration-200 ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isServicesOpen && (
                  <div className="ml-4 mt-2">
                    <div className="rounded-lg p-3 premium-card">
                      <div className="space-y-1">
                        {displayServices.map((service, index) => (
                          <Link
                            key={service.id}
                            href={`/${createSlugFromTitle(service.title)}`}
                            className="block premium-link py-2 px-3 text-sm rounded transition-all duration-200"
                            onClick={() => {
                              setIsMobileMenuOpen(false)
                              setIsServicesOpen(false)
                            }}
                            style={{
                              animation: isServicesOpen ? `fadeInUp 0.3s ease-out ${index * 30}ms both` : 'none'
                            }}
                          >
                            {service.title}
                          </Link>
                        ))}
                        {hasMoreServices && !showAllServices && (
                          <button
                            onClick={() => setShowAllServices(true)}
                            className="w-full text-left premium-link py-2 px-3 text-sm rounded transition-colors duration-200 border-t premium-border mt-2 pt-3"
                          >
                            <div className="flex items-center gap-2">
                              <span>Показать еще ({services.length - maxVisibleServices})</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>
                        )}
                        {showAllServices && hasMoreServices && (
                          <button
                            onClick={() => setShowAllServices(false)}
                            className="w-full text-left py-2 px-3 text-sm rounded transition-colors duration-200 border-t premium-border mt-2 pt-3" style={{ color: '#6C757D' }}
                          >
                            <div className="flex items-center gap-2">
                              <span>Свернуть</span>
                              <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Link 
                href="/publications" 
                className="premium-link font-medium py-2 px-2 rounded transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Публикации
              </Link>
              <Link 
                href="/contacts" 
                className="premium-link font-medium py-2 px-2 rounded transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Контакты
              </Link>
              
              {/* Mobile Auth Button */}
              <div className="border-t premium-border mt-4 pt-4">
                {user ? (
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-2 w-full text-left py-2 px-2 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Выйти
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-2 py-2 px-2 text-gray-700 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Войти
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}