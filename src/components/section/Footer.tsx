import React from 'react'
import Link from 'next/link'

interface FooterProps {
  paddingTop?: string
}

const Footer: React.FC<FooterProps> = ({ paddingTop }) => {
  // Значения по умолчанию (большой padding)
  const defaultPadding = 'pt-[200px] md:pt-[320px] lg:pt-[370px]';
  // Если передан paddingTop проп, используем его, иначе дефолт
  const pt = paddingTop || defaultPadding;
  return (
    <footer className={`w-full bg-[#56647F] ${pt} pb-[30px] md:pb-[37px] lg:pb-[44px] px-[25px] md:px-[40px] lg:px-[60px]`}>
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
                <Link href="/nalogovaya-praktika" className="text-[11px] md:text-[11.5px] lg:text-[12px] font-normal text-white leading-[1.33] hover:underline">
                  Налоговая практика
                </Link>
                <Link href="/chastnym-klientam" className="text-[11px] md:text-[11.5px] lg:text-[12px] font-normal text-white leading-[1.33] hover:underline">
                  Частным клиентам
                </Link>
              </div>
              
              {/* Вторая подколонка */}
              <div className="flex flex-col justify-end gap-3 md:gap-3.5 lg:gap-4 flex-1">
                <Link href="/praktika-bankrotstva" className="text-[11px] md:text-[11.5px] lg:text-[12px] font-normal text-white leading-[1.33] hover:underline">
                  Практика банкротства
                </Link>
                <Link href="/spory-i-vzyskanie" className="text-[11px] md:text-[11.5px] lg:text-[12px] font-normal text-white leading-[1.33] hover:underline">
                  Споры и взыскание
                </Link>
                <Link href="/kompleksnoe-soprovozhdenie-biznesa" className="text-[11px] md:text-[11.5px] lg:text-[12px] font-normal text-white leading-[1.33] hover:underline">
                  Комплексное сопровождение бизнеса
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
  );
};
export default Footer;
