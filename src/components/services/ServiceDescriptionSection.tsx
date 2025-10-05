'use client'

interface ServiceDescriptionSectionProps {
  title: string
  description: string
}

export default function ServiceDescriptionSection({
  title,
  description,
}: ServiceDescriptionSectionProps) {
  const handleConsultation = () => {
    // Здесь можно добавить логику открытия формы обратной связи
    console.log('Открытие формы консультации')
  }

  return (
    <section className="w-full bg-[#F2F7FA] py-14 md:py-20">
      <div className="container mx-auto max-w-screen-xl px-[25px] md:px-[40px] lg:px-[60px]">
        <div className="flex flex-col gap-6">
          {/* Заголовок */}
          <h2 className="font-inter text-3xl md:text-4xl lg:text-[48px] font-bold text-[#060606] leading-[1.2]">
            {title}
          </h2>

          {/* Описание */}
          <p className="font-inter text-lg md:text-xl font-normal text-[#060606] leading-[1.5]">
            {description}
          </p>

          {/* Кнопка */}
          <div className="mt-6">
            <button
              onClick={handleConsultation}
              className="inline-flex items-center justify-center gap-4 bg-[#0426A1] hover:bg-[#0426A1]/90 text-white font-inter font-bold text-base rounded-lg px-6 py-4 transition-opacity hover:opacity-90 focus:outline-none"
            >
              <span>Получить первичную консультацию</span>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
              >
                <path
                  d="M19.12 4.88L4.88 19.12M19.12 4.88H9.38M19.12 4.88V14.62"
                  stroke="#F2F7FA"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
