import { Suspense } from "react"
import { PrismaClient } from '@prisma/client'
import { CreateArticleForm } from "@/components/admin/CreateArticleForm"

const prisma = new PrismaClient()

async function getServices() {
  return await prisma.service.findMany({
    select: { id: true, title: true },
    orderBy: { title: 'asc' }
  })
}

function CreateArticleFormSkeleton() {
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

async function CreateArticleFormWrapper() {
  const services = await getServices()
  
  return <CreateArticleForm services={services} />
}

export default function CreateArticlePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Article</h1>
        <p className="text-gray-600">
          Create a new article with rich content, tags, and file attachments.
        </p>
      </div>

      <Suspense fallback={<CreateArticleFormSkeleton />}>
        <CreateArticleFormWrapper />
      </Suspense>
    </div>
  )
}