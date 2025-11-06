import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { cn } from '../../lib/utils'

const RichTextContent = ({ html, className }) => {
  const safeHtml = useMemo(() => {
    if (!html) return ''
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
  }, [html])

  return (
    <div
      className={cn('rich-text', className)}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}

export default RichTextContent
