"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = React.PropsWithChildren<{
  href: string
  className?: string
  prefetch?: boolean
}>

export default function LoadingLink({ href, className = '', children }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      await router.push(href)
    } finally {
      // keep spinner until navigation happens; router.push will navigate away
    }
  }

  return (
    <button
      onClick={handleClick}
      className={className}
      aria-busy={loading}
      aria-label={typeof children === 'string' ? children : undefined}
      disabled={loading}
    >
      <span className="inline-flex items-center gap-2">
        {children}
        {loading && (
          <svg className="animate-spin w-4 h-4 text-current" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
      </span>
    </button>
  )
}
