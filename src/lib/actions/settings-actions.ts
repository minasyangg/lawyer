"use server"

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/session'

export type SiteSettingsDto = {
  siteName: string
  contactEmail: string
  notifyNewArticles: boolean
  notifyLoginAlerts: boolean
  updatedAt: Date
  updatedByName: string | null
}

interface ActionError {
  errors: { [key: string]: string[] } | { general: string[] }
}

interface ActionSuccess {
  success: true
}

const SETTINGS_ID = 1

/** Настройки сайта хранятся одной строкой-синглтоном (id всегда 1). */
export async function getSiteSettings(): Promise<SiteSettingsDto> {
  const settings = await prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
    include: { updatedBy: { select: { name: true } } },
  })

  return {
    siteName: settings.siteName,
    contactEmail: settings.contactEmail,
    notifyNewArticles: settings.notifyNewArticles,
    notifyLoginAlerts: settings.notifyLoginAlerts,
    updatedAt: settings.updatedAt,
    updatedByName: settings.updatedBy?.name ?? null,
  }
}

const GeneralSettingsSchema = z.object({
  siteName: z.string().trim().min(2, 'Название сайта должно быть не короче 2 символов').max(100),
  contactEmail: z.string().trim().email('Некорректный email'),
})

export async function updateGeneralSettings(data: FormData): Promise<ActionSuccess | ActionError> {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) {
    return { errors: { general: ['Недостаточно прав'] } }
  }

  const validated = GeneralSettingsSchema.safeParse({
    siteName: data.get('siteName'),
    contactEmail: data.get('contactEmail'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  try {
    await prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      update: { ...validated.data, updatedById: admin.id },
      create: { id: SETTINGS_ID, ...validated.data, updatedById: admin.id },
    })

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    console.error('Error updating general settings:', error)
    return { errors: { general: ['Не удалось сохранить настройки'] } }
  }
}

const NotificationSettingsSchema = z.object({
  notifyNewArticles: z.boolean(),
  notifyLoginAlerts: z.boolean(),
})

export async function updateNotificationSettings(data: FormData): Promise<ActionSuccess | ActionError> {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) {
    return { errors: { general: ['Недостаточно прав'] } }
  }

  const validated = NotificationSettingsSchema.safeParse({
    notifyNewArticles: data.get('notifyNewArticles') === 'on',
    notifyLoginAlerts: data.get('notifyLoginAlerts') === 'on',
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  try {
    await prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      update: { ...validated.data, updatedById: admin.id },
      create: { id: SETTINGS_ID, ...validated.data, updatedById: admin.id },
    })

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return { errors: { general: ['Не удалось сохранить настройки'] } }
  }
}

export type SecurityOverviewDto = {
  activeAccountsCount: number
  successfulLogins24h: number
  failedLogins24h: number
  lockedAccountsCount: number
  recentFailedAttempts: Array<{
    id: number
    email: string
    ipAddress: string | null
    failureReason: string | null
    createdAt: Date
  }>
}

/**
 * Реальная сводка по безопасности на основе LoginLog — без выдуманных цифр.
 * "Активных сессий" в классическом смысле нет (сессии — stateless JWT без
 * server-side хранилища), поэтому вместо этого показываем факты из логов входов.
 */
export async function getSecurityOverview(): Promise<SecurityOverviewDto> {
  await requireAdmin()

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [activeAccountsCount, successfulLogins24h, failedLogins24h, lockedAccountsCount, recentFailedAttempts] =
    await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.loginLog.count({ where: { result: 'SUCCESS', createdAt: { gte: since24h } } }),
      prisma.loginLog.count({ where: { result: 'FAILED', createdAt: { gte: since24h } } }),
      prisma.user.count({ where: { lockedUntil: { gt: new Date() } } }),
      prisma.loginLog.findMany({
        where: { result: 'FAILED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, email: true, ipAddress: true, failureReason: true, createdAt: true },
      }),
    ])

  return {
    activeAccountsCount,
    successfulLogins24h,
    failedLogins24h,
    lockedAccountsCount,
    recentFailedAttempts,
  }
}
