"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SheetContent, SheetOverlay } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { createSlugFromTitle } from '@/lib/services'
import Link from "next/link"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { cn } from "@/lib/utils"

// Премиальный бургер-иконка с анимацией превращения в крестик
function BurgerIcon({ open }: { open: boolean }) {
  return (
    <div className="w-8 h-8 flex flex-col justify-center items-center cursor-pointer">
      <span className={cn(
        "block h-0.5 w-7 bg-gray-900 rounded transition-all duration-300",
        open ? "rotate-45 translate-y-2" : ""
      )} />
      <span className={cn(
        "block h-0.5 w-7 bg-gray-900 rounded my-1 transition-all duration-300",
        open ? "opacity-0" : ""
      )} />
      <span className={cn(
        "block h-0.5 w-7 bg-gray-900 rounded transition-all duration-300",
        open ? "-rotate-45 -translate-y-2" : ""
      )} />
    </div>
  )
}

export default function BurgerMenu({ services }: { services: Array<{ id: number; title: string }> }) {
  const [open, setOpen] = useState(false)
  const { user } = useCurrentUser()
  const router = useRouter()
  const sheetRef = useRef<HTMLDivElement>(null)

  // Закрытие по ESC
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  // Закрытие по клику на фон
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setOpen(false)
  }

  // Плавная анимация открытия меню (slide-in справа)
  // Используется Tailwind + shadcn/ui Sheet
  return (
    <>
      <button aria-label={open ? "Закрыть меню" : "Открыть меню"} className="lg:hidden" onClick={() => setOpen(o => !o)}>
        <BurgerIcon open={open} />
      </button>

      {open && (
        <>
          <SheetOverlay
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleOverlayClick}
          />
          <SheetContent
            ref={sheetRef}
            className="z-50 w-[320px] max-w-full h-full bg-white shadow-xl p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300 border-l border-gray-200"
          >
          
          

        {/* Кнопка-крестик */}
        <button
          className="self-end mb-2 p-2 rounded hover:bg-gray-100 transition-colors"
          onClick={() => setOpen(false)}
          aria-label="Закрыть меню"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <nav className="flex flex-col gap-4">
          <Link href="/" className="premium-link font-medium py-2 px-2 rounded transition-colors" onClick={() => setOpen(false)}>
            Главная 
          </Link>
          {/* Аккордеон для услуг */}
          <Accordion className="w-full"> 
            <AccordionItem>
              <AccordionTrigger className="premium-link font-medium py-2 px-2 flex items-center justify-between w-full rounded transition-colors">
                Услуги
              </AccordionTrigger>
              <AccordionContent className="pl-2">
                <ul className="flex flex-col gap-1">
                  {services.map((service) => (
                    <li key={service.id}>
                      <Link
                        href={`/${createSlugFromTitle(service.title)}`}
                        className="block py-2 px-3 text-sm rounded hover:bg-gray-100 transition-all"
                        onClick={() => setOpen(false)}
                      >
                        {service.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Link href="/publications" className="premium-link font-medium py-2 px-2 rounded transition-colors" onClick={() => setOpen(false)}>
            Публикации
          </Link>
          <Link href="/contacts" className="premium-link font-medium py-2 px-2 rounded transition-colors" onClick={() => setOpen(false)}>
            Контакты
          </Link>
          {/* Кнопка "Личный кабинет" или "Войти" */}
          <div className="border-t premium-border mt-4 pt-4">
            {!user ? (
              <Link
                href="/login"
                className="flex items-center gap-2 py-2 px-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Войти
              </Link>
            ) : (
              <button
                onClick={() => {
                  setOpen(false)
                  if (user.userRole === 'ADMIN') router.push('/admin')
                  else if (user.userRole === 'EDITOR') router.push('/editor')
                  else router.push('/client')
                }}
                className="flex items-center gap-2 w-full text-left py-2 px-2 text-gray-700 hover:text-green-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Личный кабинет
              </button>
            )}
          </div>
        </nav>
      </SheetContent>
          </>
        )}
    </>
  )
}
