import { Suspense } from "react"
import { EditorArticleTable } from "@/components/editor/EditorArticleTable"
import { getArticles } from "@/lib/actions/article-actions"
import { getUsers } from "@/lib/actions/user-actions"
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

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
  // Получаем текущего пользователя из сессии
  const cookieStore = await cookies()
  const session = cookieStore.get('admin-session')
  let currentUser = null
  
  if (session) {
    try {
      currentUser = JSON.parse(session.value)
    } catch (error) {
      console.error('Error parsing session:', error)
    }
  }

  const [articles, services, users] = await Promise.all([
    getArticles(),
    getServices(),
    getUsers()
  ])

  return (
    <EditorArticleTable 
      articles={articles} 
      services={services} 
      users={users}
      currentUser={currentUser}
    />
  )
}

export default function EditorArticlesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Article Management</h1>
        <p className="text-gray-600 mt-1">
          Manage your articles and view others&apos; published content
        </p>
      </div>

      <Suspense fallback={<ArticleTableSkeleton />}>
        <ArticleTableWrapper />
      </Suspense>
    </div>
  )
}