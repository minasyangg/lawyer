import { sanitizeArticleHtml } from '@/lib/utils/sanitize-html'

interface RichTextContentProps {
  content: string
  className?: string
}

export function RichTextContent({ content, className = '' }: RichTextContentProps) {
  return (
    <div
      className={`rich-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(content) }}
    />
  )
}
