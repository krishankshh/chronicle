import { Users, BookOpen, FileText, MessageSquare, Calendar, ClipboardList, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '../../store/authStore'
import NoticeCarousel from '../notices/NoticeCarousel'
import NoticeSidebar from '../notices/NoticeSidebar'
import { fetchLatestNotices, fetchNotices } from '../notices/noticeApi'
import { Badge, Card } from '../../components/ui'
import { formatDate, formatDateTime, capitalize } from '../../lib/utils'

const Dashboard = () => {
  const { user, role } = useAuthStore()

  const { data: latestData } = useQuery({
    queryKey: ['notices', 'dashboard', 'latest'],
    queryFn: () => fetchLatestNotices(4),
  })

  const { data: eventsData } = useQuery({
    queryKey: ['notices', 'dashboard', 'events'],
    queryFn: () => fetchNotices({ type: 'events', limit: 3 }),
  })

  const latestNotices = latestData?.notices || []
  const eventNotices = eventsData?.notices || []

  const studentStats = [
    { name: 'My Courses', value: '5', icon: BookOpen, color: 'bg-blue-500' },
    { name: 'Study Materials', value: '24', icon: FileText, color: 'bg-green-500' },
    { name: 'Quizzes', value: '8', icon: ClipboardList, color: 'bg-purple-500' },
    { name: 'Discussions', value: '12', icon: MessageSquare, color: 'bg-orange-500' },
  ]

  const staffStats = [
    { name: 'Total Students', value: '245', icon: Users, color: 'bg-blue-500' },
    { name: 'Active Courses', value: '12', icon: BookOpen, color: 'bg-green-500' },
    { name: 'Quizzes Created', value: '18', icon: ClipboardList, color: 'bg-purple-500' },
    { name: 'Active Notices', value: latestNotices.length.toString(), icon: Calendar, color: 'bg-orange-500' },
  ]

  const stats = role === 'student' ? studentStats : staffStats

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name || 'Chronicle Member'}!
        </h1>
        <p className="text-gray-600">
          {role === 'student'
            ? 'Here’s what’s happening across your campus today.'
            : 'Manage your community updates and keep everyone informed.'}
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary-600" />
            Featured Announcements
          </h2>
        </div>
        <NoticeCarousel limit={5} />
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-6">
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Latest Notices</h2>
              <Badge variant="info">{latestNotices.length} updates</Badge>
            </div>
            <div className="space-y-4">
              {latestNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <Badge variant="outline">{capitalize(notice.type)}</Badge>
                    <span>{formatDateTime(notice.publish_start)}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    <a href={`/notices/${notice.id}`} className="hover:text-primary-600">
                      {notice.title}
                    </a>
                  </h3>
                  {notice.summary && (
                    <p className="text-sm text-gray-600 mt-1">{notice.summary}</p>
                  )}
                </div>
              ))}
              {latestNotices.length === 0 && (
                <p className="text-sm text-gray-500">No recent notices have been published yet.</p>
              )}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <div className="space-y-4">
              {eventNotices.map((notice) => {
                const eventDate = new Date(notice.publish_start)
                return (
                  <div key={notice.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-xs text-primary-600 font-medium">
                        {eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className="text-lg font-bold text-primary-600">{eventDate.getDate()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{notice.title}</p>
                      <p className="text-sm text-gray-600">{formatDate(notice.publish_start)}</p>
                    </div>
                  </div>
                )
              })}
              {eventNotices.length === 0 && (
                <p className="text-sm text-gray-500">No events scheduled yet.</p>
              )}
            </div>
          </Card>
        </div>

        <NoticeSidebar title="In Case You Missed It" limit={5} />
      </div>
    </div>
  )
}

export default Dashboard
