import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ServiceForm from '@/components/admin/ServiceForm'

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
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ServiceForm
          mode="edit"
          serviceId={service.id}
          initial={{
            title: service.title,
            description: service.description,
            extraInfo: service.extraInfo,
            heroImage: service.heroImage,
          }}
          redirectPath="/admin/services"
        />
        <div className="flex justify-end mt-6">
          <Link href="/admin/services" className="text-sm text-blue-600 hover:underline">Назад</Link>
        </div>
      </div>
    </div>
  )
}
