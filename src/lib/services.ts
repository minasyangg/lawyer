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

export type RecentPublication = {
  id: number
  title: string
  excerpt?: string | null
  slug: string
  date: string
  cover?: string | null
}

export async function getRecentPublications(limit = 3): Promise<RecentPublication[]> {
  const withFiles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      files: {
        include: { file: true },
        take: 1
      }
    }
  })

  return withFiles.map(a => {
    // a.files is (ArticleFile & { file: File | null })[]
    const firstArticleFile = a.files && a.files.length > 0 ? a.files[0] : undefined
    const fileObj = firstArticleFile && 'file' in firstArticleFile ? firstArticleFile.file : undefined
    const cover = fileObj && fileObj.filename ? `/api/files/direct/${fileObj.filename}` : null

    return {
      id: a.id,
      title: a.title,
      excerpt: a.excerpt,
      slug: a.slug,
      date: a.createdAt.toISOString().split('T')[0],
      cover,
    }
  })
}