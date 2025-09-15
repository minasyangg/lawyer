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

interface CreateArticleFormProps {
  services: Service[]
  users: User[]
  isEditor?: boolean
  redirectPath?: string
}

type CheckSlugResponse = {
  success: boolean
  available: boolean
  message?: string
}

export function CreateArticleForm({ 
  services: initialServices, 
  users, 
  isEditor = false, 
  redirectPath = '/admin/articles' 
}: CreateArticleFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [slug, setSlug] = useState("")
  const [published, setPublished] = useState(false)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])

interface DocumentItem {
  id: number
  name: string
  url: string
  size: number
  mimeType: string
}
  const [services] = useState<Service[]>(initialServices)
  const [loading, setLoading] = useState(false)
  const [fileManagerOpen, setFileManagerOpen] = useState(false)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const slugCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const router = useRouter()

  // Проверка уникальности slug
  const checkSlugAvailability = useCallback(async (slugToCheck: string): Promise<void> => {
    if (!slugToCheck.trim() || !isValidSlug(slugToCheck)) return

    setIsCheckingSlug(true)
    
    try {
      const response = await fetch('/api/articles/check-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugToCheck })
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
  }, [])

  // Автоматическая генерация slug из заголовка
  useEffect(() => {
    if (title) {
      const generatedSlug = generateSlug(title)
      if (generatedSlug && generatedSlug !== slug) {
        setSlug(generatedSlug)
        
        // Отменяем предыдущую проверку
        if (slugCheckTimeoutRef.current) {
          clearTimeout(slugCheckTimeoutRef.current)
        }
        
        // Проверяем уникальность с задержкой
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
      // Очищаем timeout при размонтировании
      if (slugCheckTimeoutRef.current) {
        clearTimeout(slugCheckTimeoutRef.current)
      }
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
      const response = await fetch('/api/articles', {
        method: 'POST',
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
          tagIds: selectedTags.map(tag => tag.id),
          documents: documents.length > 0 ? documents : null
        }),
      })

      if (response.ok) {
        toast.success('Статья создана успешно')
        router.push(redirectPath)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при создании статьи')
      }
    } catch (error) {
      console.error('Error creating article:', error)
      toast.error('Ошибка при создании статьи')
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

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Создание...' : 'Создать статью'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Отмена
                </Button>
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

      <FileManager
        isOpen={fileManagerOpen}
        onClose={() => setFileManagerOpen(false)}
        selectMode={false}
      />
    </form>
  )
}