import React from "react";
import Header from "@/components/ui/Header";
import HeroSection from "@/components/general/HeroSection";
import ServicesCarouselServer from "@/components/general/ServicesCarouselServer";
import InteractiveCellsSection from "@/components/general/InteractiveCellsSection";
import ContactFormSection from "@/components/forms/ContactFormSection";
import Footer from "@/components/section/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
  <ServicesCarouselServer />
        <InteractiveCellsSection />
        <ContactFormSection />
      </main>
    <Footer paddingTop="pt-[200px] md:pt-[320px] lg:pt-[370px]" />
    </>
  );
}

