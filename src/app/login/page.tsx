"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
// ...existing imports

interface FloatingInputProps {
  id: string
  name: string
  type: string
  label: string
  required?: boolean
}

function FloatingInput({ id, name, type, label, required }: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)

  const handleFocus = () => setIsFocused(true)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    setHasValue(e.target.value.length > 0)
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0)
  }

  const isLabelFloated = isFocused || hasValue

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder=""
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900"
      />
      <label
        htmlFor={id}
        className={`absolute left-4 transition-all duration-300 ease-in-out pointer-events-none ${
          isLabelFloated
            ? 'top-1 text-xs text-blue-600 font-medium transform -translate-y-0'
            : 'top-1/2 transform -translate-y-1/2 text-gray-500 text-base'
        }`}
      >
        {label}
      </label>
    </div>
  )
}

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
    console.log('Attempting login with:', { email, password: '***' })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()
      console.log('Login response:', { status: response.status, result })

      if (response.ok && result.success) {
        console.log('Login successful, redirecting...')

        // Перенаправляем в зависимости от роли, привязанной к аккаунту
        const userRole = result.user.userRole
        if (userRole === 'ADMIN') {
          router.push('/admin')
        } else if (userRole === 'EDITOR') {
          router.push('/editor')
        } else {
          // Для обычного пользователя перенаправляем в личный кабинет
          router.push('/client')
        }

        router.refresh()
      } else {
        console.log('Login failed:', result.error)
        setError(result.error || 'Invalid credentials')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Произошла ошибка. Попробуйте еще раз.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Добро пожаловать</h1>
          <p className="text-gray-600">Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* role selection removed - role is determined by account linked to email */}

          <div>
            <FloatingInput
              id="email"
              name="email"
              type="email"
              label="Email"
              required
            />
          </div>

          <div>
            <FloatingInput
              id="password"
              name="password"
              type="password"
              label="Пароль"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Вход...
              </>
            ) : (
              'Войти'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}