import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import { Button, Card, Input, Select, Textarea, Badge } from '../../components/ui'
import { createQuiz, updateQuiz, fetchQuizById } from './quizApi'

const defaultValues = {
  title: '',
  description: '',
  course_id: '',
  subject_id: '',
  semester: '',
  duration_minutes: 30,
  status: 'draft',
  is_randomized: false,
  allow_multiple_attempts: false,
}

const QuizForm = ({ mode = 'create' }) => {
  const isEdit = mode === 'edit'
  const { quizId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
  })

  const selectedCourse = watch('course_id')

  const coursesQuery = useQuery({
    queryKey: ['courses', 'quiz-form'],
    queryFn: async () => {
      const response = await api.get('/courses', { params: { limit: 100 } })
      return response.data?.courses || []
    },
  })

  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'quiz-form', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return []
      const response = await api.get('/subjects', { params: { limit: 200, course_id: selectedCourse } })
      return response.data?.subjects || []
    },
    enabled: Boolean(selectedCourse),
  })

  const quizQuery = useQuery({
    queryKey: ['quizzes', 'detail', quizId],
    queryFn: () => fetchQuizById(quizId),
    enabled: isEdit && !!quizId,
  })

  useEffect(() => {
    if (quizQuery.data) {
      const quiz = quizQuery.data
      reset({
        title: quiz.title || '',
        description: quiz.description || '',
        course_id: quiz.course_id || '',
        subject_id: quiz.subject_id || '',
        semester: quiz.semester || '',
        duration_minutes: quiz.duration_minutes || 30,
        status: quiz.status || 'draft',
        is_randomized: quiz.is_randomized || false,
        allow_multiple_attempts: quiz.allow_multiple_attempts || false,
      })
    }
  }, [quizQuery.data, reset])

  const createMutation = useMutation({
    mutationFn: createQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateQuiz(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] })
      queryClient.invalidateQueries({ queryKey: ['quizzes', 'detail', quizId] })
    },
  })

  const onSubmit = async (values) => {
    const payload = {
      title: values.title.trim(),
      description: values.description,
      course_id: values.course_id || null,
      subject_id: values.subject_id || null,
      semester: values.semester ? Number(values.semester) : null,
      duration_minutes: Number(values.duration_minutes) || 30,
      status: values.status,
      is_randomized: Boolean(values.is_randomized),
      allow_multiple_attempts: Boolean(values.allow_multiple_attempts),
    }

    if (isEdit) {
      await updateMutation.mutateAsync({ id: quizId, payload })
    } else {
      await createMutation.mutateAsync(payload)
    }

    navigate('/admin/quizzes')
  }

  const coursesOptions = (coursesQuery.data || []).map((course) => ({
    value: course._id,
    label: course.course_name || course.course_code || 'Course',
  }))

  const subjectsOptions = (subjectsQuery.data || []).map((subject) => ({
    value: subject._id,
    label: subject.subject_name || subject.subject_code || 'Subject',
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit quiz' : 'Create quiz'}</h1>
          <p className="text-gray-600">Define quiz metadata before adding questions.</p>
        </div>
        {quizQuery.data?.questions_count !== undefined && (
          <Badge variant="outline">{quizQuery.data.questions_count} question(s)</Badge>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <Input
              label="Title"
              {...register('title', { required: 'Title is required' })}
              error={errors.title?.message}
              placeholder="e.g. Algorithms Midterm"
              required
            />

            <Textarea
              label="Description"
              rows={6}
              {...register('description')}
              placeholder="Add instructions or overview for the quiz..."
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <Select
              label="Course"
              value={watch('course_id')}
              onChange={(event) => {
                setValue('course_id', event.target.value)
                setValue('subject_id', '')
              }}
              options={[{ value: '', label: 'Select course' }, ...coursesOptions]}
            />

            <Select
              label="Subject"
              value={watch('subject_id')}
              onChange={(event) => setValue('subject_id', event.target.value)}
              options={[{ value: '', label: 'Select subject' }, ...subjectsOptions]}
              disabled={!watch('course_id')}
            />

            <Input
              label="Semester"
              type="number"
              min={1}
              {...register('semester')}
            />

            <Input
              label="Duration (minutes)"
              type="number"
              min={5}
              {...register('duration_minutes', { valueAsNumber: true })}
              error={errors.duration_minutes?.message}
            />

            <Select
              label="Status"
              value={watch('status')}
              onChange={(event) => setValue('status', event.target.value)}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
              ]}
            />

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...register('is_randomized')} />
              Randomize question order
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...register('allow_multiple_attempts')} />
              Allow multiple attempts
            </label>
          </Card>

          <Card className="p-6">
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
              >
                {isEdit ? 'Save changes' : 'Create quiz'}
              </Button>
              <Button variant="outline" type="button" onClick={() => navigate('/admin/quizzes')}>
                Cancel
              </Button>
              {isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/admin/quizzes/${quizId}/questions`)}
                >
                  Manage questions
                </Button>
              )}
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}

export default QuizForm
