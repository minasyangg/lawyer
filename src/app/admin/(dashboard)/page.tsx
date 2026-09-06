import { Suspense } from "react"
import { Users, FileText, ShieldAlert } from "lucide-react"
import { UserTable } from "@/components/admin/UserTable"
import { getUsers } from "@/lib/actions/user-actions"
import { getArticles } from "@/lib/actions/article-actions"
import { getSecurityOverview } from "@/lib/actions/settings-actions"

function UserTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mt-1 animate-pulse"></div>
        </div>
        <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center">
        <div className="p-2 bg-gray-100 rounded-lg w-10 h-10 animate-pulse" />
        <div className="ml-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-7 bg-gray-200 rounded w-12 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

async function UserTableWrapper() {
  const users = await getUsers()
  return <UserTable users={users} />
}

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Главная</h1>
        <p className="text-gray-600">
          Обзор системы: пользователи, статьи и безопасность.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Suspense fallback={<StatCardSkeleton />}>
          <UsersStatCard />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <ArticlesStatCard />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <SecurityStatCard />
        </Suspense>
      </div>

      <Suspense fallback={<UserTableSkeleton />}>
        <UserTableWrapper />
      </Suspense>
    </div>
  )
}

async function UsersStatCard() {
  const users = await getUsers()
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Пользователей</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
      </div>
    </div>
  )
}

async function ArticlesStatCard() {
  const articles = await getArticles()
  const published = articles.filter((a) => a.published).length
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center">
        <div className="p-2 bg-green-100 rounded-lg">
          <FileText className="w-6 h-6 text-green-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Опубликовано статей</p>
          <p className="text-2xl font-bold text-gray-900">
            {published} <span className="text-base font-normal text-gray-400">из {articles.length}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

async function SecurityStatCard() {
  const security = await getSecurityOverview()
  const hasIssues = security.failedLogins24h > 0 || security.lockedAccountsCount > 0
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${hasIssues ? 'bg-yellow-100' : 'bg-gray-100'}`}>
          <ShieldAlert className={`w-6 h-6 ${hasIssues ? 'text-yellow-600' : 'text-gray-500'}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Неудачных входов за 24ч</p>
          <p className="text-2xl font-bold text-gray-900">{security.failedLogins24h}</p>
        </div>
      </div>
    </div>
  )
}
