import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Alert, Badge, Card } from '../../components/ui'
import { fetchNoticeById } from './noticeApi'
import { formatDateTime, formatDate, capitalize } from '../../lib/utils'
import RichTextContent from '../../components/ui/RichTextContent'
import NoticeSidebar from './NoticeSidebar'

const NoticeDetail = () => {
  const { noticeId } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['notices', 'detail', noticeId],
    queryFn: () => fetchNoticeById(noticeId),
    enabled: !!noticeId,
  })

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">Loading notice...</p>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Alert variant="error">
        Unable to load this notice. It may have been removed or you do not have access.
      </Alert>
    )
  }

  const notice = data

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(250px,1fr)] gap-8">
      <article className="space-y-6">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Link to="/notices" className="text-primary-600 hover:text-primary-700">
            ← Back to notices
          </Link>
          <span>•</span>
          <span>{formatDateTime(notice.publish_start)}</span>
        </div>

        <div className="space-y-4">
          <Badge variant="outline">{capitalize(notice.type)}</Badge>
          <h1 className="text-3xl font-bold text-gray-900">{notice.title}</h1>
          {notice.summary && <p className="text-lg text-gray-600">{notice.summary}</p>}
        </div>

        {notice.cover_image_url && (
          <img
            src={notice.cover_image_url}
            alt={notice.title}
            className="w-full max-h-[420px] object-cover rounded-lg shadow-sm"
          />
        )}

        <Card className="p-6 space-y-6">
          <RichTextContent html={notice.content} />

          <div className="border-t pt-4 text-sm text-gray-500">
            <p>Published on {formatDate(notice.publish_start)}</p>
            {notice.publish_end && (
              <p>Visible until {formatDate(notice.publish_end)}</p>
            )}
          </div>
        </Card>
      </article>

      <aside className="space-y-6">
        <NoticeSidebar limit={5} />

        <Card className="p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Share this notice</h2>
          <p className="text-sm text-gray-600">
            Inform your peers about this announcement using the Chronicle portal or social channels.
          </p>
        </Card>
      </aside>
    </div>
  )
}

export default NoticeDetail
