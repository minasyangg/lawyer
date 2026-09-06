"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateGeneralSettings } from "@/lib/actions/settings-actions"

interface GeneralSettingsFormProps {
  initialSiteName: string
  initialContactEmail: string
}

export function GeneralSettingsForm({ initialSiteName, initialContactEmail }: GeneralSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setErrors({})

    const result = await updateGeneralSettings(formData)

    if ('success' in result) {
      toast.success('Настройки сохранены')
    } else {
      setErrors(result.errors)
      const message = 'general' in result.errors ? result.errors.general[0] : 'Проверьте поля формы'
      toast.error(message)
    }

    setIsLoading(false)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="siteName">Название сайта</Label>
        <Input id="siteName" name="siteName" defaultValue={initialSiteName} required />
        {errors.siteName && <p className="text-sm text-red-600">{errors.siteName[0]}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="contactEmail">Контактный email</Label>
        <Input id="contactEmail" name="contactEmail" type="email" defaultValue={initialContactEmail} required />
        {errors.contactEmail && <p className="text-sm text-red-600">{errors.contactEmail[0]}</p>}
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
