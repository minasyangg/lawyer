"use client"

interface Props {
  serviceTitle: string
  formId: string
}

export default function DeleteServiceButton({ serviceTitle, formId }: Props) {
  return (
    <button
      type="submit"
      form={formId}
      className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
      onClick={(e) => {
        const ok = window.confirm(`Удалить услугу "${serviceTitle}"? Связанные детали будут удалены, статьи будут отвязаны.`)
        if (!ok) e.preventDefault()
      }}
    >
      Удалить
    </button>
  )
}
