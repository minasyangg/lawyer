"use server"

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/session'
import { sendContactRequestTelegramNotification } from '@/lib/notifications/telegram'
import type { ContactRequest } from '@prisma/client'

interface ActionError {
  errors: { [key: string]: string[] } | { general: string[] }
}

interface ActionSuccess {
  success: true
}

const ContactRequestSchema = z.object({
  firstName: z.string().trim().min(1, 'Имя обязательно для заполнения').max(100),
  lastName: z.string().trim().max(100).optional().or(z.literal('')),
  position: z.string().trim().max(150).optional().or(z.literal('')),
  ogrn: z.string().trim().regex(/^\d{13}$|^\d{15}$/, 'ОГРН должен содержать 13 или 15 цифр').optional().or(z.literal('')),
  email: z.string().trim().min(1, 'Email обязателен для заполнения').email('Введите корректный email адрес'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Описание вопроса обязательно для заполнения').max(5000),
})

/**
 * Приём заявки с публичной формы обратной связи: сохранение в БД + best-effort
 * уведомление в Telegram. Отправка уведомления никогда не блокирует сохранение
 * заявки — статус доставки фиксируется отдельным полем telegramSent для админки.
 */
export async function submitContactRequest(data: FormData): Promise<ActionSuccess | ActionError> {
  const validated = ContactRequestSchema.safeParse({
    firstName: data.get('firstName'),
    lastName: data.get('lastName'),
    position: data.get('position') ?? '',
    ogrn: data.get('ogrn') ?? '',
    email: data.get('email'),
    phone: data.get('phone') ?? '',
    message: data.get('message'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { firstName, lastName, position, ogrn, email, phone, message } = validated.data

  try {
    const created = await prisma.contactRequest.create({
      data: {
        firstName,
        lastName: lastName || null,
        position: position || null,
        ogrn: ogrn || null,
        email,
        phone: phone || null,
        message,
      },
    })

    const telegramSent = await sendContactRequestTelegramNotification({
      firstName,
      lastName,
      position,
      ogrn,
      email,
      phone,
      message,
    })

    if (telegramSent) {
      await prisma.contactRequest.update({
        where: { id: created.id },
        data: { telegramSent: true },
      })
    }

    revalidatePath('/admin/contacts')
    return { success: true }
  } catch (error) {
    console.error('Error submitting contact request:', error)
    return { errors: { general: ['Не удалось отправить заявку. Попробуйте ещё раз позже.'] } }
  }
}

export type ContactRequestListItem = ContactRequest

/** Список заявок для админки, новые сверху. */
export async function getContactRequests(): Promise<ContactRequestListItem[]> {
  await requireAdmin()

  return prisma.contactRequest.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

/** Количество непрочитанных заявок — для бейджа в сайдбаре. */
export async function getUnreadContactRequestsCount(): Promise<number> {
  await requireAdmin()

  return prisma.contactRequest.count({ where: { isRead: false } })
}

export async function markContactRequestAsRead(id: number): Promise<ActionSuccess | ActionError> {
  await requireAdmin()

  try {
    await prisma.contactRequest.update({
      where: { id },
      data: { isRead: true },
    })

    revalidatePath('/admin/contacts')
    return { success: true }
  } catch (error) {
    console.error('Error marking contact request as read:', error)
    return { errors: { general: ['Не удалось обновить статус заявки'] } }
  }
}

export async function deleteContactRequest(id: number): Promise<ActionSuccess | ActionError> {
  await requireAdmin()

  try {
    await prisma.contactRequest.delete({ where: { id } })

    revalidatePath('/admin/contacts')
    return { success: true }
  } catch (error) {
    console.error('Error deleting contact request:', error)
    return { errors: { general: ['Не удалось удалить заявку'] } }
  }
}
