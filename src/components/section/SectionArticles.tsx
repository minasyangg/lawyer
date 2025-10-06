import LoadingLink from '@/components/ui/LoadingLink'
import FallbackImage from '@/components/ui/FallbackImage'
import React from 'react'
import { getPublishedArticles } from '@/lib/actions/article-actions'

type Publication = {
  id: number
  title: string
  excerpt?: string | null
  slug: string
  date: string
  cover?: string | null
}

const ArticleIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M7 7h10M7 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const CalendarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const ArrowRight = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default async function SectionArticles() {
  const articles = await getPublishedArticles(undefined, 3)
  
  // Преобразуем статьи в формат Publication
  const posts: Publication[] = articles.map(article => ({
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    slug: article.slug,
    date: article.createdAt.toISOString(),
    cover: null // У статей пока нет поля coverImage
  }))
  
  // Layout: left column - stacked latest posts; right column - big image panel with heading and CTA
  const mainImage = posts[0]?.cover || null
  const stack = posts.slice(0, 3)

  return (
    <section className="w-full py-16 bg-white">
      <div className="container mx-auto max-w-screen-xl px-4">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="flex-1">
            <h2 className="font-semibold text-4xl md:text-5xl mb-8 premium-accent" style={{ fontFamily: 'Montserrat, Inter, Segoe UI, Arial, sans-serif' }}>
              Последние публикации
            </h2>

            <div className="space-y-4">
              {stack.length === 0 ? (
                <div className="text-gray-500">Публикаций пока нет.</div>
              ) : (
                stack.map((post) => (
                  <article
                    key={post.id}
                    className="group flex flex-col md:flex-row items-start gap-4 p-4 md:p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    aria-labelledby={`post-${post.id}`}
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <ArticleIcon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 id={`post-${post.id}`} className="text-lg font-semibold text-gray-900 mb-1 truncate">{post.title}</h3>
                      {post.excerpt && <p className="text-sm text-gray-600 mb-3 line-clamp-3">{post.excerpt}</p>}

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-gray-500 text-sm">
                          <span className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <time className="text-xs text-gray-500">{post.date}</time>
                          </span>
                        </div>

                        <LoadingLink href={`/publications/${post.slug}`} className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-200 rounded">
                          <span>Читать</span>
                          <ArrowRight className="w-4 h-4" />
                        </LoadingLink>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="w-full md:w-1/2 max-w-lg relative mt-6 md:mt-0">
            <div className="h-full rounded-lg overflow-hidden border border-gray-100" style={{ minHeight: 420 }}>
              {mainImage ? (
                <FallbackImage src={mainImage} alt="Новые публикации" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              ) : (
                <FallbackImage src={undefined} alt="Новые публикации" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              )}
            </div>

            <div className="absolute top-6 left-6">
              <h3 className="text-3xl md:text-4xl font-semibold text-black" style={{ fontFamily: 'Inter, Montserrat, Arial, sans-serif' }}>Новые публикации</h3>
            </div>

            <div className="absolute bottom-6 right-6">
              <LoadingLink href="/publications" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
                Прочие публикации
                <ArrowRight className="w-4 h-4 text-white" />
              </LoadingLink>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
