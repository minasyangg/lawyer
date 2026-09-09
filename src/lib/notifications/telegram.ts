/**
 * Уведомление админа в Telegram о новой заявке с формы обратной связи.
 *
 * Осознанно best-effort: если TELEGRAM_BOT_TOKEN/TELEGRAM_ADMIN_CHAT_ID не заданы
 * или Bot API недоступен, заявка всё равно должна сохраниться в БД — отправка
 * уведомления никогда не должна ронять submitContactRequest.
 */

export interface TelegramNotificationPayload {
  firstName: string
  lastName?: string | null
  position?: string | null
  ogrn?: string | null
  email: string
  phone?: string | null
  message: string
}

// Экранирование спецсимволов MarkdownV2 (Bot API требует экранировать их все,
// иначе sendMessage вернёт 400 Bad Request на любом "_", "*", "." и т.д. в тексте).
const MARKDOWN_V2_SPECIAL_CHARS = /[_*[\]()~`>#+\-=|{}.!]/g

function escapeMarkdownV2(text: string): string {
  return text.replace(MARKDOWN_V2_SPECIAL_CHARS, (char) => `\\${char}`)
}

function buildMessageText(payload: TelegramNotificationPayload): string {
  const lines = [
    '📩 *Новая заявка с сайта*',
    '',
    `*Имя:* ${escapeMarkdownV2([payload.firstName, payload.lastName].filter(Boolean).join(' '))}`,
  ]

  if (payload.position) {
    lines.push(`*Должность:* ${escapeMarkdownV2(payload.position)}`)
  }
  if (payload.ogrn) {
    lines.push(`*ОГРН:* ${escapeMarkdownV2(payload.ogrn)}`)
  }

  lines.push(`*Email:* ${escapeMarkdownV2(payload.email)}`)

  if (payload.phone) {
    lines.push(`*Телефон:* ${escapeMarkdownV2(payload.phone)}`)
  }

  lines.push('', `*Сообщение:*\n${escapeMarkdownV2(payload.message)}`)

  return lines.join('\n')
}

/**
 * Отправляет уведомление о заявке в Telegram админу.
 * Возвращает true при успешной отправке, false — если не настроено или сбой.
 * Никогда не бросает исключение наружу.
 */
export async function sendContactRequestTelegramNotification(
  payload: TelegramNotificationPayload
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!botToken || !chatId) {
    console.warn('Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured')
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessageText(payload),
        parse_mode: 'MarkdownV2',
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Telegram sendMessage failed:', response.status, errorBody)
      return false
    }

    return true
  } catch (error) {
    console.error('Telegram sendMessage error:', error)
    return false
  }
}
