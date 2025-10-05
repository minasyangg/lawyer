"use client"
import React, { useState } from 'react'
import Image, { ImageProps } from 'next/image'

type Props = Omit<ImageProps, 'src'> & {
  src?: string | null
  placeholderSrc?: string
}

export default function FallbackImage({ src, placeholderSrc = '/img/article-placeholder.svg', alt = '', ...rest }: Props) {
  const [current, setCurrent] = useState<string | undefined>(src ?? undefined)

  return (
    <Image
      {...rest}
      src={current || placeholderSrc}
      alt={alt}
      loading={rest.loading ?? 'lazy'}
      onError={() => setCurrent(placeholderSrc)}
    />
  )
}
