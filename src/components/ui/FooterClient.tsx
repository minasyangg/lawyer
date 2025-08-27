import React from "react"
import Link from "next/link"
import { createSlugFromTitle } from "@/lib/services"

interface FooterClientProps {
  services: Array<{ id: number; title: string }>
}

export default function FooterClient({ services }: FooterClientProps) {
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-12 mt-16">
      <div className="container mx-auto max-w-screen-xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-bold text-2xl text-black">ПФК</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Профессиональная юридическая помощь для бизнеса и частных лиц
            </p>
            <div className="text-gray-500 text-sm">
              © 2025 ПФК. Все права защищены.
            </div>
          </div>

          {/* Services */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-black mb-4">Наши услуги</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/${createSlugFromTitle(service.title)}`}
                  className="text-gray-600 hover:text-blue-600 text-sm py-1 transition-colors"
                >
                  {service.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links & Contact */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-black mb-4">Навигация</h3>
            <nav className="flex flex-col gap-2 mb-6">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
              >
                Главная
              </Link>
              <Link 
                href="/publications" 
                className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
              >
                Публикации
              </Link>
              <Link 
                href="/contacts" 
                className="bg-black text-white text-sm font-medium py-3 px-6 rounded-lg shadow transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 inline-block text-center"
                style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)" }}
              >
                Контакты
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}