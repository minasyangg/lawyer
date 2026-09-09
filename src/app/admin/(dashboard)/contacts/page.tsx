import { getContactRequests } from "@/lib/actions/contact-actions"
import { ContactRequestRow } from "@/components/admin/contacts/ContactRequestRow"
import { MailX } from "lucide-react"

export default async function ContactsPage() {
  const requests = await getContactRequests()
  const unreadCount = requests.filter((r) => !r.isRead).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Заявки</h1>
        <p className="text-gray-600">
          Обращения с формы обратной связи сайта.
          {unreadCount > 0 && ` Непрочитанных: ${unreadCount}.`}
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border border-gray-200 shadow-sm text-center">
          <MailX className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Заявок пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <ContactRequestRow key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  )
}
