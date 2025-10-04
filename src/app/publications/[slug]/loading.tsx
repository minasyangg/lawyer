import React from 'react'

export default function LoadingArticle() {
  return (
    <div className="min-h-screen flex items-center justify-center py-24">
      <div className="w-full max-w-3xl p-6 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
        </div>
      </div>
    </div>
  )
}
