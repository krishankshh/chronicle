import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, AlertTriangle, Loader2 } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { fetchAdminActivity, fetchAdminDashboard, fetchAdminStatistics } from './adminApi'
import { Card, Alert } from '../../components/ui'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/ToastProvider'

const StatCard = ({ label, value, accent }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-3xl font-bold text-gray-900">{value?.toLocaleString() ?? '0'}</p>
    <div className="mt-3 h-1.5 rounded-full bg-gray-100">
      <div className="h-full rounded-full" style={{ width: '60%', backgroundColor: accent }} />
    </div>
  </div>
)

const AdminDashboard = () => {
  const { role } = useAuthStore()
  const toast = useToast()
  const isStudent = role === 'student'

  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchAdminDashboard,
    enabled: !isStudent,
  })

  const { data: statisticsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'statistics'],
    queryFn: fetchAdminStatistics,
    enabled: !isStudent,
  })

  const { data: activityData, isLoading: activityLoading, refetch: refetchActivity } = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: () => fetchAdminActivity(30),
    enabled: !isStudent,
  })

  const summary = dashboardData?.summary || {}
  const activity = activityData?.logs || []

  const lineChartData = useMemo(() => {
    const base = statisticsData?.timeseries?.students || []
    const discussions = statisticsData?.timeseries?.discussions || []
    const posts = statisticsData?.timeseries?.timeline_posts || []
    const chats = statisticsData?.timeseries?.chat_messages || []
    return base.map((point, idx) => ({
      day: point.day.slice(5),
      students: point.count,
      discussions: discussions[idx]?.count ?? 0,
      posts: posts[idx]?.count ?? 0,
      chats: chats[idx]?.count ?? 0,
    }))
  }, [statisticsData])

  if (isStudent) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Admin tools unavailable"
        description="Switch to a staff or admin account to access analytics and reports."
      />
    )
  }

  if (dashboardError) {
    return (
      <Alert variant="error">
        Unable to load admin dashboard. Please try again later.
      </Alert>
    )
  }

  const quickActions = dashboardData?.quick_actions || []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-primary-600 font-semibold">Phase 10</p>
        <h1 className="text-3xl font-bold text-gray-900">Admin command center</h1>
        <p className="text-gray-600">Monitor community health, engagement, and system activity at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {dashboardLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Students" value={summary.students} accent="#2563eb" />
            <StatCard label="Staff" value={summary.staff} accent="#10b981" />
            <StatCard label="Timeline posts" value={summary.timeline_posts} accent="#f97316" />
            <StatCard label="Active discussions" value={summary.discussions} accent="#a855f7" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Engagement trends</h2>
            {statsLoading && <Loader2 className="h-4 w-4 animate-spin text-primary-600" />}
          </div>
          {lineChartData.length === 0 ? (
            <EmptyState title="No trend data" description="Activity will appear once users engage with the platform." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="students" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="discussions" stroke="#f97316" strokeWidth={2} />
                  <Line type="monotone" dataKey="posts" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="chats" stroke="#a855f7" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-50 p-3 text-primary-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
              <p className="text-sm text-gray-500">Speed up your workflow with curated shortcuts.</p>
            </div>
          </div>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  toast.success(`Opening ${action.label}`)
                  window.location.href = action.href
                }}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-left hover:border-primary-200 hover:bg-primary-50"
              >
                <p className="font-semibold text-gray-900">{action.label}</p>
                <p className="text-sm text-gray-500">{action.description}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent activity</h2>
          <button
            type="button"
            onClick={() => refetchActivity()}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-2"
          >
            <Loader2 className={`h-4 w-4 ${activityLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {activityLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : activity.length === 0 ? (
          <EmptyState title="Quiet day" description="We'll show system events as soon as they happen." />
        ) : (
          <div className="divide-y divide-gray-100">
            {activity.map((item) => (
              <div key={`${item.type}-${item.timestamp}-${item.title}`} className="py-3 flex justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {item.type} · {item.author || 'System'}
                  </p>
                </div>
                <p className="text-xs text-gray-400">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'n/a'}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Content snapshot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Notices" value={summary.notices} accent="#f59e0b" />
          <StatCard label="Materials" value={summary.materials} accent="#0ea5e9" />
          <StatCard label="Quizzes" value={summary.quizzes} accent="#ec4899" />
          <StatCard label="Messages" value={summary.chat_messages} accent="#6366f1" />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Engagement comparison</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="students" fill="#2563eb" />
              <Bar dataKey="posts" fill="#22c55e" />
              <Bar dataKey="discussions" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

export default AdminDashboard
