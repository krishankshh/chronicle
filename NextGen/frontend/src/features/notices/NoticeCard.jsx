import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { Badge, Card } from '../../components/ui'
import { formatDate, truncate, capitalize } from '../../lib/utils'

const NoticeCard = ({ notice, variant = 'grid' }) => {
  if (!notice) return null

  const {
    id,
    title,
    summary,
    content,
    cover_image_url: coverImageUrl,
    cover_image,
    type,
    publish_start: publishStart,
  } = notice

  const description = summary || truncate(content?.replace(/<[^>]+>/g, ''), 160)
  const imageSrc = coverImageUrl || (cover_image ? `${cover_image}` : null)

  return (
    <Card className={variant === 'list' ? 'flex flex-col sm:flex-row gap-4' : ''}>
      {imageSrc && (
        <Link to={`/notices/${id}`} className="block flex-shrink-0">
          <img
            src={imageSrc}
            alt={title}
            className={variant === 'list' ? 'w-full sm:w-48 h-32 rounded-lg object-cover' : 'w-full h-48 rounded-lg object-cover mb-4'}
            loading="lazy"
          />
        </Link>
      )}

      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Badge variant="outline">{capitalize(type)}</Badge>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(publishStart)}</span>
          </div>
        </div>

        <Link to={`/notices/${id}`} className="block group">
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
        </Link>

        {description && (
          <p className="text-gray-600">
            {description}
          </p>
        )}

        <div>
          <Link
            to={`/notices/${id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Read more →
          </Link>
        </div>
      </div>
    </Card>
  )
}

export default NoticeCard
