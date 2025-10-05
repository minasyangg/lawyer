"use client"

import React from 'react'
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  id: number | null
  name: string
  onClick: () => void
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <div className="flex items-center space-x-1 text-sm text-gray-600 mb-4">
      {items.map((item, index) => (
        <React.Fragment key={item.id || 'root'}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          <button
            onClick={item.onClick}
            className="flex items-center hover:text-blue-600 transition-colors"
          >
            {index === 0 && <Home className="w-4 h-4 mr-1" />}
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  )
}