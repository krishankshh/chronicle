import { Link } from 'react-router-dom'
import { Card, Badge } from '../../components/ui'
import { formatDate, capitalize } from '../../lib/utils'
import { Clock, BookOpen, Layers } from 'lucide-react'

const QuizCard = ({ quiz }) => {
  if (!quiz) return null

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <Link
          to={`/quizzes/${quiz.id}`}
          className="text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors"
        >
          {quiz.title}
        </Link>
        <Badge variant={quiz.status === 'published' ? 'success' : 'warning'}>
          {capitalize(quiz.status)}
        </Badge>
      </div>

      {quiz.description && (
        <p className="text-sm text-gray-600">
          {quiz.description.length > 180 ? `${quiz.description.slice(0, 180)}…` : quiz.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {quiz.duration_minutes} min
        </span>
        <span className="inline-flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          {quiz.questions_count} questions
        </span>
        {quiz.semester && (
          <span className="inline-flex items-center gap-1">
            <Layers className="w-4 h-4" />
            Semester {quiz.semester}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Updated {formatDate(quiz.updated_at) || formatDate(quiz.created_at)}</span>
        <Link
          to={`/quizzes/${quiz.id}/start`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View details →
        </Link>
      </div>
    </Card>
  )
}

export default QuizCard
