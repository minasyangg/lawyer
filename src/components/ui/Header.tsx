import React from "react";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full bg-white shadow-sm">
      <div className="container mx-auto max-w-screen-xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/img/logo.svg" alt="AlexSite Logo" width={40} height={40} priority />
          <span className="font-bold text-xl text-gray-900">AlexSite</span>
        </div>
        <nav className="hidden md:flex gap-8">
          <a href="/" className="text-gray-700 hover:text-blue-600 font-medium">Главная</a>
          <a href="/services" className="text-gray-700 hover:text-blue-600 font-medium">Услуги</a>
          <a href="/publications" className="text-gray-700 hover:text-blue-600 font-medium">Публикации</a>
          <a href="/contacts" className="text-gray-700 hover:text-blue-600 font-medium">Контакты</a>
        </nav>
        <button className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
          <Image src="/img/menu.svg" alt="Открыть меню" width={24} height={24} />
        </button>
      </div>
    </header>
  );
}
