import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-8 mt-16">
      <div className="container mx-auto max-w-screen-xl px-4 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center gap-3 mb-6 md:mb-0">
          <span className="font-medium text-xl text-black">ПФК</span>
        </div>
        <nav className="flex gap-12 items-center mb-6 md:mb-0">
          <a href="#about" className="text-black text-lg font-medium hover:underline">О компании</a>
          <a href="#services" className="text-black text-lg font-medium hover:underline">Услуги</a>
          <a href="#publications" className="text-black text-lg font-medium hover:underline">Публикации</a>
          <a href="#contacts" className="bg-black text-white text-base font-medium py-3 px-6 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2" style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)" }}>Контакты</a>
        </nav>
      </div>
        <div className="container mx-auto max-w-screen-xl px-4 flex flex-col md:flex-row items-center justify-between flex items-center gap-3">
          <span className="text-black block text-lg font-medium">2025</span>
        </div>
    </footer>
  );
}
