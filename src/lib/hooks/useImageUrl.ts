import { useEffect, useState } from 'react'

interface UseImageUrlOptions {
  virtualId?: string | null
  mimeType: string
  enabled?: boolean
}

interface UseImageUrlResult {
  url: string
  isLoading: boolean
  error: string | null
}

/**
 * Хук для получения прямого URL изображения
 * Для не-изображений возвращает оригинальный URL
 */
export function useImageUrl({ virtualId, mimeType, enabled = true }: UseImageUrlOptions): UseImageUrlResult {
  const [url, setUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !virtualId) {
      setUrl(virtualId ? `/api/files/virtual/${virtualId}` : '')
      setIsLoading(false)
      setError(null)
      return
    }

    // Если это не изображение, используем обычный URL
    if (!mimeType.startsWith('image/')) {
      setUrl(`/api/files/virtual/${virtualId}`)
      setIsLoading(false)
      setError(null)
      return
    }

    // Для изображений пытаемся получить прямой URL
    setIsLoading(true)
    setError(null)

    fetch(`/api/files/direct-url/${virtualId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        setUrl(data.url || `/api/files/virtual/${virtualId}`)
      })
      .catch(err => {
        console.warn('Failed to get direct URL, using fallback:', err)
        setUrl(`/api/files/virtual/${virtualId}`)
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [virtualId, mimeType, enabled])

  return { url, isLoading, error }
}