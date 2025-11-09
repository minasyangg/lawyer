import React from 'react'
import { getAllServices } from '@/lib/services'
import ServicesCarousel from './ServicesCarousel'

export default async function ServicesCarouselServer() {
  const services = await getAllServices()
  return <ServicesCarousel services={services} />
}
