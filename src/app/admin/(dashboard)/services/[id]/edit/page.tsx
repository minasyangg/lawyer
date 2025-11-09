import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ServiceForm from '@/components/admin/ServiceForm'
import { createServiceDetails, updateServiceDetails, deleteServiceDetails } from '@/lib/actions/service-details-actions'

async function getService(id: number) {
  const svc = await prisma.service.findUnique({ where: { id }, include: { details: true } })
  return svc
}

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = await getService(Number(id))
  if (!service) return notFound()
  return (
  <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Редактирование услуги</h1>
          <p className="text-gray-600 text-sm">Основные поля выше сохраняют саму услугу (название, описания, изображение, колонки практики). Ниже — управление категориями и списками услуг.</p>
        </div>
  <Link href="/admin/services" className="text-sm text-blue-600 hover:underline">Назад</Link>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ServiceForm
          mode="edit"
          serviceId={service.id}
          initial={{
            title: service.title,
            description: service.description,
            cardExcerpt: service.cardExcerpt ?? null,
            extraInfo: service.extraInfo,
            heroImage: service.heroImage,
            practiceColumns: (service as { practiceColumns?: number }).practiceColumns ?? 1,
          }}
          redirectPath="/admin/services"
        />
        <div className="flex justify-end mt-6">
          <Link href="/admin/services" className="text-sm text-blue-600 hover:underline">Назад</Link>
        </div>
      </div>

      {/* ServiceDetails UI */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Категории и услуги практики</h2>
          <p className="text-sm text-gray-600">Каждая категория содержит многострочный список услуг (по одной на строку). После сохранения изменения сразу видны на странице услуги.</p>
          <p className="text-xs text-gray-500">Количество колонок задаётся выше в поле «Колонки раздела практики». При 2 колонках: первая категория — левая колонка, вторая и все остальные объединяются справа.</p>
        </div>

        {/* Форма добавления новой категории */}
  <form action={async (formData) => { 'use server'; await createServiceDetails(formData) }} className="grid grid-cols-1 gap-4">
          <input type="hidden" name="serviceId" value={service.id} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Категория</label>
            <input name="category" required maxLength={120} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Услуги (по одной на строку)</label>
            <textarea name="services" required rows={6} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md">Добавить категорию</button>
          </div>
        </form>

        {/* Список существующих категорий */}
        <div className="space-y-6">
          {service.details.length === 0 && (
            <p className="text-sm text-gray-500">Категории пока не добавлены.</p>
          )}
          {service.details.map((detail) => (
            <div key={detail.id} className="border rounded-md p-4">
              <form action={async (formData) => { 'use server'; await updateServiceDetails(detail.id, formData) }} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Категория</label>
                  <input name="category" defaultValue={detail.category} required maxLength={120} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Услуги (по одной на строку)</label>
                  <textarea name="services" defaultValue={detail.services} required rows={6} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-gray-500">Нумерация добавляется автоматически при отображении. Пустые строки игнорируются.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md">Сохранить категорию</button>
                  {/* Кнопка удаления не должна быть вложенной формой — используем отдельную кнопку с formAction */}
                  <button
                    formAction={async () => { 'use server'; await deleteServiceDetails(detail.id) }}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-md"
                  >
                    Удалить
                  </button>
                </div>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
