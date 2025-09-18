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
import { AlertTriangle, Shield, Folder } from "lucide-react"

interface DeleteFolderDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  folderName?: string
  hasProtectedFiles?: boolean
  fileCount?: number
  folderCount?: number
  userRole?: 'ADMIN' | 'EDITOR' | 'USER'
}

export function DeleteFolderDialog({
  isOpen,
  onClose,
  onConfirm,
  folderName,
  hasProtectedFiles = false,
  fileCount = 0,
  folderCount = 0,
  userRole = 'USER'
}: DeleteFolderDialogProps) {
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

  const canDelete = userRole === 'ADMIN' || (userRole === 'EDITOR' && !hasProtectedFiles)
  const hasContent = fileCount > 0 || folderCount > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Подтвердите удаление папки
          </DialogTitle>
          {folderName && (
            <div className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Папка: {folderName}</span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Содержимое папки */}
          {hasContent && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Folder className="h-4 w-4 text-blue-600" />
              <div className="text-sm">
                <div className="font-medium text-blue-800">Содержимое папки</div>
                <div className="text-blue-700">
                  {fileCount > 0 && `${fileCount} файл(ов)`}
                  {fileCount > 0 && folderCount > 0 && ', '}
                  {folderCount > 0 && `${folderCount} папок(и)`}
                </div>
              </div>
            </div>
          )}

          {/* Предупреждение о защищенных файлах */}
          {hasProtectedFiles && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Shield className="h-4 w-4 text-amber-600" />
              <div className="text-sm">
                <div className="font-medium text-amber-800">Защищенные файлы</div>
                <div className="text-amber-700">
                  Папка содержит файлы, которые используются в статьях и защищены от удаления
                </div>
              </div>
            </div>
          )}

          {/* Предупреждения в зависимости от роли */}
          {!canDelete && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-800">
                <div className="font-medium">Недостаточно прав</div>
                <div>
                  Вы не можете удалить эту папку, так как она содержит защищенные файлы. 
                  Обратитесь к администратору.
                </div>
              </div>
            </div>
          )}

          {canDelete && hasProtectedFiles && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-800">
                <div className="font-medium">Внимание!</div>
                <div>
                  Удаление этой папки приведет к удалению всех файлов, включая защищенные. 
                  Это может нарушить отображение статей. Убедитесь, что они больше не нужны.
                </div>
              </div>
            </div>
          )}

          {canDelete && hasContent && !hasProtectedFiles && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm text-orange-800">
                <div className="font-medium">Внимание!</div>
                <div>
                  Все содержимое папки будет удалено безвозвратно.
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
              {isDeleting ? "Удаление..." : "Удалить папку"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}