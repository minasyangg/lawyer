import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="w-full bg-[#56647F] pt-[200px] md:pt-[320px] lg:pt-[370px] pb-[30px] md:pb-[37px] lg:pb-[44px] px-[25px] md:px-[40px] lg:px-[60px]">
      <div className="container mx-auto max-w-screen-xl">
        <div className="flex flex-col lg:flex-row gap-8 md:gap-9 lg:gap-10 pb-8 md:pb-9 lg:pb-10">
          {/* Колонка 1: ПФК + Описание */}
          <div className="flex flex-col gap-2.5 md:gap-2.75 lg:gap-3 flex-1">
            <h3 className="text-[18px] md:text-[19px] lg:text-[20px] font-bold text-white leading-[1.5]">
              ПФК
            </h3>
            <div className="flex flex-col justify-end gap-2.5 md:gap-2.75 lg:gap-3 flex-1">
              <p className="text-[13px] md:text-[13.5px] lg:text-[14px] font-normal text-white leading-[1.43]">
                Профессиональная юридическая помощь для бизнеса и частных лиц
              </p>
              <p className="text-[11px] md:text-[11.5px] lg:text-[12px] font-normal text-white leading-[1.33]">
                © 2025 ПФК. Все права защищены.
              </p>
            </div>
          </div>

          {/* Колонка 2: Наши услуги */}
          <div className="flex flex-col gap-2.5 md:gap-2.75 lg:gap-3 flex-1">
            <h3 className="text-[18px] md:text-[19px] lg:text-[20px] font-bold text-white leading-[1.5]">
              Наши услуги
            </h3>
            <div className="flex flex-col md:flex-row gap-4 md:gap-4.5 lg:gap-5 flex-1">
              {/* Первая подколонка */}
              <div className="flex flex-col justify-end gap-3 md:gap-3.5 lg:gap-4 flex-1">
                <Link href="/services/tax" className="text-[11px] md:text-[11.5px] lg:text-[12px] font-normal text-white leading-[1.33] hover:underline">
                  Услуги налоговой практики
                </Link>
                <Link href="/services/private" className="text-[11px] md:text-[11.5px] lg:text-[12px] font-normal text-white leading-[1.33] hover:underline">
                  Услуги частным клиентам
                </Link>
                <Link href="/services/intellectual" className="text-[11px] md:text-[11.5px] lg:text-[12px] font-normal text-white leading-[1.33] hover:underline">
                  Услуги практики по интелектуальным правам
                </Link>
              </div>
              
              {/* Вторая подколонка */}
              <div className="flex flex-col justify-end gap-3 md:gap-3.5 lg:gap-4 flex-1">
                <Link href="/services/bankruptcy" className="text-[11px] md:text-[11.5px] lg:text-[12px] font-normal text-white leading-[1.33] hover:underline">
                  Услуги практики банкротства
                </Link>
                <Link href="/services/disputes" className="text-[11px] md:text-[11.5px] lg:text-[12px] font-normal text-white leading-[1.33] hover:underline">
                  Решение спорови взыскание
                </Link>
                <Link href="/services/business" className="text-[11px] md:text-[11.5px] lg:text-[12px] font-normal text-white leading-[1.33] hover:underline">
                  Услуги по комплексному сопровождению бизнеса
                </Link>
              </div>
            </div>
          </div>

          {/* Колонка 3: Навигация */}
          <div className="flex flex-col gap-2.5 md:gap-2.75 lg:gap-3 flex-1">
            <h3 className="text-[18px] md:text-[19px] lg:text-[20px] font-bold text-white leading-[1.5]">
              Навигация
            </h3>
            <div className="flex flex-col gap-2.5 md:gap-2.75 lg:gap-3">
              <div className="flex flex-col gap-3 md:gap-3.5 lg:gap-4">
                <Link href="/" className="text-[15px] md:text-[15.5px] lg:text-[16px] font-normal text-white leading-[1] hover:underline">
                  Главная
                </Link>
                <Link href="/publications" className="text-[15px] md:text-[15.5px] lg:text-[16px] font-normal text-white leading-[1] hover:underline">
                  Публикации
                </Link>
                <Link href="/contacts" className="inline-flex justify-center items-center w-full px-5 py-3 md:px-5.5 md:py-3.5 lg:px-6 lg:py-4 mt-5 bg-[#060606] text-white text-[15px] md:text-[15.5px] lg:text-[16px] font-bold leading-[1.5] rounded-lg hover:bg-[#1a1a1a] transition-colors duration-300">
                  Контакты
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
