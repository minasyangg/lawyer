import { Suspense } from "react"
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import { ArticleList } from '@/components/ui/ArticleList'
import { getPublishedArticlesPaginated } from '@/lib/actions/article-actions'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getServices() {
  return await prisma.service.findMany({
    select: { id: true, title: true },
    orderBy: { title: 'asc' }
  })
}

function ArticleListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
      ))}
    </div>
  )
}

async function ArticleListWrapper({ 
  params 
}: { 
  params: { category?: string } 
}) {
  const categoryId = params.category ? parseInt(params.category) : undefined
  const pageSize = 6

  // Загружаем только первую страницу — дальше подгрузка на клиенте
  const [{ items, total }, services] = await Promise.all([
    getPublishedArticlesPaginated(categoryId, 1, pageSize),
    getServices()
  ])

  return (
    <ArticleList 
      initialArticles={items} 
      total={total} 
      pageSize={pageSize}
      services={services} 
    />
  )
}

interface PublicationsPageProps {
  searchParams: Promise<{ category?: string; page?: string }>
}

export default async function PublicationsPage({ searchParams }: PublicationsPageProps) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="container mx-auto max-w-screen-xl px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Публикации</h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
              Актуальные статьи и разборы по ключевым правовым вопросам, практические кейсы и экспертные комментарии.
            </p>
          </div>

          <Suspense fallback={<ArticleListSkeleton />}>
            <ArticleListWrapper params={params} />
          </Suspense>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}