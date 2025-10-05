import { Suspense } from "react"
import { getArticleById } from "@/lib/actions/article-actions"
import { PrismaClient } from '@prisma/client'
import { EditArticleForm } from "@/components/admin/EditArticleForm"
import { notFound } from "next/navigation"

const prisma = new PrismaClient()

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
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function EditArticleFormWrapper({ id }: { id: number }) {
  const [article, services] = await Promise.all([
    getArticleById(id),
    prisma.service.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        extraInfo: true,
        heroImage: true
      },
      orderBy: { title: 'asc' }
    })
  ])

  if (!article) {
    notFound()
  }

  return (
    <EditArticleForm 
      article={article}
      services={services} 
      redirectPath="/editor/articles"
    />
  )
}

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params
  const articleId = parseInt(id)

  if (isNaN(articleId)) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
        <p className="text-gray-600 mt-1">
          Update your article content and settings
        </p>
      </div>

      <Suspense fallback={<EditArticleFormSkeleton />}>
        <EditArticleFormWrapper id={articleId} />
      </Suspense>
    </div>
  )
}