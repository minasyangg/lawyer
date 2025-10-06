import React from 'react'
import Header from '@/components/ui/Header'
import Footer from '@/components/section/Footer'
import ContactFormSection from '@/components/forms/ContactFormSection'

export default function ContactsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">

        {/* Form Section */}
        <section className="bg-white pb-32 pt-10">
          <div className="container mx-auto max-w-screen-xl px-4">
            <ContactFormSection />
          </div>
        </section>
      </main>
      
    <Footer paddingTop="pt-[150px] md:pt-[150px] lg:pt-[250px]" />
    </div>
  )
}