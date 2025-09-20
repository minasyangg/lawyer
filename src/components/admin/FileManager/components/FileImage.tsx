import React from 'react'
import Image from 'next/image'

interface FileImageProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  sizes?: string
}

/**
 * Компонент для отображения изображений файлов
 * Обрабатывает ошибки загрузки и добавляет unoptimized для внешних URL
 */
export function FileImage({ src, alt, className, fill = false, sizes }: FileImageProps) {
  const [error, setError] = React.useState(false)
  
  if (error) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-xs">Ошибка загрузки</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      unoptimized={true} // Отключаем оптимизацию для внешних URL
      onError={() => setError(true)}
    />
  )
}