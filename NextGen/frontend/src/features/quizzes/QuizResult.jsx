import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Alert, Card, Badge, Button } from '../../components/ui'
import { fetchQuizResults } from './quizApi'
import { formatDateTime } from '../../lib/utils'

const useQueryParam = (key) => {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search).get(key), [search, key])
}

const QuizResult = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const attemptId = useQueryParam('attempt_id')

  const resultQuery = useQuery({
    queryKey: ['quizzes', 'results', quizId, attemptId],
    queryFn: () => fetchQuizResults(quizId, attemptId ? { attempt_id: attemptId } : undefined),
    enabled: !!quizId,
  })

  if (resultQuery.isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">Loading results...</p>
      </Card>
    )
  }

  if (resultQuery.error || !resultQuery.data) {
    return <Alert variant="error">Unable to load quiz results.</Alert>
  }

  const data = resultQuery.data
  const quiz = data.quiz
  const attempt = data.attempt
  const answers = attempt?.answers || []

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{quiz?.title || 'Quiz results'}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>Score: <strong>{attempt?.score}</strong> / {attempt?.total_points}</span>
              <Badge variant={attempt?.percentage >= 60 ? 'success' : 'warning'}>
                {attempt?.percentage?.toFixed(2)}%
              </Badge>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/quizzes')}>
            Back to quizzes
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Submitted at</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDateTime(attempt?.submitted_at) || '—'}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Questions answered</p>
            <p className="text-sm font-medium text-gray-900">
              {answers.filter((answer) => answer.selected_option).length} / {answers.length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Time spent</p>
            <p className="text-sm font-medium text-gray-900">
              {Math.floor((attempt?.time_spent_seconds || 0) / 60)} min
            </p>
          </div>
        </div>
      </Card>

      <Card className="divide-y divide-gray-200">
        {answers.map((answer, index) => (
          <div key={answer.question_id || index} className="space-y-3 p-5">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Question {index + 1}</span>
              <Badge variant={answer.is_correct ? 'success' : 'danger'}>
                {answer.is_correct ? 'Correct' : 'Incorrect'}
              </Badge>
            </div>
            <p className="font-medium text-gray-900">{answer.question_text || ''}</p>
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <p>
                Your answer:{' '}
                <span className="font-semibold">
                  {answer.selected_option_text || 'Not answered'}
                </span>
              </p>
              <p>
                Correct answer:{' '}
                <span className="font-semibold text-green-600">
                  {answer.correct_option_text || answer.correct_option}
                </span>
              </p>
            </div>
            {answer.explanation && (
              <p className="rounded-lg bg-primary-50 p-3 text-sm text-primary-800">
                Explanation: {answer.explanation}
              </p>
            )}
          </div>
        ))}
      </Card>
    </div>
  )
}

export default QuizResult
