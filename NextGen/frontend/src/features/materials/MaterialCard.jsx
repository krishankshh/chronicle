import { Link } from 'react-router-dom'
import { BookOpen, Layers, Download } from 'lucide-react'
import { Card, Badge } from '../../components/ui'
import { formatDate, truncate, capitalize } from '../../lib/utils'

const MaterialCard = ({ material }) => {
  if (!material) return null

  const attachmentCount = material.attachments?.length || 0

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            to={`/materials/${material.id}`}
            className="text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors"
          >
            {material.title}
          </Link>
          <p className="text-sm text-gray-500">
            Updated {formatDate(material.updated_at) || formatDate(material.created_at)}
          </p>
        </div>
        <Badge variant="outline">
          {attachmentCount} file{attachmentCount === 1 ? '' : 's'}
        </Badge>
      </div>

      {material.description && (
        <p className="text-sm text-gray-600">{truncate(material.description.replace(/<[^>]+>/g, ''), 180)}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
        {material.course_id && (
          <span className="inline-flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            Course #{material.course_id.slice(-6)}
          </span>
        )}
        {material.subject_id && (
          <span className="inline-flex items-center gap-1">
            <Layers className="w-4 h-4" />
            Subject #{material.subject_id.slice(-6)}
          </span>
        )}
        {material.semester && (
          <span className="inline-flex items-center gap-1">
            <Badge variant="primary">Semester {material.semester}</Badge>
          </span>
        )}
        {material.tags?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {material.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="default">
                {capitalize(tag)}
              </Badge>
            ))}
            {material.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{material.tags.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Link
          to={`/materials/${material.id}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View details →
        </Link>
        <span className="flex items-center gap-2 text-sm text-gray-500">
          <Download className="w-4 h-4" />
          {material.download_count || 0} downloads
        </span>
      </div>
    </Card>
  )
}

export default MaterialCard
