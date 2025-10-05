import React from "react";
import Header from "@/components/ui/Header";
import HeroSection from "@/components/general/HeroSection";
import ServicesCarousel from "@/components/general/ServicesCarousel";
import InteractiveCellsSection from "@/components/general/InteractiveCellsSection";
import ContactFormSection from "@/components/general/ContactFormSection";
import Footer from "@/components/section/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ServicesCarousel />
        <InteractiveCellsSection />
        <ContactFormSection />
      </main>
      <Footer />
    </>
  );
}

