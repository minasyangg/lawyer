"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, User, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Article } from "@/lib/actions/article-actions"

interface ArticleListProps {
  articles: Article[]
  services: { id: number; title: string }[]
}

function CategoryFilter({ 
  services, 
  selectedCategory, 
  onCategoryChange 
}: {
  services: { id: number; title: string }[]
  selectedCategory: string
  onCategoryChange: (value: string) => void
}) {
  return (
    <Select value={selectedCategory} onValueChange={onCategoryChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Filter by category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {services.map((service) => (
          <SelectItem key={service.id} value={service.id.toString()}>
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
    <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          {article.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Tag className="w-3 h-3 mr-1" />
              {article.category.title}
            </span>
          )}
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          <Link 
            href={`/publications/${article.slug}`}
            className="hover:text-blue-600 transition-colors"
          >
            {article.title}
          </Link>
        </h2>
        
        {article.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {article.excerpt}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{article.author.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(article.createdAt)}</span>
            </div>
          </div>
          
          <Link 
            href={`/publications/${article.slug}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Read more →
          </Link>
        </div>
      </div>
    </article>
  )
}

export function ArticleList({ articles, services }: ArticleListProps) {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [displayLimit, setDisplayLimit] = useState(12)

  const filteredArticles = articles.filter(article => {
    if (selectedCategory === "all") return true
    return article.categoryId?.toString() === selectedCategory
  })

  const displayedArticles = filteredArticles.slice(0, displayLimit)
  const hasMore = filteredArticles.length > displayLimit

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 12)
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <CategoryFilter 
            services={services}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {displayedArticles.length} of {filteredArticles.length} articles
        </div>
      </div>

      {/* Articles Grid */}
      {displayedArticles.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">
              {selectedCategory === "all" 
                ? "There are no published articles yet." 
                : "No articles found for the selected category. Try selecting a different category or view all articles."
              }
            </p>
            {selectedCategory !== "all" && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedCategory("all")}
                className="mt-4"
              >
                Show All Articles
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <Button onClick={handleLoadMore} variant="outline">
                Load More Articles
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}