"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createUser, updateUser, User } from "@/lib/actions/user-actions"

const ROLE_LABELS: Record<string, string> = {
  USER: 'Пользователь',
  EDITOR: 'Редактор',
  ADMIN: 'Администратор',
}

function RoleSelect({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue)

  return (
    <>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger>
          <SelectValue placeholder="Выберите роль">{ROLE_LABELS[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="USER">{ROLE_LABELS.USER}</SelectItem>
          <SelectItem value="EDITOR">{ROLE_LABELS.EDITOR}</SelectItem>
          <SelectItem value="ADMIN">{ROLE_LABELS.ADMIN}</SelectItem>
        </SelectContent>
      </Select>
      <input type="hidden" name="userRole" value={value} />
    </>
  )
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const isEditing = !!user

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setErrors({})

    try {
      let result
      if (isEditing && user) {
        result = await updateUser(user.id, formData)
      } else {
        result = await createUser(formData)
      }

      if (result.success) {
        onOpenChange(false)
      } else if (result.errors) {
        setErrors(result.errors)
      }
    } catch {
      setErrors({ general: ['Что-то пошло не так'] })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Редактировать пользователя' : 'Новый пользователь'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user?.name || ''}
                placeholder="Введите имя пользователя"
                required
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name[0]}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user?.email || ''}
                placeholder="Введите email"
                required
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email[0]}</p>
              )}
            </div>

            {!isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Введите пароль"
                  required
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password[0]}</p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="role">Роль</Label>
              <RoleSelect defaultValue={user?.userRole || 'USER'} />
              {errors.userRole && (
                <p className="text-sm text-red-600">{errors.userRole[0]}</p>
              )}
            </div>

            {errors.general && (
              <p className="text-sm text-red-600">{errors.general[0]}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[110px]">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : isEditing ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
