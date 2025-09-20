"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { folderNameValidationSchema, getFolderNamePreview } from '@/lib/validations/folder'
import { toast } from 'sonner'
import { renameFolder } from '@/app/actions/filemanager'

interface RenameFolderModalProps {
  isOpen: boolean
  onClose: () => void
  folderId: number
  currentName: string
  onSuccess: () => void
}

export function RenameFolderModal({
  isOpen,
  onClose,
  folderId,
  currentName,
  onSuccess,
}: RenameFolderModalProps) {
  const [newName, setNewName] = useState(currentName)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  // Проверяем транслитерацию при изменении имени
  const handleNameChange = (value: string) => {
    setNewName(value)
    setError(null)
    setWarning(null)
    
    if (value.trim()) {
      const preview = getFolderNamePreview(value)
      if (!preview.isValid) {
        setError(preview.error || 'Некорректное название папки')
      } else if (preview.warning) {
        setWarning(preview.warning)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Валидация на клиенте
    const validation = folderNameValidationSchema.safeParse(newName.trim())
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Недопустимое название папки')
      return
    }

    if (newName.trim() === currentName) {
      onClose()
      return
    }

    setIsLoading(true)

    try {
      const result = await renameFolder(folderId, newName.trim())

      if (result.success) {
        toast.success('Папка успешно переименована')
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Ошибка при переименовании папки')
      }
    } catch (err) {
      console.error('Rename folder error:', err)
      setError('Произошла ошибка при переименовании папки')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setNewName(currentName)
      setError(null)
      setWarning(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Переименовать папку</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Введите новое название для папки &quot;{currentName}&quot;
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folder-name" className="text-right">
                Название
              </Label>
              <Input
                id="folder-name"
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="col-span-3"
                placeholder="Введите название папки"
                disabled={isLoading}
                autoFocus
              />
            </div>
            {warning && (
              <div className="text-sm text-yellow-600 mt-2">
                ⚠️ {warning}
              </div>
            )}
            {error && (
              <div className="text-sm text-red-600 mt-2">
                {error}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !newName.trim() || newName.trim() === currentName}
              className="cursor-pointer"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Переименовать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}