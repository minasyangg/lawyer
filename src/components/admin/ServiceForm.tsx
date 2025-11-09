"use client"

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import FileManager from '@/components/admin/FileManager/FileManager'
import { createService, updateService } from '@/lib/actions/service-actions'

interface ServiceFormProps {
  mode: 'create' | 'edit'
  serviceId?: number
  initial?: {
    title: string
    description: string
    cardExcerpt?: string | null
    extraInfo?: string | null
    heroImage?: string | null
  }
  redirectPath?: string
}

export default function ServiceForm({ mode, serviceId, initial, redirectPath = '/admin/services' }: ServiceFormProps) {
  const [fileDialogOpen, setFileDialogOpen] = useState(false)
  const [heroImage, setHeroImage] = useState(initial?.heroImage || '')
  const [cardExcerpt, setCardExcerpt] = useState(initial?.cardExcerpt || '')
  const [pending, setPending] = useState(false)
  const [isMutating, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const router = useRouter()

  type ActionResult = { success?: boolean; errors?: Record<string, string[]> }
  async function handleSubmit(form: FormData) {
    setPending(true)
    setErrors({})
    form.set('heroImage', heroImage)
    form.set('cardExcerpt', cardExcerpt)
    try {
      let res: ActionResult | undefined
      if (mode === 'create') {
        res = await createService(form) as ActionResult
      } else if (mode === 'edit' && serviceId) {
        res = await updateService(serviceId, form) as ActionResult
      }
      if (res?.errors) {
        setErrors(res.errors)
        toast.error('Есть ошибки. Проверьте поля формы.')
      } else if (res?.success) {
        toast.success('Услуга успешно сохранена')
        startTransition(() => {
          router.push(redirectPath)
          router.refresh()
        })
      }
    } catch (e) {
      console.error(e)
      toast.error('Ошибка при сохранении')
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6 relative">
      {(pending || isMutating) && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-md">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-gray-700">Сохранение...</p>
          </div>
        </div>
      )}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Название услуги</label>
        <input name="title" defaultValue={initial?.title} required maxLength={120} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.title && <p className="text-xs text-red-600">{errors.title[0]}</p>}
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Hero подзаголовок (description)</label>
        <textarea name="description" defaultValue={initial?.description} required maxLength={500} rows={3} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.description && <p className="text-xs text-red-600">{errors.description[0]}</p>}
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Краткое описание для карточки (cardExcerpt)</label>
        <textarea name="cardExcerpt" value={cardExcerpt} onChange={e => setCardExcerpt(e.target.value)} maxLength={200} rows={3} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <p className="text-xs text-gray-500">Это краткий текст под названием услуги на главной странице. Рекомендуется до 1–2 предложений (до 200 символов).</p>
        {errors.cardExcerpt && <p className="text-xs text-red-600">{errors.cardExcerpt[0]}</p>}
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Полное описание (extraInfo)</label>
        <textarea name="extraInfo" defaultValue={initial?.extraInfo || ''} maxLength={5000} rows={6} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.extraInfo && <p className="text-xs text-red-600">{errors.extraInfo[0]}</p>}
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Hero изображение</label>
        <div className="flex gap-2 items-center">
          <input value={heroImage} onChange={e => setHeroImage(e.target.value)} placeholder="/img/services/hero.png" className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <Button type="button" variant="outline" size="sm" onClick={() => setFileDialogOpen(true)}>Выбрать</Button>
        </div>
        <p className="text-xs text-gray-500">Можно вручную ввести путь или выбрать из менеджера файлов.</p>
        {errors.heroImage && <p className="text-xs text-red-600">{errors.heroImage[0]}</p>}
      </div>
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending || isMutating} className="bg-blue-600 hover:bg-blue-700">{(pending || isMutating) ? 'Сохранение...' : (mode === 'create' ? 'Создать' : 'Сохранить')}</Button>
      </div>

      {fileDialogOpen && (
        <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
          <DialogContent className="max-w-5xl h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Выбор изображения</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <FileManager mode="dialog" userRole="ADMIN" onFileSelect={(file: { mimeType?: string; url?: string; path?: string; filename?: string }) => {
                if (!file.mimeType?.startsWith('image/')) return
                // Предпочитаем виртуальный URL (api/files/virtual/...), иначе числовой /api/files/:id
                // Если понадобятся прямые CDN ссылки, позже можно добавить fetch к /api/files/direct-url/virtualId
                const chosen = file.url || file.path || file.filename || ''
                setHeroImage(chosen)
                setFileDialogOpen(false)
              }} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setFileDialogOpen(false)}>Закрыть</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </form>
  )
}
