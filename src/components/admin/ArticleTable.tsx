"use client"

import { Edit, Trash2, Plus, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DeleteArticleDialog } from "./DeleteArticleDialog"
import { Article } from "@/lib/actions/article-actions"
import { useState } from "react"
import { toggleArticlePublished } from "@/lib/actions/article-actions"
import { toast } from "sonner"

type ActionResult =
  | { success: true }
  | { errors: { [key: string]: string[] } | { general: string[] } }
import Link from "next/link"

interface ArticleTableProps {
  articles: Article[]
  services: { id: number; title: string }[]
  users: { id: number; name: string }[]
}

export function ArticleTable({ articles }: ArticleTableProps) {
  const [deleteArticle, setDeleteArticle] = useState<Article | null>(null)
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set())

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const handleTogglePublished = async (id: number) => {
    if (togglingIds.has(id)) return

    setTogglingIds(prev => new Set(prev).add(id))
    try {
      const result: ActionResult = await toggleArticlePublished(id) as ActionResult

      if ('errors' in result) {
        const message = 'general' in result.errors ? result.errors.general[0] : 'Не удалось изменить статус статьи'
        toast.error(message)
      }
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Управление статьями</h3>
          <p className="text-sm text-gray-600">Создание и редактирование статей сайта</p>
        </div>
        <Link href="/admin/articles/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Добавить статью
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Заголовок</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Автор</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Создана</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Статьи не найдены. Создайте первую статью.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => {
                const isToggling = togglingIds.has(article.id)
                return (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{article.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {article.excerpt || 'Без краткого описания'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {article.category?.title || 'Без категории'}
                      </span>
                    </TableCell>
                    <TableCell>{article.author.name}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleTogglePublished(article.id)}
                        disabled={isToggling}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          article.published
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        } transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : article.published ? (
                          <Eye className="w-3 h-3 mr-1" />
                        ) : (
                          <EyeOff className="w-3 h-3 mr-1" />
                        )}
                        {article.published ? 'Опубликована' : 'Черновик'}
                      </button>
                    </TableCell>
                    <TableCell>{formatDate(article.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/articles/${article.id}/edit`}>
                          <Button variant="outline" size="sm" aria-label="Редактировать статью" title="Редактировать">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteArticle(article)}
                          aria-label="Удалить статью"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteArticleDialog
        open={!!deleteArticle}
        onOpenChange={() => setDeleteArticle(null)}
        article={deleteArticle}
      />
    </div>
  )
}
