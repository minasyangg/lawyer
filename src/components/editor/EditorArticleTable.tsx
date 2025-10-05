"use client"

import { Edit, Trash2, Plus, Eye, EyeOff, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DeleteArticleDialog } from "@/components/admin/DeleteArticleDialog"
import { Article } from "@/lib/actions/article-actions"
import { useState } from "react"
import { toggleArticlePublished } from "@/lib/actions/article-actions"
import Link from "next/link"

type ActionResult = 
  | { success: true }
  | { errors: { [key: string]: string[] } | { general: string[] } }

interface EditorArticleTableProps {
  articles: Article[]
  services: { id: number; title: string }[]
  users: { id: number; name: string }[]
  currentUser: { id: number; name: string; email: string; role: string } | null
}

export function EditorArticleTable({ articles, currentUser }: EditorArticleTableProps) {
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
    const result: ActionResult = await toggleArticlePublished(id) as ActionResult
    
    if ('errors' in result) {
      console.error('Failed to toggle published status:', result.errors)
    }
  }

  // Разделяем статьи на собственные и чужие
  const ownArticles = articles.filter(article => article.authorId === currentUser?.id)
  const otherArticles = articles.filter(article => article.authorId !== currentUser?.id)

  const renderArticleRow = (article: Article, isOwn: boolean) => (
    <TableRow key={article.id}>
      <TableCell className="font-medium">
        <div className="flex items-center">
          {article.title}
          {!isOwn && <Lock className="ml-2 w-4 h-4 text-gray-400" />}
        </div>
      </TableCell>
      <TableCell>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          article.published 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {article.published ? 'Published' : 'Draft'}
        </span>
      </TableCell>
      <TableCell>{formatDate(article.createdAt)}</TableCell>
      <TableCell>{formatDate(article.updatedAt)}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {isOwn ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTogglePublished(article.id)}
              >
                {article.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm">
                <Link href={`/editor/articles/${article.id}/edit`} className="flex items-center">
                  <Edit className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteArticle(article)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm">
              <Link href={`/editor/articles/${article.id}`} className="flex items-center">
                <Eye className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
          <p className="text-sm text-gray-600">
            Manage your articles and view team content
          </p>
        </div>
        <Button>
          <Link href="/editor/articles/create" className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Link>
        </Button>
      </div>

      {/* My Articles */}
      {ownArticles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">My Articles</h3>
            <p className="text-sm text-gray-600">Articles you can edit and manage</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownArticles.map((article) => renderArticleRow(article, true))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Other Articles */}
      {otherArticles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Team Articles</h3>
            <p className="text-sm text-gray-600">Articles by other team members (view only)</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {otherArticles.map((article) => renderArticleRow(article, false))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty State */}
      {ownArticles.length === 0 && otherArticles.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first article.</p>
          <Button>
            <Link href="/editor/articles/create" className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Create Article
            </Link>
          </Button>
        </div>
      )}

      {/* Delete Dialog */}
      <DeleteArticleDialog
        open={!!deleteArticle}
        onOpenChange={(open) => !open && setDeleteArticle(null)}
        article={deleteArticle}
      />
    </div>
  )
}