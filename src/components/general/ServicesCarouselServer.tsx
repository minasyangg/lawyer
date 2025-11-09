import React from 'react'
import { prisma } from '@/lib/prisma'
import ServicesCarousel from './ServicesCarousel'

export default async function ServicesCarouselServer() {
  // Выбираем только нужные поля, включая cardExcerpt и cardImage
  const services = await prisma.service.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      heroImage: true,
      cardImage: true,
      cardExcerpt: true,
    }
  })
  return <ServicesCarousel services={services} />
}
