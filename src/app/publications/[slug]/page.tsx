import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, User, ArrowLeft, Tag } from 'lucide-react'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import { ArticleDocuments } from '@/components/ui/ArticleDocuments'
import { getArticleBySlug, getPublishedArticles } from '@/lib/actions/article-actions'

interface ArticlePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const articles = await getPublishedArticles()
  return articles.map((article) => ({
    slug: article.slug,
  }))
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  // Get related articles from the same category
  const relatedArticles = await getPublishedArticles(
    article.categoryId || undefined, 
    4
  ).then(articles => articles.filter(a => a.id !== article.id).slice(0, 3))

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <article className="container mx-auto max-w-4xl px-4 py-12">
          {/* Back Navigation */}
          <div className="mb-8">
            <Link 
              href="/publications"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Publications
            </Link>
          </div>

          {/* Article Header */}
          <header className="mb-8">
            {article.category && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Tag className="w-4 h-4 mr-2" />
                  {article.category.title}
                </span>
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>
            
            {article.excerpt && (
              <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                {article.excerpt}
              </p>
            )}
            
            <div className="flex items-center gap-6 text-gray-600 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="font-medium">{article.author.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <time dateTime={article.createdAt.toISOString()}>
                  {formatDate(article.createdAt)}
                </time>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="mb-12">
            <div 
              className="text-gray-800 leading-relaxed rich-text-content prose-custom"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>

          {/* Article Documents */}
          {article.files && article.files.length > 0 && (
            <ArticleDocuments documents={article.files} />
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className="border-t border-gray-200 pt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <article 
                    key={relatedArticle.id}
                    className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors"
                  >
                    {relatedArticle.category && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-3">
                        {relatedArticle.category.title}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold mb-3">
                      <Link 
                        href={`/publications/${relatedArticle.slug}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {relatedArticle.title}
                      </Link>
                    </h3>
                    {relatedArticle.excerpt && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {relatedArticle.excerpt}
                      </p>
                    )}
                    <div className="text-xs text-gray-500">
                      {formatDate(relatedArticle.createdAt)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
      
      <Footer />
    </div>
  )
}