"use client"

import { Edit, Trash2, Plus, Eye, EyeOff } from "lucide-react"
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
import Link from "next/link"

interface ArticleTableProps {
  articles: Article[]
  services: { id: number; title: string }[]
  users: { id: number; name: string }[]
}

export function ArticleTable({ articles }: ArticleTableProps) {
  const [deleteArticle, setDeleteArticle] = useState<Article | null>(null)

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
    await toggleArticlePublished(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Articles Management</h3>
          <p className="text-sm text-gray-600">Create and manage articles for your website</p>
        </div>
        <Link href="/admin/articles/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Article
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No articles found. Create your first article to get started.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{article.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {article.excerpt || 'No excerpt'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {article.category?.title || 'Uncategorized'}
                    </span>
                  </TableCell>
                  <TableCell>{article.author.name}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleTogglePublished(article.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        article.published
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      {article.published ? (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Draft
                        </>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>{formatDate(article.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/articles/${article.id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteArticle(article)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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