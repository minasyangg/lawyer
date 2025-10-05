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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createArticle, updateArticle, Article } from "@/lib/actions/article-actions"

type ActionResult = 
  | { success: true }
  | { errors: { [key: string]: string[] } | { general: string[] } }

interface ArticleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: Article | null
  services: { id: number; title: string }[]
  users: { id: number; name: string }[]
}

function CategorySelect({ defaultValue, services }: { defaultValue?: number; services: { id: number; title: string }[] }) {
  const [value, setValue] = useState(defaultValue?.toString() || '')
  
  return (
    <>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Uncategorized</SelectItem>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id.toString()}>
              {service.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name="categoryId" value={value} />
    </>
  )
}

function AuthorSelect({ defaultValue, users }: { defaultValue?: number; users: { id: number; name: string }[] }) {
  const [value, setValue] = useState(defaultValue?.toString() || users[0]?.id.toString() || '')
  
  return (
    <>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger>
          <SelectValue placeholder="Select author" />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id.toString()}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name="authorId" value={value} />
    </>
  )
}

export function ArticleDialog({ open, onOpenChange, article, services, users }: ArticleDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const isEditing = !!article

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setErrors({})

    try {
      let result: ActionResult
      if (isEditing && article) {
        result = await updateArticle(article.id, formData) as ActionResult
      } else {
        result = await createArticle(formData) as ActionResult
      }

      if ('success' in result) {
        onOpenChange(false)
      } else if ('errors' in result) {
        setErrors(result.errors)
      }
    } catch {
      setErrors({ general: ['Something went wrong'] })
    } finally {
      setIsLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Article' : 'Create New Article'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={article?.title || ''}
                placeholder="Enter article title"
                required
                onChange={(e) => {
                  const slugInput = document.getElementById('slug') as HTMLInputElement
                  if (slugInput && !isEditing) {
                    slugInput.value = generateSlug(e.target.value)
                  }
                }}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title[0]}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={article?.slug || ''}
                placeholder="article-slug"
                required
              />
              {errors.slug && (
                <p className="text-sm text-red-600">{errors.slug[0]}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Input
                id="excerpt"
                name="excerpt"
                defaultValue={article?.excerpt || ''}
                placeholder="Brief description of the article"
              />
              {errors.excerpt && (
                <p className="text-sm text-red-600">{errors.excerpt[0]}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                name="content"
                className="min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={article?.content || ''}
                placeholder="Write your article content here..."
                required
              />
              {errors.content && (
                <p className="text-sm text-red-600">{errors.content[0]}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="categoryId">Category</Label>
                <CategorySelect 
                  defaultValue={article?.categoryId || undefined} 
                  services={services}
                />
                {errors.categoryId && (
                  <p className="text-sm text-red-600">{errors.categoryId[0]}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="authorId">Author</Label>
                <AuthorSelect 
                  defaultValue={article?.authorId} 
                  users={users}
                />
                {errors.authorId && (
                  <p className="text-sm text-red-600">{errors.authorId[0]}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="published"
                name="published"
                defaultChecked={article?.published || false}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="published">Publish immediately</Label>
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
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Article' : 'Create Article'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}