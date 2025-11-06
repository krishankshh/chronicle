import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { Alert, Button, Card, Input, Select, Textarea } from '../../components/ui'
import FileUploader from '../../components/FileUploader'
import {
  createMaterial,
  updateMaterial,
  fetchMaterialById,
  uploadMaterialFiles,
  deleteMaterialAttachment,
} from './materialsApi'

const defaultValues = {
  title: '',
  description: '',
  course_id: '',
  subject_id: '',
  semester: '',
  tagsInput: '',
}

const MaterialForm = ({ mode = 'create' }) => {
  const isEdit = mode === 'edit'
  const { materialId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { role } = useAuthStore()

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

  const [newFiles, setNewFiles] = useState([])
  const [formError, setFormError] = useState('')

  const selectedCourse = watch('course_id')

  const { data: coursesData } = useQuery({
    queryKey: ['courses', 'material-form'],
    queryFn: async () => {
      const response = await api.get('/courses', { params: { limit: 100 } })
      return response.data?.courses || []
    },
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', 'material-form', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return []
      const response = await api.get('/subjects', {
        params: { limit: 200, course_id: selectedCourse },
      })
      return response.data?.subjects || []
    },
    enabled: Boolean(selectedCourse),
  })

  const materialQuery = useQuery({
    queryKey: ['materials', 'detail', materialId],
    queryFn: () => fetchMaterialById(materialId),
    enabled: isEdit && !!materialId,
  })

  useEffect(() => {
    if (materialQuery.data) {
      const material = materialQuery.data
      reset({
        title: material.title || '',
        description: material.description || '',
        course_id: material.course_id || '',
        subject_id: material.subject_id || '',
        semester: material.semester || '',
        tagsInput: material.tags?.join(', ') || '',
      })
    }
  }, [materialQuery.data, reset])

  const coursesOptions = useMemo(
    () =>
      (coursesData || []).map((course) => ({
        value: course._id,
        label: course.course_name || course.course_code || 'Course',
      })),
    [coursesData]
  )

  const subjectsOptions = useMemo(
    () =>
      (subjectsData || []).map((subject) => ({
        value: subject._id,
        label: subject.subject_name || subject.subject_code || 'Subject',
      })),
    [subjectsData]
  )

  const createMutation = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateMaterial(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['materials', 'detail', variables.id] })
    },
  })

  const uploadMutation = useMutation({
    mutationFn: ({ id, files }) => uploadMaterialFiles(id, files),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materials', 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })

  const removeAttachmentMutation = useMutation({
    mutationFn: ({ id, attachmentId }) => deleteMaterialAttachment(id, attachmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materials', 'detail', variables.id] })
    },
  })

  const onSubmit = async (values) => {
    setFormError('')
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description || '',
        course_id: values.course_id || null,
        subject_id: values.subject_id || null,
        semester: values.semester ? Number(values.semester) : null,
        tags: values.tagsInput
          ? values.tagsInput
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      }

      let materialIdentifier = materialId

      if (isEdit) {
        const updated = await updateMutation.mutateAsync({ id: materialId, payload })
        materialIdentifier = updated.id
      } else {
        const created = await createMutation.mutateAsync(payload)
        materialIdentifier = created.id
      }

      if (newFiles.length) {
        await uploadMutation.mutateAsync({ id: materialIdentifier, files: newFiles })
        setNewFiles([])
      }

      navigate('/admin/materials')
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to save study material.'
      setFormError(message)
    }
  }

  if (!['staff', 'admin'].includes(role)) {
    return (
      <Alert variant="error">
        You do not have permission to manage study materials.
      </Alert>
    )
  }

  const existingAttachments = materialQuery.data?.attachments || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Study Material' : 'Create Study Material'}</h1>
          <p className="text-gray-600">
            {isEdit ? 'Update the resource details and manage attachments.' : 'Provide the details and upload the documents students will download.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

      {formError && (
        <Alert variant="error" onClose={() => setFormError('')}>
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <Input
              label="Title"
              placeholder="e.g. Data Structures Lecture Notes"
              {...register('title', { required: 'Title is required' })}
              error={errors.title?.message}
              required
            />

            <Textarea
              label="Description"
              placeholder="Provide an overview of the material..."
              rows={6}
              {...register('description')}
            />

            <Input
              label="Tags"
              placeholder="Comma separated tags, e.g., Algorithms, Exam Prep"
              {...register('tagsInput')}
            />
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Upload attachments</h2>
            <FileUploader onFilesChange={setNewFiles} />
            {newFiles.length > 0 && (
              <p className="text-sm text-gray-500">{newFiles.length} file(s) ready to upload.</p>
            )}

            {existingAttachments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">Existing attachments</h3>
                <ul className="space-y-2">
                  {existingAttachments.map((attachment) => (
                    <li
                      key={attachment.id}
                      className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {attachment.original_name || attachment.name}
                        </p>
                        <p className="text-xs text-gray-500">{attachment.content_type || 'document'}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          removeAttachmentMutation.mutate({ id: materialId, attachmentId: attachment.id })
                        }
                        loading={
                          removeAttachmentMutation.isPending &&
                          removeAttachmentMutation.variables?.attachmentId === attachment.id
                        }
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <Select
              label="Course"
              placeholder="Select course"
              value={watch('course_id')}
              onChange={(event) => {
                setValue('course_id', event.target.value)
                setValue('subject_id', '')
              }}
              options={[{ value: '', label: 'Select course' }, ...coursesOptions]}
            />

            <Select
              label="Subject"
              placeholder="Select subject"
              value={watch('subject_id')}
              onChange={(event) => setValue('subject_id', event.target.value)}
              options={[{ value: '', label: 'Select subject' }, ...subjectsOptions]}
              disabled={!watch('course_id')}
            />

            <Input
              label="Semester"
              type="number"
              min={1}
              placeholder="e.g. 4"
              {...register('semester', {
                min: { value: 1, message: 'Semester must be at least 1' },
              })}
              error={errors.semester?.message}
            />
          </Card>

          <Card className="p-6">
            <div className="flex flex-col gap-3">
              <Button type="submit" loading={isSubmitting || createMutation.isPending || updateMutation.isPending || uploadMutation.isPending}>
                {isEdit ? 'Update material' : 'Create material'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/admin/materials')}>
                Back to list
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}

export default MaterialForm
