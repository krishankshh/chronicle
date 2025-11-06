import { useQuery } from '@tanstack/react-query'
import { Alert, Card, Badge } from '../../components/ui'
import { fetchStudentQuizHistory } from './quizApi'
import { formatDateTime } from '../../lib/utils'

const QuizHistory = () => {
  const historyQuery = useQuery({
    queryKey: ['quizzes', 'history'],
    queryFn: fetchStudentQuizHistory,
  })

  if (historyQuery.isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">Loading quiz history...</p>
      </Card>
    )
  }

  if (historyQuery.error) {
    return <Alert variant="error">Unable to load quiz history.</Alert>
  }

  const attempts = historyQuery.data?.attempts || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quiz history</h1>
        <p className="text-gray-600">Review your previous attempts and track performance.</p>
      </div>

      {attempts.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-gray-500">No quiz attempts yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <Card key={attempt.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Attempted on {formatDateTime(attempt.submitted_at) || formatDateTime(attempt.started_at)}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  Score: {attempt.score}/{attempt.total_points} ({attempt.percentage?.toFixed(2)}%)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={attempt.percentage >= 60 ? 'success' : 'warning'}>
                  {attempt.percentage?.toFixed(1)}%
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default QuizHistory
