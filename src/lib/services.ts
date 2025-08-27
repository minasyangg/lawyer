import { prisma } from './prisma'
import { Service, ServiceDetails } from '@prisma/client'

export type ServiceWithDetails = Service & {
  details: ServiceDetails[]
}

export async function getAllServices(): Promise<Service[]> {
  return await prisma.service.findMany({
    orderBy: {
      id: 'asc'
    }
  })
}

export async function getServiceBySlug(slug: string): Promise<ServiceWithDetails | null> {
  // Get all services and find by matching slug
  const services = await prisma.service.findMany({
    include: {
      details: true
    }
  })
  
  const service = services.find(service => createSlugFromTitle(service.title) === slug)
  
  return service || null
}

export async function getAllServiceSlugs(): Promise<string[]> {
  const services = await getAllServices()
  return services.map(service => createSlugFromTitle(service.title))
}

export function createSlugFromTitle(title: string): string {
  const transliterationMap: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  
  return title
    .toLowerCase()
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}