import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Card } from '../../components/ui'
import NoticeFilters from './NoticeFilters'
import NoticeCard from './NoticeCard'
import { fetchNotices } from './noticeApi'
import NoticeSidebar from './NoticeSidebar'

const NoticeList = () => {
  const [typeFilter, setTypeFilter] = useState('all')

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['notices', 'list', typeFilter],
    queryFn: () =>
      fetchNotices({
        ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
      }),
  })

  const notices = data?.notices || []

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chronicle Notices</h1>
          <p className="text-gray-600">Stay informed with the latest news, events, and announcements.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {isFetching && <span>Refreshing…</span>}
          <button
            type="button"
            onClick={() => refetch()}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      <NoticeFilters activeType={typeFilter} onChange={setTypeFilter} />

      {isLoading ? (
        <Card className="p-6">
          <p className="text-sm text-gray-500">Loading notices...</p>
        </Card>
      ) : error ? (
        <Alert variant="error">
          Failed to load notices. Please try again later.
        </Alert>
      ) : notices.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-gray-500">No notices found for this category.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {notices.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>

          <aside className="space-y-6">
            <NoticeSidebar limit={6} />
            <Card className="p-5 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Need help?</h2>
              <p className="text-sm text-gray-600">
                Contact the administration office if you have any questions about upcoming events or announcements.
              </p>
              <a className="text-sm font-medium text-primary-600 hover:text-primary-700" href="mailto:support@chronicle.com">
                support@chronicle.com
              </a>
            </Card>
          </aside>
        </div>
      )}
    </div>
  )
}

export default NoticeList
