"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createSlugFromTitle } from '@/lib/services'
import { getCurrentUser, type SessionUser } from '@/lib/auth/session'

// Auth guard (ADMIN only)


function assertAdmin(user: SessionUser | null) {
  if (!user || user.userRole !== 'ADMIN') {
    throw new Error('Недостаточно прав')
  }
}

const DetailsSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  category: z.string().min(2).max(120),
  services: z.string().min(1), // многострочный список, как есть
})

export async function createServiceDetails(form: FormData) {
  const user = await getCurrentUser();
  assertAdmin(user)

  const data = {
    serviceId: form.get('serviceId'),
    category: form.get('category'),
    services: form.get('services'),
  }

  const parsed = DetailsSchema.safeParse(data)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const created = await prisma.serviceDetails.create({ data: parsed.data })

  // Ре-валидация путей
  await revalidateRelatedPaths(parsed.data.serviceId)

  return { success: true, id: created.id }
}

export async function updateServiceDetails(id: number, form: FormData) {
  const user = await getCurrentUser();
  assertAdmin(user)

  const data = {
    category: form.get('category'),
    services: form.get('services'),
  }

  const schema = DetailsSchema.omit({ serviceId: true })
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const existing = await prisma.serviceDetails.findUnique({ where: { id }, select: { serviceId: true } })
  if (!existing?.serviceId) return { errors: { _form: ['ServiceDetails не найден'] } }

  await prisma.serviceDetails.update({ where: { id }, data: parsed.data })

  await revalidateRelatedPaths(existing.serviceId)

  return { success: true }
}

export async function deleteServiceDetails(id: number) {
  const user = await getCurrentUser();
  assertAdmin(user)

  const existing = await prisma.serviceDetails.findUnique({ where: { id }, select: { serviceId: true } })
  if (!existing?.serviceId) return { errors: { _form: ['ServiceDetails не найден'] } }

  await prisma.serviceDetails.delete({ where: { id } })

  await revalidateRelatedPaths(existing.serviceId)

  return { success: true }
}

async function revalidateRelatedPaths(serviceId: number) {
  // Инвалидация списка услуг (домашняя, футер, карусель, секция)
  revalidatePath('/')
  revalidatePath('/admin/services')

  // Инвалидация страницы конкретной услуги
  const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { title: true } })
  if (service) {
    const slug = createSlugFromTitle(service.title)
    revalidatePath(`/${slug}`)
  }
}
