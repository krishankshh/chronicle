import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Card, Button, Select, Input, Badge } from '../../components/ui'
import api from '../../lib/api'
import { fetchDiscussions, toggleDiscussionLike } from './discussionApi'
import { formatDateTime, truncate } from '../../lib/utils'
import useAuthStore from '../../store/authStore'

const defaultFilters = {
  subject_id: 'all',
  course_id: 'all',
  semester: '',
  search: '',
}

const DiscussionList = () => {
  const [filters, setFilters] = useState(defaultFilters)
  const navigate = useNavigate()
  const { role } = useAuthStore()

  const coursesQuery = useQuery({
    queryKey: ['courses', 'discussions'],
    queryFn: async () => {
      const response = await api.get('/courses', { params: { limit: 100 } })
      return response.data?.courses || []
    },
  })

  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'discussions', filters.course_id],
    queryFn: async () => {
      if (filters.course_id === 'all') return []
      const response = await api.get('/subjects', {
        params: { limit: 200, course_id: filters.course_id },
      })
      return response.data?.subjects || []
    },
    enabled: filters.course_id !== 'all',
  })

  const discussionsQuery = useQuery({
    queryKey: ['discussions', filters],
    queryFn: () =>
      fetchDiscussions({
        subject_id: filters.subject_id !== 'all' ? filters.subject_id : undefined,
        course_id: filters.course_id !== 'all' ? filters.course_id : undefined,
        semester: filters.semester || undefined,
        search: filters.search || undefined,
        limit: 30,
      }),
  })

  const handleReset = () => setFilters(defaultFilters)

  const discussions = discussionsQuery.data?.discussions || []

  const coursesOptions = (coursesQuery.data || []).map((course) => ({
    value: course._id,
    label: course.course_name || course.course_code || 'Course',
  }))

  const subjectsOptions = (subjectsQuery.data || []).map((subject) => ({
    value: subject._id,
    label: subject.subject_name || subject.subject_code || 'Subject',
  }))

  const handleLike = async (discussionId) => {
    try {
      await toggleDiscussionLike(discussionId)
      discussionsQuery.refetch()
    } catch (error) {
      // silently ignore for now
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discussion forum</h1>
          <p className="text-gray-600">Collaborate with peers and staff across course discussions.</p>
        </div>
        <Button onClick={() => navigate('/discussions/new')}>
          Start a discussion
        </Button>
      </div>

      <Card className="grid grid-cols-1 gap-4 p-6 md:grid-cols-5">
        <Select
          label="Course"
          value={filters.course_id}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              course_id: event.target.value,
              subject_id: 'all',
            }))
          }
          options={[{ value: 'all', label: 'All courses' }, ...coursesOptions]}
        />
        <Select
          label="Subject"
          value={filters.subject_id}
          onChange={(event) => setFilters((prev) => ({ ...prev, subject_id: event.target.value }))}
          disabled={filters.course_id === 'all'}
          options={[{ value: 'all', label: 'All subjects' }, ...subjectsOptions]}
        />
        <Input
          label="Semester"
          type="number"
          min={1}
          value={filters.semester}
          onChange={(event) => setFilters((prev) => ({ ...prev, semester: event.target.value }))}
          placeholder="e.g. 5"
        />
        <Input
          label="Search"
          value={filters.search}
          onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          placeholder="Search discussions"
        />
        <div className="flex items-end">
          <Button variant="outline" className="w-full" onClick={handleReset}>
            Reset filters
          </Button>
        </div>
      </Card>

      {discussionsQuery.isLoading ? (
        <Card className="p-6">
          <p className="text-sm text-gray-500">Loading discussions...</p>
        </Card>
      ) : discussionsQuery.error ? (
        <Alert variant="error">Unable to load discussions.</Alert>
      ) : discussions.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-gray-500">No discussions found. Be the first to start one!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <Card key={discussion.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <Link
                  to={`/discussions/${discussion.id}`}
                  className="text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                >
                  {discussion.title}
                </Link>
                <p className="text-sm text-gray-600">
                  {truncate(discussion.content?.replace(/<[^>]+>/g, ''), 180)}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span>By {discussion.author_name || 'Unknown'}</span>
                  <span>{formatDateTime(discussion.updated_at)}</span>
                  {discussion.semester && <Badge variant="outline">Semester {discussion.semester}</Badge>}
                  <Badge variant="outline">{discussion.reply_count} replies</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLike(discussion.id)}
                >
                  👍 {discussion.likes_count}
                </Button>
                {role === 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/discussions/${discussion.id}/edit`)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default DiscussionList
