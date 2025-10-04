import React from "react";
import Header from "@/components/ui/Header";
import HeroSection from "@/components/general/HeroSection";
import ServicesCarousel from "@/components/general/ServicesCarousel";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ServicesCarousel />
        
        {/* Остальные секции будут добавлены после проверки Services */}
      </main>
    </>
  );
}
