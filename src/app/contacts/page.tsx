import React from 'react'
import Image from 'next/image'
import Header from '@/components/ui/Header'
import Footer from '@/components/section/Footer'
import ContactForm from '@/components/forms/ContactForm'

export default function ContactsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto max-w-screen-xl px-4 py-12 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content */}
            <div className="order-2 lg:order-1">
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-6xl font-bold text-black leading-tight">
                  Подписка
                </h1>
                <p className="text-lg lg:text-xl text-black font-medium leading-relaxed">
                  Благодарим Вас за интерес к нашим публикациям, мы всегда рады делиться с Вами нашей аналитикой и опытом.
                </p>
                <p className="text-lg lg:text-xl text-black font-medium leading-relaxed">
                  Просим Вас оставить свои данные, чтобы мы могли присылать Вам на почту наши новостные материалы.
                </p>
              </div>
            </div>

            {/* Image */}
            <div className="order-1 lg:order-2">
              <div className="relative">
                <Image
                  src="/img/contact-hero.jpg"
                  alt="Контакты ПФК"
                  width={508}
                  height={657}
                  className="w-full h-auto rounded-lg object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="bg-white">
          <div className="container mx-auto max-w-screen-xl px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl lg:text-3xl font-semibold text-black mb-4">
                  Информация для оформления бесплатной подписки
                </h2>
              </div>
              
              <div className="flex justify-center">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      
    <Footer paddingTop="pt-[200px] md:pt-[320px] lg:pt-[370px]" />
    </div>
  )
}