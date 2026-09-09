"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, LayoutDashboard, Settings, FileText, FolderOpen, Briefcase, Mail } from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Иконки резолвятся по имени внутри клиентского компонента, а не передаются
// как проп из Server Component — компонент-функция (Lucide icon) не сериализуем
// через границу server->client ("Only plain objects can be passed to Client
// Components from Server Components").
const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  services: Briefcase,
  articles: FileText,
  files: FolderOpen,
  contacts: Mail,
  settings: Settings,
}

interface AdminNavLinkProps {
  href: string
  icon: keyof typeof ICONS
  children: React.ReactNode
  badge?: number
}

/**
 * Пункт навигации в сайдбаре админки с подсветкой текущего раздела.
 * "/admin" считается активным только на точном совпадении (иначе он
 * подсвечивался бы всегда, будучи префиксом всех остальных путей).
 */
export function AdminNavLink({ href, icon, children, badge }: AdminNavLinkProps) {
  const pathname = usePathname()
  const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
  const Icon = ICONS[icon]

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-gray-700 hover:bg-primary/5 hover:text-primary'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="flex-1">{children}</span>
      {!!badge && badge > 0 && (
        <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-600 text-white text-xs font-semibold">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}
