"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { updateNotificationSettings } from "@/lib/actions/settings-actions"

interface NotificationSettingsFormProps {
  initialNotifyNewArticles: boolean
  initialNotifyLoginAlerts: boolean
}

export function NotificationSettingsForm({
  initialNotifyNewArticles,
  initialNotifyLoginAlerts,
}: NotificationSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [notifyNewArticles, setNotifyNewArticles] = useState(initialNotifyNewArticles)
  const [notifyLoginAlerts, setNotifyLoginAlerts] = useState(initialNotifyLoginAlerts)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)

    const result = await updateNotificationSettings(formData)

    if ('success' in result) {
      toast.success('Настройки уведомлений сохранены')
    } else {
      const message = 'general' in result.errors ? result.errors.general[0] : 'Не удалось сохранить настройки'
      toast.error(message)
    }

    setIsLoading(false)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="notifyNewArticles" className="font-medium">Новые статьи</Label>
          <p className="text-sm text-gray-500">Уведомлять о публикации новых статей</p>
        </div>
        <Switch
          id="notifyNewArticles"
          name="notifyNewArticles"
          checked={notifyNewArticles}
          onCheckedChange={setNotifyNewArticles}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="notifyLoginAlerts" className="font-medium">Подозрительные входы</Label>
          <p className="text-sm text-gray-500">Уведомлять о неудачных попытках входа</p>
        </div>
        <Switch
          id="notifyLoginAlerts"
          name="notifyLoginAlerts"
          checked={notifyLoginAlerts}
          onCheckedChange={setNotifyLoginAlerts}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="min-w-[140px]">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Сохранение...
          </>
        ) : 'Сохранить'}
      </Button>
    </form>
  )
}
