import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchFeaturedNotices } from './noticeApi'
import { formatDate, capitalize } from '../../lib/utils'
import { Alert, Card, Badge } from '../../components/ui'

const NoticeCarousel = ({ limit = 5 }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['notices', 'featured', limit],
    queryFn: () => fetchFeaturedNotices(limit),
  })

  const notices = data?.notices || []

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">Loading featured notices...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="error">
        Unable to load featured notices. Please try again later.
      </Alert>
    )
  }

  if (!notices.length) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">No featured notices available yet.</p>
      </Card>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 snap-x snap-mandatory pb-2">
        {notices.map((notice) => (
          <Link
            key={notice.id}
            to={`/notices/${notice.id}`}
            className="min-w-[280px] max-w-xs flex-1 snap-start"
          >
            <Card className="h-full overflow-hidden">
              {notice.cover_image_url && (
                <img
                  src={notice.cover_image_url}
                  alt={notice.title}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
              )}

              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Badge variant="outline">{capitalize(notice.type)}</Badge>
                  <span>{formatDate(notice.publish_start)}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {notice.title}
                </h3>
                {notice.summary && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {notice.summary}
                  </p>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default NoticeCarousel
