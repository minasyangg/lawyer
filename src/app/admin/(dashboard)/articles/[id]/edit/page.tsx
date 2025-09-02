import { Suspense } from "react"
import { getUsers } from "@/lib/actions/user-actions"
import { getArticleById } from "@/lib/actions/article-actions"
import { PrismaClient } from '@prisma/client'
import { EditArticleForm } from "@/components/admin/EditArticleForm"
import { notFound } from "next/navigation"

const prisma = new PrismaClient()

async function getServices() {
  return await prisma.service.findMany({
    select: { id: true, title: true },
    orderBy: { title: 'asc' }
  })
}

interface PageProps {
  params: Promise<{ id: string }>
}

function EditArticleFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mt-2 animate-pulse"></div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function EditArticleFormWrapper({ articleId }: { articleId: number }) {
  const [services, users, article] = await Promise.all([
    getServices(),
    getUsers(),
    getArticleById(articleId)
  ])
  
  if (!article) {
    notFound()
  }
  
  return <EditArticleForm article={article} services={services} users={users} />
}

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params
  const articleId = parseInt(id)

  if (isNaN(articleId)) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Article</h1>
        <p className="text-gray-600">
          Edit article content, tags, and file attachments.
        </p>
      </div>

      <Suspense fallback={<EditArticleFormSkeleton />}>
        <EditArticleFormWrapper articleId={articleId} />
      </Suspense>
    </div>
  )
}