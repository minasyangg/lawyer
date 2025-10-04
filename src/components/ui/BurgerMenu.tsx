"use client"

import React from 'react'
import Link from 'next/link'

interface BurgerMenuProps {
  services: Array<{ id: number; title: string }>
}

export default function BurgerMenu({ services }: BurgerMenuProps) {
  // Minimal accessible burger menu for mobile; keep simple to avoid breaking other parts
  return (
    <div className="lg:hidden">
      <details className="relative">
        <summary className="cursor-pointer p-2 rounded-md">☰</summary>
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg p-3 z-50">
          <nav className="flex flex-col gap-2">
            <Link href="/" className="py-2 px-3">Главная</Link>
            {services.slice(0, 10).map(s => (
              <Link key={s.id} href={`/${s.title}`} className="py-2 px-3">{s.title}</Link>
            ))}
            <Link href="/publications" className="py-2 px-3">Публикации</Link>
            <Link href="/contacts" className="py-2 px-3">Контакты</Link>
          </nav>
        </div>
      </details>
    </div>
  )
}
