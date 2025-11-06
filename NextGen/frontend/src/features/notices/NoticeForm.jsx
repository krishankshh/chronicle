import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

import { Button, Card, Input, Select, Alert } from '../../components/ui'
import ImageUpload from '../../components/ImageUpload'
import useAuthStore from '../../store/authStore'
import { NOTICE_TYPES, NOTICE_STATUSES } from './constants'
import {
  createNotice,
  updateNotice,
  uploadNoticeImage,
  fetchNoticeById,
} from './noticeApi'

const noticeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  summary: z.string().optional(),
  type: z.enum(['news', 'events', 'meetings']),
  status: z.enum(['draft', 'published']),
  publish_start: z.string().optional(),
  publish_end: z.string().optional(),
  is_featured: z.boolean().optional(),
})

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
}

const EMPTY_RICH_TEXT = '<p><br></p>'

const toInputDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 16)
}

const toIsoString = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const defaultDateTimeValue = () => new Date().toISOString().slice(0, 16)

const NoticeForm = ({ mode = 'create' }) => {
  const isEdit = mode === 'edit'
  const { noticeId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { role } = useAuthStore()
  const isAuthorized = role === 'admin' || role === 'staff'

  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [serverError, setServerError] = useState('')

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: '',
      summary: '',
      type: 'news',
      status: 'draft',
      publish_start: defaultDateTimeValue(),
      publish_end: '',
      is_featured: false,
    },
  })

  const { data: noticeData, isLoading: isLoadingNotice } = useQuery({
    queryKey: ['notices', 'detail', noticeId],
    queryFn: () => fetchNoticeById(noticeId),
    enabled: isAuthorized && isEdit && !!noticeId,
  })

  useEffect(() => {
    if (noticeData) {
      reset({
        title: noticeData.title || '',
        summary: noticeData.summary || '',
        type: noticeData.type || 'news',
        status: noticeData.status || 'draft',
        publish_start: toInputDateTime(noticeData.publish_start) || defaultDateTimeValue(),
        publish_end: toInputDateTime(noticeData.publish_end) || '',
        is_featured: noticeData.is_featured ?? false,
      })
      setContent(noticeData.content || '')
      setImageFile(null)
    }
  }, [noticeData, reset])

  const createMutation = useMutation({
    mutationFn: createNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateNotice(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      if (noticeId) {
        queryClient.invalidateQueries({ queryKey: ['notices', 'detail', noticeId] })
      }
    },
  })

  const imageMutation = useMutation({
    mutationFn: ({ id, file }) => uploadNoticeImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      if (noticeId) {
        queryClient.invalidateQueries({ queryKey: ['notices', 'detail', noticeId] })
      }
    },
  })

  const onSubmit = async (values) => {
    setServerError('')

    if (!content || content === EMPTY_RICH_TEXT) {
      setServerError('Please add notice content.')
      return
    }

    if (values.publish_start && values.publish_end) {
      const startDate = new Date(values.publish_start)
      const endDate = new Date(values.publish_end)
      if (endDate < startDate) {
        setServerError('Publish end must be greater than publish start.')
        return
      }
    }

    const payload = {
      title: values.title.trim(),
      summary: values.summary?.trim() || null,
      content,
      type: values.type,
      status: values.status,
      is_featured: Boolean(values.is_featured),
      publish_start: toIsoString(values.publish_start),
      publish_end: toIsoString(values.publish_end),
    }

    try {
      let noticeIdResult = noticeId
      if (isEdit) {
        const updated = await updateMutation.mutateAsync({ id: noticeIdResult, payload })
        noticeIdResult = updated.id
      } else {
        const created = await createMutation.mutateAsync(payload)
        noticeIdResult = created.id
      }

      if (imageFile) {
        await imageMutation.mutateAsync({ id: noticeIdResult, file: imageFile })
      }

      navigate('/admin/notices')
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to save notice'
      setServerError(message)
    }
  }

  const loading = isSubmitting || createMutation.isPending || updateMutation.isPending || imageMutation.isPending

  const quillModules = useMemo(() => modules, [])

  if (!isAuthorized) {
    return (
      <Alert variant="error">
        You do not have permission to manage notices.
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Notice' : 'Create Notice'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update the notice details and publish when ready.' : 'Fill out the form to publish a new notice.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

      {(serverError || createMutation.error || updateMutation.error || imageMutation.error) && (
        <Alert variant="error">
          {serverError ||
            createMutation.error?.response?.data?.message ||
            updateMutation.error?.response?.data?.message ||
            imageMutation.error?.response?.data?.message ||
            'Something went wrong'}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-6">
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <Input
              label="Title"
              placeholder="Enter notice title"
              {...register('title')}
              error={errors.title?.message}
              required
            />

            <Input
              label="Summary"
              placeholder="Optional summary (shown on cards)"
              {...register('summary')}
              error={errors.summary?.message}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Content</label>
              {isLoadingNotice && isEdit ? (
                <Card className="p-4">
                  <p className="text-sm text-gray-500">Loading content…</p>
                </Card>
              ) : (
                <Controller
                  control={control}
                  name="content"
                  defaultValue=""
                  render={() => (
                    <ReactQuill
                      theme="snow"
                      value={content}
                      onChange={setContent}
                      modules={quillModules}
                      placeholder="Write the notice details..."
                    />
                  )}
                />
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <Select
              label="Notice Type"
              options={NOTICE_TYPES}
              {...register('type')}
              error={errors.type?.message}
              required
            />

            <Select
              label="Status"
              options={NOTICE_STATUSES}
              {...register('status')}
              error={errors.status?.message}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Publish Start</label>
              <input
                type="datetime-local"
                className="input"
                {...register('publish_start')}
              />
              {errors.publish_start && (
                <p className="text-sm text-red-600">{errors.publish_start.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Publish End</label>
              <input
                type="datetime-local"
                className="input"
                {...register('publish_end')}
              />
              {errors.publish_end && (
                <p className="text-sm text-red-600">{errors.publish_end.message}</p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('is_featured')}
              />
              Mark as featured
            </label>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Featured Image</h2>
            <ImageUpload
              currentImage={noticeData?.cover_image_url || noticeData?.cover_image || null}
              onImageSelect={setImageFile}
              label="Select image"
              shape="square"
              maxSize={5}
            />
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/notices')}
            >
              Back to list
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? 'Update Notice' : 'Create Notice'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default NoticeForm
