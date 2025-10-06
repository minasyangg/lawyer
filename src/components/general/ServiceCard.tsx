import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createSlugFromTitle } from '@/lib/services'

interface ServiceCardProps {
  title: string
  description?: string
  imageSrc: string
  imageHeight?: number
  imageContainerRef?: React.RefObject<HTMLDivElement>
}

export default function ServiceCard({ title, description, imageSrc, imageContainerRef }: ServiceCardProps) {
  const router = useRouter()

  const handleClick = () => {
    const slug = createSlugFromTitle(title)
    router.push(`/${slug}`)
  }

  return (
    <div
      onClick={handleClick}
      className="group relative z-30 flex flex-col flex-shrink-0 w-full h-[460px] bg-white rounded-2xl overflow-x-hidden overflow-y-visible shadow-card hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      <div className="transform-gpu transition-transform duration-300 group-hover:scale-105">
        {/* Изображение услуги - фиксированная высота для всех */}
  <div ref={imageContainerRef} className="relative w-full h-[145px] overflow-hidden flex-shrink-0">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover"
          />
        </div>

        {/* Контент */}
        <div className="flex-1 flex flex-col justify-between p-5 pt-6">
          {/* Заголовок - фиксированная высота, чтобы выровнять по строкам */}
          <div className="h-[58px] md:h-[68px] lg:h-[78px]">
            <h3 className="text-[24px] md:text-[28px] lg:text-[32px] font-bold text-gray-900 leading-[1.2] mb-3 line-clamp-2">
              {title}
            </h3>
          </div>

          {/* Описание - фиксированная высота, чтобы выравнивать блоки между карточками */}
          <div className="h-[66px] md:h-[72px] lg:h-[80px] overflow-hidden">
            <p className="text-[14px] md:text-[15px] lg:text-[16px] text-gray-700 leading-[1.4]">
              {description || 'Комплексная юридическая поддержка и консультации по всем вопросам.'}
            </p>
          </div>

          {/* Кнопка-иконка */}
          <div className="flex justify-start">
            <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center group-hover:bg-primary-dark transition-colors duration-200">
              <Image
                src="/img/icon-arrow-bottom-right.svg"
                alt="Перейти"
                width={16}
                height={16}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
