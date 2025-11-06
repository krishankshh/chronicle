import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Card, Badge, Button } from '../../components/ui'
import { fetchQuizById, startQuizAttempt } from './quizApi'
import { formatDate } from '../../lib/utils'
import { useState } from 'react'

const QuizStart = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const quizQuery = useQuery({
    queryKey: ['quizzes', 'detail', quizId],
    queryFn: () => fetchQuizById(quizId),
    enabled: !!quizId,
  })

  const quiz = quizQuery.data

  const handleStart = async () => {
    try {
      setError('')
      const attemptData = await startQuizAttempt(quizId)
      navigate(`/quizzes/${quizId}/attempt/${attemptData.attempt_id}`, {
        state: attemptData,
      })
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to start quiz. Please try again.'
      setError(message)
    }
  }

  if (quizQuery.isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">Loading quiz...</p>
      </Card>
    )
  }

  if (quizQuery.error || !quiz) {
    return (
      <Alert variant="error">Quiz not found or unavailable.</Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>Duration: {quiz.duration_minutes} minutes</span>
              <span>Total marks: {quiz.total_marks}</span>
              <Badge variant="outline">{quiz.questions_count} questions</Badge>
              {quiz.semester && <Badge variant="primary">Semester {quiz.semester}</Badge>}
            </div>
          </div>
          <Badge variant={quiz.status === 'published' ? 'success' : 'warning'}>
            {quiz.status?.toUpperCase()}
          </Badge>
        </div>

        {quiz.description && (
          <p className="text-sm text-gray-700 whitespace-pre-line">{quiz.description}</p>
        )}

        <div className="rounded-lg bg-gray-50 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Instructions</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>Each question has a single correct answer.</li>
            <li>Time limit: {quiz.duration_minutes} minutes. The quiz auto-submits when time ends.</li>
            <li>You must answer in order. You can change answers before submitting.</li>
            <li>Your score is calculated automatically after submission.</li>
          </ul>
        </div>

        <p className="text-xs text-gray-400">
          Last updated {formatDate(quiz.updated_at) || formatDate(quiz.created_at)}
        </p>

        {error && (
          <Alert variant="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleStart}>
            Start quiz
          </Button>
          <Button variant="outline" onClick={() => navigate('/quizzes')}>
            Back to quizzes
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default QuizStart
