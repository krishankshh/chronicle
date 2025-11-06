import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '../../store/authStore'
import { Alert, Badge, Button, Card, Modal, Select, Input } from '../../components/ui'
import { fetchQuizzes, deleteQuiz } from './quizApi'
import { formatDateTime } from '../../lib/utils'

const QuizAdminList = () => {
  const { role } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState({ status: 'any', search: '' })
  const [quizToDelete, setQuizToDelete] = useState(null)
  const [actionError, setActionError] = useState('')

  const quizzesQuery = useQuery({
    queryKey: ['quizzes', 'admin', filters],
    queryFn: () =>
      fetchQuizzes({
        status: filters.status === 'any' ? undefined : filters.status,
        search: filters.search || undefined,
        include_drafts: true,
        limit: 100,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] })
      setQuizToDelete(null)
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to delete quiz.'
      setActionError(message)
    },
  })

  if (!['staff', 'admin'].includes(role)) {
    return <Alert variant="error">You do not have permission to manage quizzes.</Alert>
  }

  const quizzes = quizzesQuery.data?.quizzes || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Quizzes</h1>
          <p className="text-gray-600">Create quizzes, manage questions, and review results.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => quizzesQuery.refetch()}>
            Refresh
          </Button>
          <Button onClick={() => navigate('/admin/quizzes/new')}>
            New quiz
          </Button>
        </div>
      </div>

      {actionError && (
        <Alert variant="error" onClose={() => setActionError('')}>
          {actionError}
        </Alert>
      )}

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            label="Status"
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            options={[
              { value: 'any', label: 'Any status' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
            ]}
          />
          <Input
            label="Search"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search title or description"
          />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Quiz
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Questions
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {quizzesQuery.isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                  Loading quizzes...
                </td>
              </tr>
            ) : quizzesQuery.error ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-red-600">
                  Failed to load quizzes.
                </td>
              </tr>
            ) : quizzes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                  No quizzes found. Create your first quiz.
                </td>
              </tr>
            ) : (
              quizzes.map((quiz) => (
                <tr key={quiz.id}>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{quiz.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {quiz.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {quiz.questions_count}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {quiz.duration_minutes} min
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <Badge variant={quiz.status === 'published' ? 'success' : 'warning'}>
                      {quiz.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateTime(quiz.updated_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/quizzes/${quiz.id}/questions`)}
                      >
                        Questions
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/quizzes/${quiz.id}/analytics`)}
                      >
                        Analytics
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setQuizToDelete(quiz)}
                        loading={deleteMutation.isPending && quizToDelete?.id === quiz.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Modal
        isOpen={!!quizToDelete}
        onClose={() => setQuizToDelete(null)}
        title="Delete quiz"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setQuizToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(quizToDelete.id)}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to delete <span className="font-semibold">{quizToDelete?.title}</span>? This action
          cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

export default QuizAdminList
