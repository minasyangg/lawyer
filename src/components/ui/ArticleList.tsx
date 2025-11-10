"use client"

import Link from "next/link"
import { Calendar, User, Tag, ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Article } from "@/lib/actions/article-actions"
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ArticleListProps {
  initialArticles: Article[]
  total: number
  pageSize: number
  services: { id: number; title: string }[]
}

function CategoryFilter({
  services,
  filterLoading,
  onStartLoading
}: {
  services: { id: number; title: string }[]
  filterLoading: boolean
  onStartLoading: () => void
}) {
  // Управляем фильтром через URL, чтобы работать с серверной пагинацией
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams?.get('category') ?? 'all'
  const currentLabel = current === 'all' 
    ? 'Все' 
    : (services.find(s => s.id.toString() === current)?.title ?? 'Категория')

  const handleChange = (value: string) => {
    // Сигнализируем родителю о начале загрузки новой категории
    onStartLoading?.()
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    // При смене категории возвращаемся на первую страницу
    params.delete('page')
    router.push(`/publications${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className={`w-64 cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-blue-200 transition-colors pl-3 pr-2 flex items-center justify-between gap-2 ${filterLoading ? 'opacity-70 pointer-events-none' : ''}`}>
        <span className="truncate text-left flex-1 flex items-center gap-2">
          {filterLoading && (
            <svg className="h-4 w-4 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          )}
          {currentLabel}
        </span>
        {!filterLoading }
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 rounded-md shadow-md">
        <SelectItem value="all" className="cursor-pointer hover:bg-gray-100">
          Все
        </SelectItem>
        {services.map((service) => (
          <SelectItem
            key={service.id}
            value={service.id.toString()}
            className="cursor-pointer hover:bg-gray-100"
          >
            {service.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ArticleCard({ article }: { article: Article }) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  return (
    <article className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 overflow-hidden h-full">
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          {article.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200">
              <Tag className="w-3 h-3 mr-1" />
              {article.category.title}
            </span>
          )}
        </div>
        
        <h2 className="text-[18px] md:text-[19px] lg:text-[20px] font-bold text-gray-900 mb-3 line-clamp-2 leading-snug">
          <Link 
            href={`/publications/${article.slug}`}
            className="hover:text-blue-600 transition-colors"
          >
            {article.title}
          </Link>
        </h2>
        
        {article.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3 text-[14px] leading-relaxed">
            {article.excerpt}
          </p>
        )}

        {/* Информация об авторе и дате */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{article.author.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(article.createdAt)}</span>
          </div>
        </div>

        {/* Кнопка «Читать далее» на отдельной строке справа снизу */}
        <div className="mt-3 flex justify-end">
          <Link 
            href={`/publications/${article.slug}`}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
          >
            Читать далее
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  )
}

export function ArticleList({ initialArticles, total, pageSize, services }: ArticleListProps) {
  // Клиентская подгрузка: показываем начальные статьи и добавляем следующими порциями
  const [items, setItems] = useState<Article[]>(initialArticles)
  const [page, setPage] = useState<number>(1)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [filterLoading, setFilterLoading] = useState<boolean>(false)
  const searchParams = useSearchParams()
  const category = searchParams?.get('category')

  // Если меняется категория в URL (навигация), сбрасываем состояние к начальному (на свежем рендере придут новые initialArticles)
  useEffect(() => {
    // Когда пришли новые initialArticles (смена категории завершена) сбрасываем состояние
    setItems(initialArticles)
    setPage(1)
    setFilterLoading(false)
  }, [initialArticles])

  const hasMore = items.length < total

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      params.set('page', String(page + 1))
      params.set('pageSize', String(pageSize))

      const res = await fetch(`/api/publications/list?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (Array.isArray(data.items)) {
        setItems((prev: Article[]) => [...prev, ...data.items as Article[]])
        setPage((prev: number) => prev + 1)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex flex-col gap-1 w-full sm:w-64">
            <label className="text-sm text-gray-600">Выберете категорию статей</label>
            <CategoryFilter
              services={services}
              filterLoading={filterLoading}
              onStartLoading={() => setFilterLoading(true)}
            />
          </div>
        </div>
      </div>

      {/* Articles Grid */}
  {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Публикации не найдены</h3>
            <p className="text-gray-600">
              Нет опубликованных материалов для выбранных критериев.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 cursor-pointer transition-colors ${loadingMore ? 'animate-pulse' : ''}`}
              >
                {loadingMore ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span>Загружаю…</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                    <span>Показать ещё</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}