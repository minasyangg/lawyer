'use client'

import { useRouter } from 'next/navigation'
import { useState, MouseEvent } from 'react'
import clsx from 'clsx'

export interface ContactRedirectButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  loadingLabel?: string
}

export default function ContactRedirectButton({
  children,
  className,
  loadingLabel = 'Загрузка...',
  disabled,
  onClick,
  ...rest
}: ContactRedirectButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isLoading) {
      event.preventDefault()
      return
    }

    onClick?.(event)

    if (event.defaultPrevented) {
      return
    }

    setIsLoading(true)
    router.push('/contacts')
  }

  return (
    <button
      type="button"
      {...rest}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={clsx('inline-flex items-center justify-center gap-2 transition-opacity focus:outline-none disabled:cursor-not-allowed disabled:opacity-70', className)}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-5 w-5 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
            />
          </svg>
          <span>{loadingLabel}</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
