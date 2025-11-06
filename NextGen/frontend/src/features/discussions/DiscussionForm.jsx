import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import api from '../../lib/api'
import { Alert, Button, Card, Input, Select } from '../../components/ui'
import FileUploader from '../../components/FileUploader'
import { createDiscussion, fetchDiscussionById, updateDiscussion } from './discussionApi'

const DiscussionForm = ({ mode = 'create' }) => {
  const isEdit = mode === 'edit'
  const { discussionId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [courseId, setCourseId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [semester, setSemester] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')

  const coursesQuery = useQuery({
    queryKey: ['courses', 'discussions-form'],
    queryFn: async () => {
      const response = await api.get('/courses', { params: { limit: 100 } })
      return response.data?.courses || []
    },
  })

  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'discussions-form', courseId],
    queryFn: async () => {
      if (!courseId) return []
      const response = await api.get('/subjects', {
        params: { limit: 200, course_id: courseId },
      })
      return response.data?.subjects || []
    },
    enabled: !!courseId,
  })

  useQuery({
    queryKey: ['discussions', 'detail', discussionId],
    queryFn: () => fetchDiscussionById(discussionId),
    enabled: isEdit && !!discussionId,
    onSuccess: (data) => {
      setTitle(data.title || '')
      setContent(data.content || '')
      setCourseId(data.course_id || '')
      setSubjectId(data.subject_id || '')
      setSemester(data.semester || '')
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload) => createDiscussion(payload, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] })
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to create discussion.'
      setError(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload) => updateDiscussion(discussionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] })
      queryClient.invalidateQueries({ queryKey: ['discussions', 'detail', discussionId] })
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to update discussion.'
      setError(message)
    },
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (!content || content === '<p><br></p>') {
      setError('Content is required.')
      return
    }

    const payload = {
      title: title.trim(),
      content,
      course_id: courseId || null,
      subject_id: subjectId || null,
      semester: semester || null,
    }

    if (isEdit) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }

    navigate('/discussions')
  }

  const loading = createMutation.isPending || updateMutation.isPending

  const courseOptions = (coursesQuery.data || []).map((course) => ({
    value: course._id,
    label: course.course_name || course.course_code || 'Course',
  }))

  const subjectOptions = (subjectsQuery.data || []).map((subject) => ({
    value: subject._id,
    label: subject.subject_name || subject.subject_code || 'Subject',
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit discussion' : 'Start a discussion'}
          </h1>
          <p className="text-gray-600">
            Share resources, ask questions, or collaborate with your cohort.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/discussions')}>
          Back to discussions
        </Button>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <Input
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Discussion title"
              required
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <ReactQuill value={content} onChange={setContent} />
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
            <FileUploader onFilesChange={setFiles} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <Select
              label="Course"
              value={courseId}
              onChange={(event) => {
                setCourseId(event.target.value)
                setSubjectId('')
              }}
              options={[{ value: '', label: 'Select course' }, ...courseOptions]}
            />
            <Select
              label="Subject"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              disabled={!courseId}
              options={[{ value: '', label: 'Select subject' }, ...subjectOptions]}
            />
            <Input
              label="Semester"
              type="number"
              min={1}
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
            />
          </Card>

          <Card className="p-6">
            <div className="flex flex-col gap-3">
              <Button type="submit" loading={loading}>
                {isEdit ? 'Save changes' : 'Publish discussion'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/discussions')}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}

export default DiscussionForm
