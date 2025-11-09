"use server"

import { prisma } from '@/lib/prisma'
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
  await prisma.service.create({ data: parsed.data })
  revalidatePath('/admin/services')
  revalidatePath('/')
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

  await prisma.service.update({ where: { id }, data: parsed.data })
  revalidatePath('/admin/services')
  revalidatePath('/')
  revalidatePath(`/services/${createSlugFromTitle(parsed.data.title)}`)
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

export async function listServices() {
  const user = await getCurrentUser();
  assertAdmin(user)
  const services = await prisma.service.findMany({ orderBy: { id: 'asc' } })
  return services.map(s => ({ ...s, slug: createSlugFromTitle(s.title) }))
}
