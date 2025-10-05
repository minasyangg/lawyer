import { Suspense } from "react"
import { ArticleTable } from "@/components/admin/ArticleTable"
import { getArticles } from "@/lib/actions/article-actions"
import { getUsers } from "@/lib/actions/user-actions"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getServices() {
  return await prisma.service.findMany({
    select: { id: true, title: true },
    orderBy: { title: 'asc' }
  })
}

function ArticleTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mt-1 animate-pulse"></div>
        </div>
        <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

async function ArticleTableWrapper() {
  const [articles, services, users] = await Promise.all([
    getArticles(),
    getServices(),
    getUsers()
  ])
  
  return <ArticleTable articles={articles} services={services} users={users} />
}

export default function ArticlesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Articles</h1>
        <p className="text-gray-600">
          Create and manage articles for your website. Articles can be categorized by service types.
        </p>
      </div>

      <Suspense fallback={<ArticleTableSkeleton />}>
        <ArticleTableWrapper />
      </Suspense>
    </div>
  )
}