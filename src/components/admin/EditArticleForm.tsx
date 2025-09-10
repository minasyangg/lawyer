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
import DynamicRichTextEditor from "./DynamicRichTextEditor"
import { TagSelector } from "./TagSelector"
import { FileManager } from "./FileManager"
import { DocumentManager } from "./DocumentManager"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Article } from "@/lib/actions/article-actions"
import { updateArticle } from "@/lib/actions/article-actions"
import { generateSlug, isValidSlug } from "@/lib/utils/slug-utils"
import { useCallback, useRef } from "react"

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
  const [title, setTitle] = useState(article.title || "")
  const [content, setContent] = useState(article.content || "")
  const [excerpt, setExcerpt] = useState(article.excerpt || "")
  const [slug, setSlug] = useState(article.slug || "")
  const [published, setPublished] = useState(article.published || false)
  const [categoryId, setCategoryId] = useState<number | null>(article.categoryId)
  const [selectedTags, setSelectedTags] = useState<Tag[]>(
    article.tags.map(tag => ({
      ...tag,
      color: tag.color || undefined
    }))
  )
interface DocumentItem {
  id: number
  name: string
  url: string
  size: number
  mimeType: string
}

  const [documents, setDocuments] = useState<DocumentItem[]>(
    Array.isArray(article.documents) ? article.documents : []
  )
  const [services] = useState<Service[]>(initialServices)
  const [loading, setLoading] = useState(false)
  const [fileManagerOpen, setFileManagerOpen] = useState(false)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const slugCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const router = useRouter()

  type CheckSlugResponse = {
    success: boolean
    available: boolean
    message?: string
  }

  const checkSlugAvailability = useCallback(async (slugToCheck: string): Promise<void> => {
    if (!slugToCheck.trim() || !isValidSlug(slugToCheck)) return

    setIsCheckingSlug(true)
    
    try {
      const response = await fetch('/api/articles/check-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugToCheck, excludeId: article.id })
      })
      
      const data: CheckSlugResponse = await response.json()
      
      if (data.success && !data.available && data.message) {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Ошибка проверки slug:', error)
    } finally {
      setIsCheckingSlug(false)
    }
  }, [article.id])

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
    setDocuments(
      Array.isArray(article.documents) ? article.documents : []
    )
  }, [article])

  useEffect(() => {
    if (title) {
      const generatedSlug = generateSlug(title)
      if (generatedSlug && generatedSlug !== slug) {
        setSlug(generatedSlug)
        
        if (slugCheckTimeoutRef.current) {
          clearTimeout(slugCheckTimeoutRef.current)
        }
        
        slugCheckTimeoutRef.current = setTimeout(() => {
          checkSlugAvailability(generatedSlug)
        }, 1000)
      }
    }
  }, [title, slug, checkSlugAvailability])

  useEffect(() => {
    const handleOpenFileManager = (event: CustomEvent) => {
      const { selectMode, onSelect } = event.detail || {}
      setFileManagerOpen(true)
      // Сохраняем коллбэк для выбора файла
      if (selectMode && onSelect) {
        window.fileManagerSelectCallback = onSelect
      }
    }

    window.addEventListener('openFileManager', handleOpenFileManager as EventListener)
    return () => {
      window.removeEventListener('openFileManager', handleOpenFileManager as EventListener)
      if (slugCheckTimeoutRef.current) {
        clearTimeout(slugCheckTimeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Дебаг: проверяем что именно триггерит submit
    console.log('Form submitted, event target:', e.target, 'nativeEvent:', e.nativeEvent)
    
    if (!title || !content || !slug) {
      toast.error('Заполните все обязательные поля')
      return
    }

    setLoading(true)

    try {
      // Создаем FormData для Server Action
      const formData = new FormData()
      formData.append('title', title)
      formData.append('content', content)
      formData.append('excerpt', excerpt || '')
      formData.append('slug', slug)
      formData.append('published', published ? 'on' : 'off')
      formData.append('authorId', article.authorId.toString())
      if (categoryId) {
        formData.append('categoryId', categoryId.toString())
      }
      
      // Добавляем теги
      selectedTags.forEach(tag => {
        formData.append('tagIds', tag.id.toString())
      })
      
      // Добавляем документы
      if (documents.length > 0) {
        formData.append('documents', JSON.stringify(documents))
      }

      // Используем Server Action вместо fetch
      const result = await updateArticle(article.id, formData)

      if ('success' in result && result.success) {
        toast.success('Статья обновлена успешно')
        // Редирект обратно в список статей
        router.push('/admin/articles')
      } else if ('errors' in result) {
        if (result.errors.general) {
          toast.error(result.errors.general[0])
        } else {
          const errorMessages = Object.values(result.errors).flat()
          toast.error(errorMessages.join(', '))
        }
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
    <>
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
                  <Label htmlFor="slug">
                    Слаг * 
                    {isCheckingSlug && (
                      <span className="ml-2 text-xs text-gray-500">проверяется...</span>
                    )}
                  </Label>
                  <Input
                    id="slug"
                    value={slug}
                    readOnly
                    placeholder="url-статьи (генерируется автоматически)"
                    required
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  {slug && !isValidSlug(slug) && (
                    <p className="text-xs text-red-600 mt-1">
                      Слаг может содержать только латинские буквы, цифры и дефисы
                    </p>
                  )}
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
                <DynamicRichTextEditor
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
                  value={categoryId ? services.find(s => s.id === categoryId)?.title || "" : ""} 
                  onValueChange={(value) => {
                    if (!value) {
                      setCategoryId(null)
                    } else {
                      const selectedService = services.find(s => s.title === value)
                      setCategoryId(selectedService ? selectedService.id : null)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Без категории</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.title}>
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

            <DocumentManager
              documents={documents}
              onDocumentsChange={setDocuments}
            />
          </div>
        </div>
      </form>
      <FileManager
        isOpen={fileManagerOpen}
        onClose={() => setFileManagerOpen(false)}
        selectMode={false}
      />
    </>
  )
}