"use client"

import dynamic from 'next/dynamic'

const DynamicRichTextEditor = dynamic(
  () => import('./RichTextEditor').then((mod) => mod.RichTextEditor),
  { 
    ssr: false,
    loading: () => <div className="min-h-[500px] w-full bg-gray-50 animate-pulse" />
  }
)

export default DynamicRichTextEditor
