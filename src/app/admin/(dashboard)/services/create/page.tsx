import Link from 'next/link'
import ServiceForm from '@/components/admin/ServiceForm'

export default function CreateServicePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Новая услуга</h1>
          <p className="text-gray-600 text-sm">Добавьте услугу: название, подзаголовок (Hero), полный текст и hero изображение.</p>
        </div>
        <Link href="/admin/services" className="text-sm text-blue-600 hover:underline">Назад к списку</Link>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ServiceForm mode="create" redirectPath="/admin/services" />
      </div>
    </div>
  )
}
