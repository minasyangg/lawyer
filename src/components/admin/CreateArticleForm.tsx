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
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { generateSlug, isValidSlug } from "@/lib/utils/slug-utils"
import { useCallback, useRef } from "react"
import { createArticle } from "@/lib/actions/article-actions"

interface Service {
  id: number
  title: string
}

interface Tag {
  id: number
  name: string
  slug: string
  color?: string
}

interface CreateArticleFormProps {
  services: Service[]
  redirectPath?: string
  userRole?: 'ADMIN' | 'EDITOR'
}

type CheckSlugResponse = {
  success: boolean
  available: boolean
  message?: string
}

export function CreateArticleForm({ 
  services: initialServices, 
  redirectPath = '/admin/articles',
  userRole = 'ADMIN'
}: CreateArticleFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [slug, setSlug] = useState("")
  const [published, setPublished] = useState(false)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Array<{
    id: number
    name: string
    size: number
    mimeType: string
  }>>([])

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

  // Функция для открытия файлового менеджера для выбора файлов статьи
  const openFileManagerForArticle = () => {
    setFileManagerOpen(true)
    window.fileManagerSelectCallback = (selectedFile: { id: number; url: string; originalName: string; mimeType: string }) => {
      if (selectedFile && !selectedFiles.find(f => f.id === selectedFile.id)) {
        setSelectedFiles(prev => [...prev, {
          id: selectedFile.id,
          name: selectedFile.originalName,
          size: 0, // Размер файла не доступен в callback
          mimeType: selectedFile.mimeType
        }])
      }
      setFileManagerOpen(false)
    }
  }

  // Функция для удаления файла из списка
  const removeFile = (fileId: number) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // Функция для форматирования размера файла
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

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
      const formData = new FormData()
      formData.append('title', title)
      formData.append('content', content)
      if (excerpt) formData.append('excerpt', excerpt)
      formData.append('slug', slug)
      if (published) formData.append('published', 'on')
      if (categoryId) formData.append('categoryId', categoryId.toString())
      
      // Добавляем теги
      selectedTags.forEach(tag => {
        formData.append('tagIds', tag.id.toString())
      })

      // Добавляем файлы
      selectedFiles.forEach(file => {
        formData.append('fileIds', file.id.toString())
      })

      const result = await createArticle(formData)

      if ('success' in result && result.success) {
        toast.success('Статья создана успешно')
        router.push(redirectPath)
      } else if ('errors' in result) {
        if (result.errors.general) {
          toast.error(result.errors.general[0] || 'Ошибка при создании статьи')
        } else {
          toast.error('Ошибка при создании статьи')
        }
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

          <Card>
            <CardHeader>
              <CardTitle>Документы к статье</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={openFileManagerForArticle}
                className="w-full"
              >
                Добавить документ
              </Button>
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-medium">
                            {file.mimeType.split('/')[0].toUpperCase().substring(0, 3)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Удалить
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? 'Создание...' : 'Создать статью'}
        </Button>
      </div>

      <FileManager
        isOpen={fileManagerOpen}
        onClose={() => setFileManagerOpen(false)}
        selectMode={false}
        userRole={userRole}
      />
    </form>
  )
}