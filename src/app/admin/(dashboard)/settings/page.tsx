import { Suspense } from "react"
import { getSiteSettings, getSecurityOverview } from "@/lib/actions/settings-actions"
import { GeneralSettingsForm } from "@/components/admin/settings/GeneralSettingsForm"
import { NotificationSettingsForm } from "@/components/admin/settings/NotificationSettingsForm"
import { ShieldAlert, ShieldCheck, Lock } from "lucide-react"

function SettingsCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="h-5 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
      <div className="space-y-4">
        <div className="h-9 bg-gray-100 rounded animate-pulse" />
        <div className="h-9 bg-gray-100 rounded animate-pulse" />
        <div className="h-9 bg-gray-200 rounded w-28 animate-pulse" />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Настройки</h1>
        <p className="text-gray-600">
          Основные параметры сайта, уведомления и обзор безопасности.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<SettingsCardSkeleton />}>
          <GeneralSettingsSection />
        </Suspense>

        <Suspense fallback={<SettingsCardSkeleton />}>
          <NotificationSettingsSection />
        </Suspense>

        <Suspense fallback={<SettingsCardSkeleton />}>
          <SecurityOverviewSection />
        </Suspense>
      </div>
    </div>
  )
}

async function GeneralSettingsSection() {
  const settings = await getSiteSettings()
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Общие настройки</h3>
      <GeneralSettingsForm
        initialSiteName={settings.siteName}
        initialContactEmail={settings.contactEmail}
      />
      {settings.updatedByName && (
        <p className="text-xs text-gray-400 mt-3">
          Последнее изменение: {settings.updatedByName},{' '}
          {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(settings.updatedAt)}
        </p>
      )}
    </div>
  )
}

async function NotificationSettingsSection() {
  const settings = await getSiteSettings()
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Уведомления</h3>
      <NotificationSettingsForm
        initialNotifyNewArticles={settings.notifyNewArticles}
        initialNotifyLoginAlerts={settings.notifyLoginAlerts}
      />
      <p className="text-xs text-gray-400 mt-4">
        Отправка писем требует настройки SMTP на сервере — пока переключатели только сохраняют выбор.
      </p>
    </div>
  )
}

async function SecurityOverviewSection() {
  const security = await getSecurityOverview()

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm lg:col-span-2">
      <h3 className="text-lg font-semibold mb-4">Обзор безопасности</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
          <ShieldCheck className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Успешных входов за 24ч</p>
            <p className="text-xl font-bold text-gray-900">{security.successfulLogins24h}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
          <ShieldAlert className={`w-8 h-8 flex-shrink-0 ${security.failedLogins24h > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
          <div>
            <p className="text-xs text-gray-500">Неудачных входов за 24ч</p>
            <p className="text-xl font-bold text-gray-900">{security.failedLogins24h}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
          <Lock className={`w-8 h-8 flex-shrink-0 ${security.lockedAccountsCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
          <div>
            <p className="text-xs text-gray-500">Заблокированных аккаунтов</p>
            <p className="text-xl font-bold text-gray-900">{security.lockedAccountsCount}</p>
          </div>
        </div>
      </div>

      {security.recentFailedAttempts.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Последние неудачные попытки входа</p>
          <div className="border border-gray-200 rounded-md divide-y divide-gray-100">
            {security.recentFailedAttempts.map((attempt) => (
              <div key={attempt.id} className="px-3 py-2 text-sm flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-gray-900 truncate">{attempt.email}</p>
                  <p className="text-xs text-gray-500">
                    {attempt.ipAddress || 'IP неизвестен'}
                    {attempt.failureReason ? ` · ${attempt.failureReason}` : ''}
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(attempt.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Сессии авторизации хранятся в подписанном cookie (JWT) без серверного реестра,
        поэтому принудительный сброс всех сессий или настройка времени жизни сессии
        из интерфейса пока недоступны — только через переменные окружения.
      </p>
    </div>
  )
}
