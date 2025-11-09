import { notFound } from 'next/navigation'
import Header from '@/components/ui/Header'
import ButtonFeedbackClient from '@/components/ui/ButtonFeedbackClient'
import Footer from '@/components/section/Footer'
import ServiceDescriptionSection from '@/components/services/ServiceDescriptionSection'
import ServicePracticeSection from '@/components/services/ServicePracticeSection'
import ServicePublicationsSection from '@/components/services/ServicePublicationsSection'
import ReadPublicationsCTA from '@/components/services/ReadPublicationsCTA'
import { getServiceBySlug, getAllServiceSlugs, getRelatedArticles } from '@/lib/services'
import Image from 'next/image'
import ContactRedirectButton from '@/components/ui/ContactRedirectButton'

interface ServicePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const slugs = await getAllServiceSlugs()
  return slugs.map((slug) => ({
    slug,
  }))
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params
  const service = await getServiceBySlug(slug)

  if (!service) {
    notFound()
  }

  // Parse services into features array
  const features = service.details
    .flatMap(detail => detail.services.split('\n'))
    .filter(line => line.trim())
    .map(line => line.replace(/^\d+\.\s*/, '').trim())

  // Hero image: use service-specific image or fallback to generic
  const heroImage = service.heroImage || '/img/service-hero-background.png'

  // Получаем связанные статьи (сначала из этой категории, потом из других)
  const relatedArticles = await getRelatedArticles(service.id, 3)

  // Подготовка карточек услуг практики
  // Общая логика: 1 колонка — если одна категория; 2 колонки — если две и более (лишние категории добавляем ко второй колонке).
  function parseItems(text: string | null | undefined) {
    if (!text) return [] as string[]
    return text
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
  }

  let practiceCards: { title: string; items: string[] }[]
  if (service.details.length === 0) {
    practiceCards = [{ title: 'Услуги практики', items: features }]
  } else if (service.details.length === 1) {
    const d0 = service.details[0]
    practiceCards = [{ title: d0.category || 'Услуги практики', items: parseItems(d0.services) }]
  } else {
    const d0 = service.details[0]
    const d1 = service.details[1]
    const left = { title: d0.category || 'Колонка 1', items: parseItems(d0.services) }
    const rightItems = [...parseItems(d1.services)]
    // Добавляем оставшиеся категории к правой колонке
    if (service.details.length > 2) {
      for (let i = 2; i < service.details.length; i++) {
        rightItems.push(...parseItems(service.details[i].services))
      }
    }
    const right = { title: d1.category || 'Колонка 2', items: rightItems }
    practiceCards = [left, right]
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[463px] flex items-center bg-gray-100 overflow-hidden">
          {/* Фоновое изображение */}
          <Image
            src={heroImage}
            alt={service.title}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
				{/* Градиент overlay */}
	        <div className="absolute inset-0 z-[1] bg-gradient-hero pointer-events-none" />
          {/* Контент */}
          <div className="relative z-10 container mx-auto max-w-screen-xl px-[25px] md:px-[40px] lg:px-[60px]">
            <div className="flex flex-col gap-[60px] max-w-4xl">
              <h1 className="font-inter text-4xl md:text-5xl lg:text-[64px] font-bold leading-[1.21] tracking-[-0.02em] text-[#F2F7FA]">
                {service.title}
              </h1>
              <div className="flex flex-col gap-10">
                <p className="font-inter text-lg md:text-xl font-normal leading-[1.2] text-white">
                  {service.description}
                </p>
                <ContactRedirectButton
                  className="inline-flex items-center justify-center gap-4 bg-white rounded-lg px-6 py-4 transition-opacity hover:opacity-90 w-fit"
                  loadingLabel="Переход..."
                >
                  <span className="font-inter text-base font-bold leading-[1.5] text-[#060606]">
                    Заказать услугу
                  </span>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                  >
                    <path
                      d="M9.75 7.5L14.25 12L9.75 16.5"
                      stroke="#060606"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </ContactRedirectButton>
              </div>
            </div>
          </div>
        </section>

        {/* Секция описания услуги */}
        <ServiceDescriptionSection
          title="Описание услуги"
          description={service.extraInfo || service.description}
        />

        {/* Секция услуг практики */}
        <ServicePracticeSection cards={practiceCards} />

        {/* Секция "Мы всегда ждем Ваших обращений" */}
        <ButtonFeedbackClient />

        {/* Секция последних публикаций */}
        <ServicePublicationsSection articles={relatedArticles} />

        {/* Секция "Читать другие наши публикации" */}
        <ReadPublicationsCTA />
      </main>

  <Footer paddingTop="pt-[60px] md:pt-[50px] lg:pt-[70px]" />
    </div>
  )
}