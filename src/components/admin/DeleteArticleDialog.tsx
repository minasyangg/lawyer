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
import { deleteArticle, Article } from "@/lib/actions/article-actions"

type ActionResult =
  | { success: true }
  | { errors: { [key: string]: string[] } | { general: string[] } }

interface DeleteArticleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: Article | null
}

export function DeleteArticleDialog({ open, onOpenChange, article }: DeleteArticleDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  if (!article) return null

  async function handleDelete() {
    if (!article) return

    setIsLoading(true)
    setError('')

    try {
      const result: ActionResult = await deleteArticle(article.id) as ActionResult

      if ('success' in result) {
        onOpenChange(false)
      } else if ('errors' in result) {
        const message = 'general' in result.errors ? result.errors.general[0] : 'Не удалось удалить статью'
        setError(message)
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
          <DialogTitle>Удалить статью</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Вы уверены, что хотите удалить статью <strong>{article.title}</strong>?
            Это действие нельзя отменить.
          </p>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm space-y-1">
              <p><strong>Заголовок:</strong> {article.title}</p>
              <p><strong>Автор:</strong> {article.author.name}</p>
              <p><strong>Статус:</strong> {article.published ? 'Опубликована' : 'Черновик'}</p>
              <p><strong>Категория:</strong> {article.category?.title || 'Без категории'}</p>
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
