import { useQuery } from '@tanstack/react-query'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts'
import { BarChart3, TrendingUp } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { fetchContentAnalytics, fetchUserAnalytics } from '../admin/adminApi'
import { Card } from '../../components/ui'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

const COLORS = ['#2563eb', '#10b981', '#f97316', '#a855f7', '#0ea5e9', '#facc15']

const AnalyticsPage = () => {
  const { role } = useAuthStore()
  const isStudent = role === 'student'

  const { data: userAnalytics, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'user-analytics'],
    queryFn: fetchUserAnalytics,
    enabled: !isStudent,
  })

  const { data: contentAnalytics, isLoading: contentLoading } = useQuery({
    queryKey: ['admin', 'content-analytics'],
    queryFn: fetchContentAnalytics,
    enabled: !isStudent,
  })

  if (isStudent) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Analytics unavailable"
        description="Switch to a staff or admin account to review system analytics."
      />
    )
  }

  const courseData = userAnalytics?.per_course || []
  const semesterData = userAnalytics?.per_semester || []
  const noticeData = contentAnalytics?.notices_by_type || []
  const quizStats = contentAnalytics?.quizzes || []

  const totalStudents = userAnalytics?.total_students || 0
  const growth = userAnalytics?.monthly_growth?.trend || 0

  const growthLabel = growth > 0 ? `+${growth}` : `${growth}`

  const timelineSummary = contentAnalytics?.timeline || { posts: 0, likes: 0, comments: 0 }
  const discussionSummary = contentAnalytics?.discussions || { threads: 0, replies: 0, likes: 0 }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-primary-600 font-semibold">Phase 10</p>
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
        <p className="text-gray-600">Dive deeper into platform usage, growth, and engagement trends.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 space-y-2">
          <p className="text-sm font-medium text-gray-500">Total students</p>
          {usersLoading ? (
            <Skeleton className="h-12 rounded-xl" />
          ) : (
            <p className="text-4xl font-bold text-gray-900">{totalStudents.toLocaleString()}</p>
          )}
        </Card>
        <Card className="p-5 space-y-2">
          <p className="text-sm font-medium text-gray-500">30-day growth</p>
          {usersLoading ? (
            <Skeleton className="h-12 rounded-xl" />
          ) : (
            <p className={`text-4xl font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{growthLabel}</p>
          )}
        </Card>
        <Card className="p-5 space-y-2">
          <p className="text-sm font-medium text-gray-500">Timeline interactions</p>
          {contentLoading ? (
            <Skeleton className="h-12 rounded-xl" />
          ) : (
            <p className="text-4xl font-bold text-gray-900">{timelineSummary.likes + timelineSummary.comments}</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-50 p-3 text-primary-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Students per course</h2>
              <p className="text-sm text-gray-500">Identify which programs drive enrollment.</p>
            </div>
          </div>
          {usersLoading ? (
            <Skeleton className="h-64 rounded-2xl" />
          ) : courseData.length === 0 ? (
            <EmptyState title="No data" description="Add students to populate course analytics." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="course" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Notices by type</h2>
          {contentLoading ? (
            <Skeleton className="h-64 rounded-2xl" />
          ) : noticeData.length === 0 ? (
            <EmptyState title="No notices" description="Publish notices to populate analytics." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={noticeData} dataKey="count" nameKey="type" outerRadius={90}>
                    {noticeData.map((entry, index) => (
                      <Cell key={entry.type} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Students per semester</h2>
          {usersLoading ? (
            <Skeleton className="h-56 rounded-2xl" />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={semesterData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="semester" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Quiz pipeline</h2>
          {contentLoading ? (
            <Skeleton className="h-56 rounded-2xl" />
          ) : quizStats.length === 0 ? (
            <EmptyState title="No quizzes" description="Create quizzes to activate analytics." />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quizStats}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-2">
          <p className="text-sm font-medium text-gray-500">Timeline engagement</p>
          {contentLoading ? (
            <Skeleton className="h-24 rounded-2xl" />
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900">{timelineSummary.posts} posts</p>
              <p className="text-sm text-gray-500">
                {timelineSummary.likes} likes · {timelineSummary.comments} comments
              </p>
            </>
          )}
        </Card>
        <Card className="p-5 space-y-2">
          <p className="text-sm font-medium text-gray-500">Discussion replies</p>
          {contentLoading ? (
            <Skeleton className="h-24 rounded-2xl" />
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900">{discussionSummary.replies} replies</p>
              <p className="text-sm text-gray-500">
                {discussionSummary.threads} threads · {discussionSummary.likes} likes
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export default AnalyticsPage
