import { listServices, deleteService } from '@/lib/actions/service-actions'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import DeleteServiceButton from '@/components/admin/DeleteServiceButton'

export default async function AdminServicesPage() {
  const services = await listServices()
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Услуги</h1>
  <Link href="/admin/services/create" className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Создать услугу</Link>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Название</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Hero подзаголовок</th>
              <th className="px-4 py-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id} className="border-t last:border-b hover:bg-gray-50">
                <td className="px-4 py-2">{s.id}</td>
                <td className="px-4 py-2 font-medium">{s.title}</td>
                <td className="px-4 py-2 text-gray-500">{s.slug}</td>
                <td className="px-4 py-2 truncate max-w-xs" title={s.description}>{s.description}</td>
                <td className="px-4 py-2 flex gap-2">
                  <Link href={`/admin/services/${s.id}/edit`} className="px-2 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700">Редактировать</Link>
                  {(() => {
                    const formId = `delete-service-${s.id}`
                    return (
                      <>
                        <form id={formId} action={async (formData) => { 'use server'; const confirm = formData.get('confirm') as string; await deleteService(s.id, confirm); revalidatePath('/admin/services') }}>
                          <input type="hidden" name="confirm" value="YES" />
                        </form>
                        <DeleteServiceButton serviceTitle={s.title} formId={formId} />
                      </>
                    )
                  })()}
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Нет услуг</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
