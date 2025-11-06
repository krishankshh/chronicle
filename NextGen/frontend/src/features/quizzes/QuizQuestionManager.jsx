import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Badge, Button, Card, Input, Modal, Textarea } from '../../components/ui'
import {
  fetchQuizById,
  fetchQuizQuestions,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
} from './quizApi'

const emptyQuestion = {
  text: '',
  options: ['', '', '', ''],
  correct_option: '',
  explanation: '',
  points: 1,
}

const QuizQuestionManager = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [questionForm, setQuestionForm] = useState(emptyQuestion)
  const [error, setError] = useState('')

  const quizQuery = useQuery({
    queryKey: ['quizzes', 'detail', quizId],
    queryFn: () => fetchQuizById(quizId),
    enabled: !!quizId,
  })

  const questionsQuery = useQuery({
    queryKey: ['quizzes', quizId, 'questions'],
    queryFn: () => fetchQuizQuestions(quizId),
    enabled: !!quizId,
  })

  const createMutation = useMutation({
    mutationFn: (payload) => createQuizQuestion(quizId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', quizId, 'questions'] })
      queryClient.invalidateQueries({ queryKey: ['quizzes', 'detail', quizId] })
      setShowQuestionModal(false)
      setQuestionForm(emptyQuestion)
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to add question.'
      setError(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateQuizQuestion(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', quizId, 'questions'] })
      setShowQuestionModal(false)
      setEditingQuestion(null)
      setQuestionForm(emptyQuestion)
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to update question.'
      setError(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteQuizQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', quizId, 'questions'] })
      queryClient.invalidateQueries({ queryKey: ['quizzes', 'detail', quizId] })
    },
  })

  const openModal = (question = null) => {
    setError('')
    setEditingQuestion(question)
    if (question) {
      setQuestionForm({
        text: question.text,
        options: question.options.map((opt) => opt.text),
        correct_option: question.options.find((opt) => opt.id === question.correct_option)?.text || '',
        explanation: question.explanation || '',
        points: question.points || 1,
      })
    } else {
      setQuestionForm(emptyQuestion)
    }
    setShowQuestionModal(true)
  }

  const handleOptionChange = (index, value) => {
    setQuestionForm((prev) => {
      const nextOptions = [...prev.options]
      nextOptions[index] = value
      return { ...prev, options: nextOptions }
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = {
      text: questionForm.text,
      options: questionForm.options.filter(Boolean),
      correct_option: questionForm.correct_option,
      explanation: questionForm.explanation,
      points: Number(questionForm.points) || 1,
    }

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const questions = questionsQuery.data || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question bank</h1>
          <p className="text-gray-600">
            Manage the questions that appear in <span className="font-medium">{quizQuery.data?.title}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/quizzes')}>
            Back to quizzes
          </Button>
          <Button onClick={() => openModal()}>
            Add question
          </Button>
        </div>
      </div>

      {questionsQuery.isLoading ? (
        <Card className="p-6">
          <p className="text-sm text-gray-500">Loading questions...</p>
        </Card>
      ) : questionsQuery.error ? (
        <Alert variant="error">Failed to load questions.</Alert>
      ) : questions.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-gray-500">No questions yet. Add your first one.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Question {index + 1}</p>
                  <h2 className="text-lg font-semibold text-gray-900">{question.text}</h2>
                </div>
                <Badge variant="outline">{question.points} point(s)</Badge>
              </div>

              <div className="space-y-2">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className={`rounded-lg border px-4 py-2 text-sm ${
                      option.id === question.correct_option ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    {option.text}
                  </div>
                ))}
              </div>

              {question.explanation && (
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  Explanation: {question.explanation}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openModal(question)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteMutation.mutate(question.id)}
                  loading={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        title={editingQuestion ? 'Edit question' : 'Add question'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowQuestionModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingQuestion ? 'Save changes' : 'Add question'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Textarea
            label="Question text"
            value={questionForm.text}
            onChange={(event) => setQuestionForm((prev) => ({ ...prev, text: event.target.value }))}
            required
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Options</p>
            {questionForm.options.map((option, index) => (
              <Input
                key={index}
                value={option}
                onChange={(event) => handleOptionChange(index, event.target.value)}
                placeholder={`Option ${index + 1}`}
                required={index < 2}
              />
            ))}
          </div>
          <Input
            label="Correct option"
            value={questionForm.correct_option}
            onChange={(event) => setQuestionForm((prev) => ({ ...prev, correct_option: event.target.value }))}
            placeholder="Copy the exact text of the correct option"
            required
          />
          <Input
            label="Points"
            type="number"
            min={0.5}
            step={0.5}
            value={questionForm.points}
            onChange={(event) => setQuestionForm((prev) => ({ ...prev, points: event.target.value }))}
          />
          <Textarea
            label="Explanation (optional)"
            value={questionForm.explanation}
            onChange={(event) => setQuestionForm((prev) => ({ ...prev, explanation: event.target.value }))}
          />
        </form>
      </Modal>
    </div>
  )
}

export default QuizQuestionManager
