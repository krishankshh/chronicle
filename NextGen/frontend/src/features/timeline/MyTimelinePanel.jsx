import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Loader2 } from 'lucide-react'
import { Card } from '../../components/ui'
import useAuthStore from '../../store/authStore'
import { fetchStudentTimeline } from './timelineApi'

const MyTimelinePanel = () => {
  const { user, role } = useAuthStore()
  const studentId = role === 'student' ? user?.id : null

  const { data, isLoading } = useQuery({
    queryKey: ['timeline', 'student', studentId],
    queryFn: () => fetchStudentTimeline(studentId, { page: 1, limit: 3 }),
    enabled: Boolean(studentId),
    staleTime: 60 * 1000,
  })

  const posts = useMemo(() => data?.posts || [], [data])
  const total = data?.total ?? 0

  if (!studentId) {
    return (
      <Card className="p-5 text-sm text-gray-600">
        Timeline insights are only available for student accounts.
      </Card>
    )
  }

  const stats = [
    { label: 'Total posts', value: total },
    { label: 'Latest visibility', value: posts[0]?.visibility || 'public' },
  ]

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary-50 p-3 text-primary-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">My activity</h2>
            <p className="text-sm text-gray-500">
              Snapshot of your recent posts. Keep the community engaged with helpful updates.
            </p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <dt className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</dt>
              <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Recent posts</h3>
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading timeline...
          </p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-gray-500">You have not posted yet. Share your first update!</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="rounded-xl border border-gray-100 bg-white p-3">
              <p className="text-sm text-gray-800 line-clamp-3">{post.content || 'Media post'}</p>
              <p className="mt-2 text-xs text-gray-500">
                {new Date(post.created_at).toLocaleDateString()} · {post.comments_count} comments
              </p>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}

export default MyTimelinePanel
