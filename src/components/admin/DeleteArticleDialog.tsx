"use client"

import { useState } from "react"
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
        setError(result.errors.general?.[0] || 'Failed to delete article')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Article</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete article <strong>{article.title}</strong>? 
            This action cannot be undone.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm">
              <p><strong>Title:</strong> {article.title}</p>
              <p><strong>Author:</strong> {article.author.name}</p>
              <p><strong>Status:</strong> {article.published ? 'Published' : 'Draft'}</p>
              <p><strong>Category:</strong> {article.category?.title || 'Uncategorized'}</p>
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
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Article'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}