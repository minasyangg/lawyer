import { prisma } from '@/lib/prisma'
import { updateService } from '@/lib/actions/service-actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function getService(id: number) {
  const svc = await prisma.service.findUnique({ where: { id } })
  return svc
}

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = await getService(Number(id))
  if (!service) return notFound()
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Редактирование услуги</h1>
          <p className="text-gray-600 text-sm">Измените данные услуги. Детали и категории добавим следующим этапом.</p>
        </div>
  <Link href="/admin/services" className="text-sm text-blue-600 hover:underline">Назад</Link>
      </div>
  <form className="bg-white border border-gray-200 rounded-lg p-6 space-y-6" action={async (formData) => { 'use server'; await updateService(Number(id), formData); revalidatePath('/admin/services') }}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Название услуги</label>
          <input name="title" defaultValue={service.title} required maxLength={120} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Hero подзаголовок (description)</label>
          <textarea name="description" defaultValue={service.description} required maxLength={500} rows={3} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Полное описание (extraInfo)</label>
          <textarea name="extraInfo" defaultValue={service.extraInfo || ''} maxLength={5000} rows={6} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Hero изображение (путь)</label>
          <input name="heroImage" defaultValue={service.heroImage || ''} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex justify-end gap-3">
          <Link href="/admin/services" className="px-4 py-2 rounded-md border text-sm">Отмена</Link>
          <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Сохранить</button>
        </div>
      </form>
    </div>
  )
}
