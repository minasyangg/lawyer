'use client'

import React, { useState } from 'react'
import Image from 'next/image'

const cells = [
  {
    id: 1,
    number: '01',
    title: 'Для успешного бизнеса',
    imageSrc: '/img/carousel-business-1-6d744d.png',
    description: 'Комплексное юридическое сопровождение для крупных компаний и холдингов',
  },
  {
    id: 2,
    number: '02',
    title: 'Для развивающегося бизнеса',
    imageSrc: '/img/carousel-image.png',
    description: 'Юридическая поддержка растущих компаний и стартапов на всех этапах развития',
  },
  {
    id: 3,
    number: '03',
    title: 'Для частных клиентов',
    imageSrc: '/img/carousel-private-3-15424d.png',
    description: 'Индивидуальные решения для защиты прав и интересов физических лиц',
  },
]

export default function InteractiveCellsSection() {
  const [activeCell, setActiveCell] = useState(2) // По умолчанию активна 2-я ячейка

  return (
    <section className="w-full py-[35px] md:py-[40px] lg:py-[50px] px-0 lg:px-[25px]">
      {/* Вертикальный stack на mobile/tablet, горизонтальный на desktop */}
      <div className="w-full flex flex-col lg:flex-row">
        {cells.map((cell) => {
          const isActive = activeCell === cell.id

          return (
              <div
                key={cell.id}
                className="relative flex-1 min-w-0 cursor-pointer overflow-hidden mb-[-20px] last:mb-0 lg:mb-0"
                style={{ 
                  aspectRatio: '4 / 4.5' // Уменьшена высота на 10% для mobile (было 4/5)
                }}
                onMouseEnter={() => setActiveCell(cell.id)}
                onClick={() => setActiveCell(cell.id)}
              >
                {/* Background image layer (always mounted) */}
                <div className={`absolute inset-0 transition-opacity duration-900 ease-out ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                  <Image
                    src={cell.imageSrc}
                    alt={cell.title}
                    fill
                    className="object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(180deg, rgba(4, 38, 161, 0.6) 63%, rgba(11, 28, 72, 1) 100%)'
                    }}
                  />
                </div>

                {/* Solid blue base layer for inactive state */}
                <div className={`absolute inset-0 transition-opacity duration-900 ease-out ${isActive ? 'opacity-0' : 'opacity-100'}`} style={{ backgroundColor: '#0426A1' }} />

                {/* Active content (text over image) - opacity/transform animated to prevent FOUC */}
                <div
                  className={`relative z-10 h-full flex flex-col justify-between p-6 md:p-8 lg:p-10 transition-all duration-900 ease-out ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                  style={{ willChange: 'opacity, transform' }}
                >
                  <div>
                    <div className="text-[48px] md:text-[56px] lg:text-[64px] font-bold text-white opacity-50 leading-none mb-3 md:mb-3.5 lg:mb-4">
                      {cell.number}
                    </div>
                    <h3 className="text-[24px] md:text-[28px] lg:text-[32px] font-bold text-white leading-tight">
                      {cell.title}
                    </h3>
                  </div>

                  <div>
                    <p className={`text-[14px] md:text-[16px] lg:text-[18px] text-white leading-relaxed ${isActive ? 'pb-9 md:pb-20 lg:pb-0' : ''}`}>
                      {cell.description}
                    </p>
                  </div>
                </div>

                {/* Inactive centered content - same mounting, inverse visibility */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8 lg:p-10 transition-all duration-900 ease-out ${isActive ? 'opacity-0' : 'opacity-100'}`}
                  style={{ willChange: 'opacity' }}
                >
                  <div className="text-[48px] md:text-[56px] lg:text-[64px] font-bold text-white opacity-50 leading-none mb-3 md:mb-3.5 lg:mb-4">
                    {cell.number}
                  </div>
                  <h3 className="text-[24px] md:text-[28px] lg:text-[32px] font-bold text-white leading-tight text-center">
                    {cell.title}
                  </h3>
                </div>
              </div>
          )
        })}
      </div>
    </section>
  )
}

