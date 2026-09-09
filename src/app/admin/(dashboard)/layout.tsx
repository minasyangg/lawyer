import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/admin/LogoutButton'
import { AdminNavLink } from '@/components/admin/AdminNavLink'
import { getUnreadContactRequestsCount } from '@/lib/actions/contact-actions'

// Компонент-иконка (функция) нельзя передать как проп из Server Component
// в Client Component — вместо этого передаём ключ, а AdminNavLink сам
// резолвит его в реальную Lucide-иконку у себя.
const navigation = [
  { name: 'Главная', href: '/admin', icon: 'dashboard' as const },
  { name: 'Пользователи', href: '/admin/users', icon: 'users' as const },
  { name: 'Услуги', href: '/admin/services', icon: 'services' as const },
  { name: 'Статьи', href: '/admin/articles', icon: 'articles' as const },
  { name: 'Файлы', href: '/admin/files', icon: 'files' as const },
  { name: 'Заявки', href: '/admin/contacts', icon: 'contacts' as const },
  { name: 'Настройки', href: '/admin/settings', icon: 'settings' as const },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Сессия проверяется через общий helper: cookie подписана, подделать роль нельзя.
  // Доступ к /admin дополнительно ограничен middleware (только ADMIN).
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const unreadContactRequests = await getUnreadContactRequestsCount()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 bg-primary">
          <h1 className="text-white text-xl font-bold">Админ-панель</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => (
            <AdminNavLink
              key={item.name}
              href={item.href}
              icon={item.icon}
              badge={item.icon === 'contacts' ? unreadContactRequests : undefined}
            >
              {item.name}
            </AdminNavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">{user.name[0]}</span>
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-800">Панель администратора</h2>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
