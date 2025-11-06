import { useQuery } from '@tanstack/react-query'
import { Alert, Card } from '../../components/ui'
import QuizCard from './QuizCard'
import { fetchQuizzes } from './quizApi'
import { useState } from 'react'
import { Select, Input, Button } from '../../components/ui'

const defaultFilters = {
  status: 'published',
  semester: '',
  search: '',
}

const QuizList = () => {
  const [filters, setFilters] = useState(defaultFilters)

  const quizzesQuery = useQuery({
    queryKey: ['quizzes', 'list', filters],
    queryFn: () =>
      fetchQuizzes({
        status: filters.status || undefined,
        semester: filters.semester || undefined,
        search: filters.search || undefined,
        limit: 50,
      }),
  })

  const handleReset = () => {
    setFilters(defaultFilters)
  }

  const quizzes = quizzesQuery.data?.quizzes || []

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Available Quizzes</h1>
        <p className="text-gray-600">
          Practice and assess your knowledge with upcoming and published quizzes from your courses.
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Select
            label="Status"
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            options={[
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft (staff only)' },
              { value: '', label: 'Any status' },
            ]}
          />
          <Input
            label="Semester"
            type="number"
            min={1}
            value={filters.semester}
            onChange={(event) => setFilters((prev) => ({ ...prev, semester: event.target.value }))}
            placeholder="e.g. 4"
          />
          <Input
            label="Search"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search title or description"
          />
          <div className="flex items-end">
            <Button type="button" variant="outline" className="w-full" onClick={handleReset}>
              Reset filters
            </Button>
          </div>
        </div>
      </Card>

      {quizzesQuery.isLoading ? (
        <Card className="p-6">
          <p className="text-sm text-gray-500">Loading quizzes...</p>
        </Card>
      ) : quizzesQuery.error ? (
        <Alert variant="error">Failed to load quizzes. Please try again later.</Alert>
      ) : quizzes.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-gray-500">No quizzes available at the moment.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  )
}

export default QuizList
