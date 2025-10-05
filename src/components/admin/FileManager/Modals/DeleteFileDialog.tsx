"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Shield, FileText } from "lucide-react"

interface DeleteFileDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  fileName?: string
  isProtected?: boolean
  usedIn?: Array<{ id: number; title: string; type: 'content' | 'document' }>
  userRole?: 'ADMIN' | 'EDITOR' | 'USER'
}

export function DeleteFileDialog({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  isProtected = false,
  usedIn = [],
  userRole = 'USER'
}: DeleteFileDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
      onClose()
    }
  }

  const canDelete = userRole === 'ADMIN' || (userRole === 'EDITOR' && !isProtected)
  const isUsed = usedIn.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Подтвердите удаление файла
          </DialogTitle>
          {fileName && (
            <div className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Файл: {fileName}</span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Статус защиты файла */}
          {isProtected && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Shield className="h-4 w-4 text-amber-600" />
              <div className="text-sm">
                <div className="font-medium text-amber-800">Защищенный файл</div>
                <div className="text-amber-700">
                  Этот файл используется в статьях и защищен от случайного удаления
                </div>
              </div>
            </div>
          )}

          {/* Список статей где используется */}
          {isUsed && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">
                Файл используется в следующих статьях:
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {usedIn.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm"
                  >
                    <FileText className="h-3 w-3 text-gray-500" />
                    <span className="truncate">{article.title}</span>
                    <span className="text-xs text-gray-500 capitalize">
                      ({article.type})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Предупреждения в зависимости от роли */}
          {!canDelete && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-800">
                <div className="font-medium">Недостаточно прав</div>
                <div>
                  Вы не можете удалить этот защищенный файл. 
                  Обратитесь к администратору.
                </div>
              </div>
            </div>
          )}

          {canDelete && isUsed && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-800">
                <div className="font-medium">Внимание!</div>
                <div>
                  Удаление этого файла может нарушить отображение статей. 
                  Убедитесь, что он больше не нужен.
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Отмена
          </Button>
          {canDelete && (
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Удаление..." : "Удалить файл"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}