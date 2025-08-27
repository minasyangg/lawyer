'use client'

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { createSlugFromTitle } from "@/lib/services"

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
  
  const maxVisibleServices = 6
  const displayServices = showAllServices ? services : services.slice(0, maxVisibleServices)
  const hasMoreServices = services.length > maxVisibleServices

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = customStyles
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="container mx-auto max-w-screen-xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/img/logo.svg" alt="AlexSite Logo" width={40} height={40} priority />
          <span className="font-bold text-xl text-gray-900">ПФК</span>
        </div>
        
        <nav className="hidden md:flex gap-8 items-center">
          <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
            Главная
          </Link>
          
          <div 
            className="relative"
            onMouseEnter={() => setIsServicesOpen(true)}
            onMouseLeave={() => setIsServicesOpen(false)}
          >
            <button className="text-gray-700 hover:text-blue-600 font-medium flex items-center gap-1">
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
              className={`absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 transition-all duration-300 transform ${
                isServicesOpen 
                  ? 'opacity-100 translate-y-0 visible' 
                  : 'opacity-0 -translate-y-2 invisible'
              }`}
              onMouseEnter={() => setIsServicesOpen(true)}
              onMouseLeave={() => setIsServicesOpen(false)}
            >
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2">
                  Выберите услугу
                </div>
                {displayServices.map((service, index) => (
                  <Link
                    key={service.id}
                    href={`/${createSlugFromTitle(service.title)}`}
                    className="group block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 font-medium transition-all duration-200 transform hover:translate-x-0.5 border-l-2 border-transparent hover:border-blue-500"
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
                    className="w-full px-4 py-3 text-center text-blue-600 hover:bg-blue-50 font-medium transition-colors duration-200 border-t border-gray-100 mt-1"
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
                    className="w-full px-4 py-3 text-center text-gray-600 hover:bg-gray-50 font-medium transition-colors duration-200 border-t border-gray-100 mt-1"
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
          
          <Link href="/publications" className="text-gray-700 hover:text-blue-600 font-medium">
            Публикации
          </Link>
          <Link href="/contacts" className="text-gray-700 hover:text-blue-600 font-medium">
            Контакты
          </Link>
        </nav>
        
        <button 
          className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Image src="/img/menu.svg" alt="Открыть меню" width={24} height={24} />
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="container mx-auto max-w-screen-xl px-4 py-4">
            <nav className="flex flex-col gap-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2 px-2 rounded transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Главная
              </Link>
              
              <div>
                <button 
                  className="text-gray-700 hover:text-blue-600 font-medium py-2 px-2 flex items-center justify-between w-full rounded transition-colors"
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                >
                  Услуги
                  <svg className={`w-4 h-4 transform transition-transform duration-200 ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isServicesOpen && (
                  <div className="ml-4 mt-2">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="space-y-1">
                        {displayServices.map((service, index) => (
                          <Link
                            key={service.id}
                            href={`/${createSlugFromTitle(service.title)}`}
                            className="block text-gray-600 hover:text-blue-600 hover:bg-blue-50 py-2 px-3 text-sm rounded transition-all duration-200"
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
                            className="w-full text-left text-blue-600 hover:bg-blue-50 py-2 px-3 text-sm rounded transition-colors duration-200 border-t border-gray-200 mt-2 pt-3"
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
                            className="w-full text-left text-gray-600 hover:bg-gray-100 py-2 px-3 text-sm rounded transition-colors duration-200 border-t border-gray-200 mt-2 pt-3"
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
                className="text-gray-700 hover:text-blue-600 font-medium py-2 px-2 rounded transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Публикации
              </Link>
              <Link 
                href="/contacts" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2 px-2 rounded transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Контакты
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}