import { notFound } from 'next/navigation'
import Header from '@/components/ui/Header'
import ServiceDescriptionClient from '@/components/ui/ServiceDescriptionClient'
import ServiceDetails from '@/components/ui/ServiceDetails'
import ButtonFeedbackClient from '@/components/ui/ButtonFeedbackClient'
import Footer from '@/components/ui/Footer'
import { getServiceBySlug, getAllServiceSlugs } from '@/lib/services'

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

  // Transform service details for ServiceDetails component
  const serviceDetailsData = service.details.map(detail => detail.services).join('\n\n')
  
  // Parse services into features array
  const features = service.details
    .flatMap(detail => detail.services.split('\n'))
    .filter(line => line.trim())
    .map(line => line.replace(/^\d+\.\s*/, '').trim())

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <ServiceDescriptionClient
          title={service.title}
          shortDescription={service.description}
          features={features.slice(0, 5)} // Show first 5 features
        />
        
        <ServiceDetails
          fullDescription={service.extraInfo || service.description}
          features={features}
          benefits={[
            "Профессиональная юридическая поддержка",
            "Индивидуальный подход к каждому клиенту",
            "Опыт работы с аналогичными делами",
            "Консультации на всех этапах процесса"
          ]}
          price="Стоимость рассчитывается индивидуально"
          duration="Зависит от сложности дела"
        />
        
        <ButtonFeedbackClient />
      </main>
      
      <Footer />
    </div>
  )
}