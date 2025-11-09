"use client"

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Гарантируем установку cookie и отсутствие кеша
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Login failed')
        setLoading(false)
        return
      }

      // Учитываем параметр next, если пришли с защищённого маршрута
      const nextParam = searchParams?.get('next')
      const target = nextParam || data?.redirectUrl || '/'

      // Небольшая микрозадержка, чтобы браузер применил Set-Cookie перед переходом
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = target
        } else {
          router.replace(target)
        }
      }, 15)
    } catch (err) {
      console.error('Login error:', err)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/')}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-700 hover:underline"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          На главную
        </button>
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-6">Вход в админку</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded mt-2 disabled:opacity-50"
          >
            {loading ? 'Вхожу...' : 'Войти'}
          </button>
        </form>
        </div>
      </div>
    </div>
  )
}
