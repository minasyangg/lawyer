"use server"

import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/utils/universal-file-utils'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createSlugFromTitle } from '@/lib/services'
import { cookies } from 'next/headers'

// Basic auth guard (ADMIN only)
async function getCurrentUser() {
  const store = await cookies()
  const raw = store.get('admin-session')?.value
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

type SessionUser = { id: number; email: string; userRole: 'ADMIN' | 'EDITOR' | 'USER' }

function assertAdmin(user: SessionUser | null) {
  if (!user || user.userRole !== 'ADMIN') {
    throw new Error('Недостаточно прав')
  }
}

const ServiceSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(5).max(500), // hero subtitle
  extraInfo: z.string().nullable().optional().transform(v => v === '' ? null : v),
  heroImage: z.string().nullable().optional().transform(v => v === '' ? null : v)
})

export async function createService(form: FormData) {
  const user = await getCurrentUser();
  assertAdmin(user)

  const data = {
    title: form.get('title') as string,
    description: form.get('description') as string,
    extraInfo: form.get('extraInfo') as string | null,
    heroImage: form.get('heroImage') as string | null
  }
  const parsed = ServiceSchema.safeParse(data)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  const exists = await prisma.service.findFirst({ where: { title: parsed.data.title } })
  if (exists) {
    return { errors: { title: ['Услуга с таким названием уже существует'] } }
  }
  // Если heroImage указывает на файл из файлового менеджера, делаем его публичным и нормализуем в прямой CDN URL
  await makeHeroImagePublic(parsed.data.heroImage)
  const heroImageNormalized = await normalizeHeroImage(parsed.data.heroImage)
  const created = await prisma.service.create({ data: { ...parsed.data, heroImage: heroImageNormalized } })
  revalidatePath('/admin/services')
  revalidatePath('/')
  // На всякий случай инвалидация потенциальной страницы услуги по slug
  revalidatePath(`/${createSlugFromTitle(created.title)}`)
  return { success: true }
}

export async function updateService(id: number, form: FormData) {
  const user = await getCurrentUser();
  assertAdmin(user)
  const data = {
    title: form.get('title') as string,
    description: form.get('description') as string,
    extraInfo: form.get('extraInfo') as string | null,
    heroImage: form.get('heroImage') as string | null
  }
  const parsed = ServiceSchema.safeParse(data)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  // protect unique title
  const duplicate = await prisma.service.findFirst({ where: { title: parsed.data.title, NOT: { id } } })
  if (duplicate) return { errors: { title: ['Другое значение уже использует это имя'] } }

  await makeHeroImagePublic(parsed.data.heroImage)
  const heroImageNormalized = await normalizeHeroImage(parsed.data.heroImage)
  await prisma.service.update({ where: { id }, data: { ...parsed.data, heroImage: heroImageNormalized } })
  revalidatePath('/admin/services')
  revalidatePath('/')
  // Страница услуги расположена по корневому slug: /{slug}, а не /services/{slug}
  revalidatePath(`/${createSlugFromTitle(parsed.data.title)}`)
  return { success: true }
}

export async function deleteService(id: number, confirm: string) {
  const user = await getCurrentUser();
  assertAdmin(user)
  if (confirm !== 'YES') {
    return { errors: { confirm: ['Требуется подтверждение удаления (YES)'] } }
  }
  // Detach articles, delete ServiceDetails, then service
  await prisma.$transaction(async (tx) => {
    await tx.article.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
    await tx.serviceDetails.deleteMany({ where: { serviceId: id } })
    await tx.service.delete({ where: { id } })
  })
  revalidatePath('/admin/services')
  revalidatePath('/')
  return { success: true }
}

// Вспомогательная функция: делает файл публичным по heroImage URL (поддержка /api/files/:id и /api/files/virtual/:virtualId)
async function makeHeroImagePublic(heroImage: string | null | undefined) {
  if (!heroImage) return { ok: false, reason: 'empty' as const }
  try {
    // Нормализуем строку (убираем лишние пробелы)
    const src = heroImage.trim()
    const where: { id?: number; virtualId?: string; path?: string; filename?: string; virtualPath?: string } = {}

    // Поддержка различных форматов heroImage:
    // 1) /api/files/virtual/{virtualId}
    // 2) /api/files/{id}
    // 3) Прямой CDN/Supabase URL (попробуем определить по filename в конце пути)
    // 4) Хранилищный путь (file.path) или virtualPath
    const virtualMatch = src.match(/\/api\/files\/virtual\/([^/?#]+)/)
    const idMatch = src.match(/\/api\/files\/(\d+)(?:$|[/?#])/)

    if (virtualMatch) {
      where.virtualId = virtualMatch[1]
    } else if (idMatch) {
      where.id = Number(idMatch[1])
    } else if (!src.startsWith('/api/')) {
      // Возможный вариант: это путь или внешний URL
      const fileNameMatch = src.match(/([^/]+)$/)
      const baseName = fileNameMatch ? fileNameMatch[1] : undefined

      // Пробуем найти по точному пути, по virtualPath и по имени файла
      const candidate = await prisma.file.findFirst({
        where: {
          OR: [
            { path: src },
            { virtualPath: src },
            ...(baseName ? [{ filename: baseName }] : [])
          ]
        },
        select: { id: true, isPublic: true }
      })
      if (candidate) {
        if (!candidate.isPublic) {
          await prisma.file.update({ where: { id: candidate.id }, data: { isPublic: true } })
        } else {
          // already public
        }
        return { ok: true as const }
      }

      return { ok: false as const, reason: 'not-found' as const }
    } else {
      return { ok: false as const, reason: 'unrecognized' as const }
    }

    const file = await prisma.file.findFirst({ where, select: { id: true, isPublic: true } })
    if (file) {
      if (!file.isPublic) {
        await prisma.file.update({ where: { id: file.id }, data: { isPublic: true } })
      } else {
        // already public
      }
      return { ok: true as const }
    } else {
      return { ok: false as const, reason: 'not-found' as const }
    }
  } catch {
    // swallow verbose errors
    return { ok: false as const, reason: 'error' as const }
  }
}

// Преобразует heroImage из внутренних /api/files/virtual/:id или /api/files/:id в прямой CDN/Supabase URL для корректной работы next/image
async function normalizeHeroImage(heroImage: string | null | undefined): Promise<string | null> {
  if (!heroImage) return null
  const src = heroImage.trim()
  // Уже внешний URL — оставляем
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  try {
    const virtualMatch = src.match(/\/api\/files\/virtual\/([^/?#]+)/)
    const idMatch = src.match(/\/api\/files\/(\d+)(?:$|[/?#])/)
    let file = null
    if (virtualMatch) {
      file = await prisma.file.findFirst({ where: { virtualId: virtualMatch[1] }, select: { path: true } })
    } else if (idMatch) {
      file = await prisma.file.findFirst({ where: { id: Number(idMatch[1]) }, select: { path: true } })
    }
    if (file?.path) {
      const direct = await getFileUrl(file.path)
      return direct
    }
  } catch {
    // keep original on failure
  }
  return src
}

export async function listServices() {
  const user = await getCurrentUser();
  assertAdmin(user)
  const services = await prisma.service.findMany({ orderBy: { id: 'asc' } })
  return services.map(s => ({ ...s, slug: createSlugFromTitle(s.title) }))
}
