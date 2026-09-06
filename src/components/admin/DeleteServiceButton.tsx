"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

interface Props {
  serviceTitle: string
  formId: string
}

export default function DeleteServiceButton({ serviceTitle, formId }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  return (
    <button
      type="submit"
      form={formId}
      disabled={isDeleting}
      className="inline-flex items-center px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      onClick={(e) => {
        const ok = window.confirm(`Удалить услугу "${serviceTitle}"? Связанные детали будут удалены, статьи будут отвязаны.`)
        if (!ok) {
          e.preventDefault()
          return
        }
        // Форма живёт вне этого компонента (привязана через атрибут form=), поэтому
        // useFormStatus её не видит — отслеживаем отправку локальным флагом.
        // Страница после успешного удаления обновится через revalidatePath,
        // так что явно сбрасывать флаг не нужно.
        setIsDeleting(true)
      }}
    >
      {isDeleting && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
      Удалить
    </button>
  )
}
