import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Card, Button } from '../../components/ui'
import { fetchQuizAnalytics, fetchQuizStudentResults, fetchQuizById } from './quizApi'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'

const EMPTY_ARRAY = []

const QuizAnalytics = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()

  const quizQuery = useQuery({
    queryKey: ['quizzes', 'detail', quizId],
    queryFn: () => fetchQuizById(quizId),
    enabled: !!quizId,
  })

  const analyticsQuery = useQuery({
    queryKey: ['quizzes', quizId, 'analytics'],
    queryFn: () => fetchQuizAnalytics(quizId),
    enabled: !!quizId,
  })

  const resultsQuery = useQuery({
    queryKey: ['quizzes', quizId, 'student-results'],
    queryFn: () => fetchQuizStudentResults(quizId),
    enabled: !!quizId,
  })

  const attempts = resultsQuery.data?.attempts ?? EMPTY_ARRAY

  const chartData = useMemo(
    () =>
      attempts.map((attempt, index) => ({
        name: `Attempt ${index + 1}`,
        percentage: attempt.percentage || 0,
        score: attempt.score || 0,
      })),
    [attempts]
  )

  if (analyticsQuery.isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">Loading analytics...</p>
      </Card>
    )
  }

  if (analyticsQuery.error) {
    return <Alert variant="error">Unable to load analytics for this quiz.</Alert>
  }

  const analytics = analyticsQuery.data

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz analytics</h1>
          <p className="text-gray-600">{quizQuery.data?.title}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/quizzes')}>
          Back to quizzes
        </Button>
      </div>

      <Card className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500">Attempts</p>
          <p className="text-xl font-semibold text-gray-900">{analytics.attempts}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Average score</p>
          <p className="text-xl font-semibold text-gray-900">{analytics.average_score?.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Average %</p>
          <p className="text-xl font-semibold text-gray-900">{analytics.average_percentage?.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Median %</p>
          <p className="text-xl font-semibold text-gray-900">{analytics.median_percentage?.toFixed(2)}%</p>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Percentage distribution</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-500">No attempts yet for this quiz.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Score distribution</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-500">No attempts yet for this quiz.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  )
}

export default QuizAnalytics
