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
import { deleteUser, User } from "@/lib/actions/user-actions"

const ROLE_LABELS: Record<User['userRole'], string> = {
  ADMIN: 'Администратор',
  EDITOR: 'Редактор',
  USER: 'Пользователь',
}

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function DeleteUserDialog({ open, onOpenChange, user }: DeleteUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  if (!user) return null

  async function handleDelete() {
    if (!user) return

    setIsLoading(true)
    setError('')

    try {
      const result = await deleteUser(user.id)

      if (result.success) {
        onOpenChange(false)
      } else if (result.errors) {
        setError(result.errors.general?.[0] || 'Не удалось удалить пользователя')
      }
    } catch {
      setError('Что-то пошло не так')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Удалить пользователя</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Вы уверены, что хотите удалить пользователя <strong>{user.name}</strong>?
            Это действие нельзя отменить.
          </p>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm space-y-1">
              <p><strong>Имя:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Роль:</strong> {ROLE_LABELS[user.userRole]}</p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 mt-4">{error}</p>
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Удаление...
              </>
            ) : 'Удалить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
