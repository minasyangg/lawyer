"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { RichTextEditor } from "./RichTextEditor"
import { TagSelector } from "./TagSelector"
import { FileManager } from "./FileManager"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Article } from "@/lib/actions/article-actions"

interface Service {
  id: number
  title: string
}

interface User {
  id: number
  name: string
  email: string
}

interface Tag {
  id: number
  name: string
  slug: string
  color?: string
}


interface EditArticleFormProps {
  article: Article
  services: Service[]
  users: User[]
}

export function EditArticleForm({ article, services: initialServices }: EditArticleFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [slug, setSlug] = useState("")
  const [published, setPublished] = useState(false)
  const [categoryId, setCategoryId] = useState<number | null>(article.categoryId)
  const [selectedTags, setSelectedTags] = useState<Tag[]>(
    article.tags.map(tag => ({
      ...tag,
      color: tag.color || undefined
    }))
  )
  const [services] = useState<Service[]>(initialServices)
  const [loading, setLoading] = useState(false)
  const [fileManagerOpen, setFileManagerOpen] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    setTitle(article.title)
    setContent(article.content)
    setExcerpt(article.excerpt || "")
    setSlug(article.slug)
    setPublished(article.published)
    setCategoryId(article.categoryId)
    setSelectedTags(
      article.tags.map(tag => ({
        ...tag,
        color: tag.color || undefined
      }))
    )
  }, [article])

  useEffect(() => {
    const handleOpenFileManager = () => {
      setFileManagerOpen(true)
    }

    window.addEventListener('openFileManager', handleOpenFileManager)
    return () => {
      window.removeEventListener('openFileManager', handleOpenFileManager)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content || !slug) {
      toast.error('Заполните все обязательные поля')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || null,
          slug,
          published,
          categoryId,
          tagIds: selectedTags.map(tag => tag.id)
        }),
      })

      if (response.ok) {
        toast.success('Статья обновлена успешно')
        router.push('/admin/articles')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при обновлении статьи')
      }
    } catch (error) {
      console.error('Error updating article:', error)
      toast.error('Ошибка при обновлении статьи')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту статью? Это действие нельзя отменить.')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Статья удалена успешно')
        router.push('/admin/articles')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при удалении статьи')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      toast.error('Ошибка при удалении статьи')
    } finally {
      setLoading(false)
    }
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Заголовок *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите заголовок статьи"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Слаг *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="url-статьи"
                  required
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Краткое описание</Label>
                <Input
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Краткое описание для превью"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Содержание</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Начните писать статью..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Публикация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={published}
                  onCheckedChange={setPublished}
                />
                <Label htmlFor="published">Опубликовать</Label>
              </div>

              <div className="space-y-2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1"
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Категория</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={categoryId?.toString() || ""} 
                onValueChange={(value) => setCategoryId(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Без категории</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Теги</CardTitle>
            </CardHeader>
            <CardContent>
              <TagSelector
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <FileManager
        isOpen={fileManagerOpen}
        onClose={() => setFileManagerOpen(false)}
        selectMode={false}
      />
    </form>
  )
}