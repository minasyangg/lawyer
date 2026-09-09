"use client"

import { useState, useTransition } from "react"
import { Check, Trash2, Loader2, MailOpen, Send, SendHorizonal } from "lucide-react"
import { markContactRequestAsRead, deleteContactRequest } from "@/lib/actions/contact-actions"
import type { ContactRequestListItem } from "@/lib/actions/contact-actions"

interface ContactRequestRowProps {
  request: ContactRequestListItem
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })

export function ContactRequestRow({ request }: ContactRequestRowProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleted, setDeleted] = useState(false)

  const fullName = [request.firstName, request.lastName].filter(Boolean).join(' ')

  const handleMarkAsRead = () => {
    setError(null)
    startTransition(async () => {
      const result = await markContactRequestAsRead(request.id)
      if (!('success' in result)) {
        setError(Object.values(result.errors)[0]?.[0] || 'Не удалось обновить статус')
      }
    })
  }

  const handleDelete = () => {
    if (!confirm(`Удалить заявку от ${fullName || request.email}?`)) return

    setError(null)
    startTransition(async () => {
      const result = await deleteContactRequest(request.id)
      if ('success' in result) {
        setDeleted(true)
      } else {
        setError(Object.values(result.errors)[0]?.[0] || 'Не удалось удалить заявку')
      }
    })
  }

  if (deleted) return null

  return (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        request.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{fullName || 'Без имени'}</p>
            {!request.isRead && (
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-medium">
                Новая
              </span>
            )}
            {request.telegramSent ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-700">
                <Send className="w-3 h-3" /> Отправлено в Telegram
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <SendHorizonal className="w-3 h-3" /> Не доставлено в Telegram
              </span>
            )}
          </div>

          <div className="mt-1 text-sm text-gray-600 space-y-0.5">
            <p>
              <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                {request.email}
              </a>
              {request.phone && (
                <>
                  {' · '}
                  <a href={`tel:${request.phone}`} className="text-primary hover:underline">
                    {request.phone}
                  </a>
                </>
              )}
            </p>
            {(request.position || request.ogrn) && (
              <p className="text-xs text-gray-500">
                {[request.position, request.ogrn && `ОГРН ${request.ogrn}`].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{request.message}</p>

          <p className="mt-2 text-xs text-gray-400">{dateFormatter.format(request.createdAt)}</p>

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {!request.isRead && (
            <button
              onClick={handleMarkAsRead}
              disabled={isPending}
              title="Отметить прочитанной"
              aria-label="Отметить прочитанной"
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
          )}
          {request.isRead && (
            <span className="p-2 text-gray-300" title="Прочитано">
              <MailOpen className="w-4 h-4" />
            </span>
          )}
          <button
            onClick={handleDelete}
            disabled={isPending}
            title="Удалить"
            aria-label="Удалить заявку"
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
