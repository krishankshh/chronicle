import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui'
import { fetchLatestNotices } from './noticeApi'
import { formatDate, capitalize } from '../../lib/utils'

const NoticeSidebar = ({ title = 'Latest Notices', limit = 6 }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['notices', 'latest', limit],
    queryFn: () => fetchLatestNotices(limit),
  })

  const notices = data?.notices || []

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Link to="/notices" className="text-sm text-primary-600 hover:text-primary-700">
          View all
        </Link>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading notices...</p>}
      {error && <p className="text-sm text-red-600">Failed to load notices.</p>}

      {!isLoading && !error && notices.length === 0 && (
        <p className="text-sm text-gray-500">No notices available.</p>
      )}

      {!isLoading && !error && notices.length > 0 && (
        <div className="space-y-3">
          {notices.map((notice) => (
            <Link
              key={notice.id}
              to={`/notices/${notice.id}`}
              className="block rounded-md p-3 hover:bg-gray-50 transition-colors"
            >
              <p className="text-xs uppercase text-gray-400">{capitalize(notice.type)}</p>
              <p className="font-medium text-gray-900 line-clamp-2">{notice.title}</p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(notice.publish_start)}</p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}

export default NoticeSidebar
