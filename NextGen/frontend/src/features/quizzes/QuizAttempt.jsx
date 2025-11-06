import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Alert, Card, Button, Badge } from '../../components/ui'
import Timer from '../../components/Timer'
import ProgressBar from '../../components/ProgressBar'
import { submitQuizAttempt } from './quizApi'

const QuizAttempt = () => {
  const { quizId, attemptId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const attemptData = location.state

  const [answers, setAnswers] = useState(() => {
    if (!attemptData?.questions) return {}
    const initial = {}
    attemptData.questions.forEach((question) => {
      initial[question.id] = null
    })
    return initial
  })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeSpent, setTimeSpent] = useState(0)

  useEffect(() => {
    if (!attemptData) {
      navigate(`/quizzes/${quizId}`)
    }
  }, [attemptData, navigate, quizId])

  const submitMutation = useMutation({
    mutationFn: (payload) => submitQuizAttempt(quizId, payload),
    onSuccess: (result) => {
      navigate(`/quizzes/${quizId}/results?attempt_id=${result.attempt_id}`, { replace: true })
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to submit quiz.'
      setError(message)
      setIsSubmitting(false)
    },
  })

  const questions = attemptData?.questions || []
  const quiz = attemptData?.quiz
  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers])

  const handleOptionChange = (questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }))
  }

  const handleSubmit = (autoSubmit = false) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setError('')

    const formattedAnswers = Object.entries(answers).map(([questionId, selected_option]) => ({
      question_id: questionId,
      selected_option,
    }))

    submitMutation.mutate({
      attempt_id: attemptId,
      answers: formattedAnswers,
      time_spent_seconds: timeSpent,
      auto_submit: autoSubmit,
    })
  }

  const handleTimerExpire = () => {
    handleSubmit(true)
  }

  useEffect(() => {
    if (!attemptData?.duration_seconds) return
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [attemptData])

  if (!attemptData || !questions.length) {
    return null
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">{quiz?.title}</h1>
            <p className="text-sm text-gray-500">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <p className="font-medium">Time remaining</p>
              <Timer durationSeconds={attemptData.duration_seconds} onExpire={handleTimerExpire} />
            </div>
            <Badge variant="outline">{answeredCount}/{questions.length} answered</Badge>
          </div>
        </div>

        <ProgressBar value={answeredCount} max={questions.length} />

        {error && (
          <Alert variant="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{currentQuestion.text}</h2>
            <p className="text-xs text-gray-500">Worth {currentQuestion.points} point(s)</p>
          </div>

          <div className="space-y-2">
            {currentQuestion.options.map((option) => (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  answers[currentQuestion.id] === option.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option.id}
                  checked={answers[currentQuestion.id] === option.id}
                  onChange={() => handleOptionChange(currentQuestion.id, option.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-800">{option.text}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap justify-between gap-3 pt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))}
                disabled={currentIndex === questions.length - 1}
              >
                Next
              </Button>
            </div>
            <Button
              type="button"
              onClick={() => handleSubmit(false)}
              loading={isSubmitting}
              variant="primary"
            >
              Submit quiz
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default QuizAttempt
