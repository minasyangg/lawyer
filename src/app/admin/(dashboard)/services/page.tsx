import { listServices, deleteService } from '@/lib/actions/service-actions'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import DeleteServiceButton from '@/components/admin/DeleteServiceButton'
import { cookies } from 'next/headers'

export default async function AdminServicesPage() {
  const services = await listServices()
  // Показываем баннер "Сохранено" если есть query-параметр saved=1 (используем cookie как простой способ прокинуть флаг после redirect в server action)
  // Альтернатива: читать searchParams, но в App Router для server components можно принять props; здесь проще через cookie
  const store = await cookies()
  const savedFlag = store.get('admin-saved')?.value === '1'
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Услуги</h1>
  <Link href="/admin/services/create" className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Создать услугу</Link>
      </div>
      {savedFlag && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.01 4.14-1.63-1.63a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.145-.089l3.52-4.85z" clipRule="evenodd" /></svg>
          </div>
          <div className="text-sm text-emerald-800">
            <p className="font-medium">Изменения сохранены.</p>
            <p className="text-xs text-emerald-700 mt-1">Данные обновлены на публичных страницах (главная, меню, карусель, страница услуги). Если изменения не видны — обновите страницу.</p>
          </div>
        </div>
      )}
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
