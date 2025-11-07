import { useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ImageIcon, Loader2 } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { Alert, Button, Card, Select, Textarea } from '../../components/ui'
import { createTimelinePost } from './timelineApi'
import { useToast } from '../../components/ui/ToastProvider'

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'campus', label: 'Campus' },
  { value: 'students', label: 'Students only' },
  { value: 'staff', label: 'Staff only' },
  { value: 'private', label: 'Only me' },
]

const MAX_CHAR = 600
const MAX_MEDIA_ITEMS = 4
const MEDIA_ACCEPT = 'image/png,image/jpeg,image/jpg,image/gif,video/mp4,video/webm,video/ogg,video/quicktime'

const TimelineComposer = ({ onCreated }) => {
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [tagsInput, setTagsInput] = useState('')
  const [mediaFiles, setMediaFiles] = useState([])
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  const mutation = useMutation({
    mutationFn: (formData) => createTimelinePost(formData),
    onSuccess: (data) => {
      setContent('')
      setTagsInput('')
      setMediaFiles([])
      setError('')
      queryClient.invalidateQueries({ queryKey: ['timeline', 'feed'] })
      queryClient.invalidateQueries({ queryKey: ['timeline', 'student'] })
      if (onCreated) {
        onCreated(data)
      }
      toast.success('Your update was published.')
    },
    onError: (err) => {
      const message = err.response?.data?.message || 'Failed to create post. Please try again.'
      setError(message)
      toast.error(message)
    },
  })

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const nextFiles = [...mediaFiles]
    for (const file of files) {
      if (nextFiles.length >= MAX_MEDIA_ITEMS) {
        setError(`You can attach up to ${MAX_MEDIA_ITEMS} media items per post.`)
        break
      }
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      if (!isImage && !isVideo) {
        setError(`Unsupported file type: ${file.name}`)
        continue
      }
      if (isImage && file.size > 15 * 1024 * 1024) {
        setError(`${file.name} exceeds the 15MB limit for images.`)
        continue
      }
      if (isVideo && file.size > 80 * 1024 * 1024) {
        setError(`${file.name} exceeds the 80MB limit for videos.`)
        continue
      }
      nextFiles.push(file)
    }
    setMediaFiles(nextFiles)
    event.target.value = ''
  }

  const removeMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, idx) => idx !== index))
  }

  const previewItems = useMemo(
    () =>
      mediaFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        isImage: file.type.startsWith('image/'),
        isVideo: file.type.startsWith('video/'),
      })),
    [mediaFiles]
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    if (!content.trim() && mediaFiles.length === 0) {
      setError('Write something or attach media before posting.')
      return
    }

    const formData = new FormData()
    formData.append('content', content.trim())
    formData.append('visibility', visibility)
    if (tagsInput.trim()) {
      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
      formData.append('tags', JSON.stringify(tags))
    }
    mediaFiles.forEach((file) => formData.append('media', file))
    mutation.mutate(formData)
  }

  return (
    <Card className="p-5 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
          {user?.student_img || user?.user_img ? (
            <img
              src={user.student_img || user.user_img}
              alt={user?.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{user?.name || 'Chronicle Member'}</p>
            <Select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
              options={VISIBILITY_OPTIONS}
              className="mt-1 text-sm"
              placeholder="Select visibility"
            />
          </div>
        </div>

        <Textarea
          rows={4}
          placeholder="Share an update, celebrate a win, or ask a question..."
          value={content}
          onChange={(event) => {
            const value = event.target.value
            if (value.length <= MAX_CHAR) {
              setContent(value)
            }
          }}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Use @mentions to highlight classmates.</span>
          <span>
            {content.length}/{MAX_CHAR}
          </span>
        </div>

        <input
          type="text"
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
          placeholder="Add tags separated by commas (e.g., announcement, exam, fest)"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />

        {previewItems.length > 0 && (
          <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-700">Attachments ({previewItems.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {previewItems.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="relative rounded-lg border border-gray-200 bg-white overflow-hidden"
                >
                  {item.isImage ? (
                    <img src={item.url} alt={item.name} className="h-40 w-full object-cover" />
                  ) : (
                    <video src={item.url} controls className="h-40 w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white"
                  >
                    Remove
                  </button>
                  <div className="px-3 py-2 text-xs text-gray-600 truncate border-t border-gray-100">
                    {item.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <Alert variant="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:border-primary-500 hover:text-primary-600"
            >
              <ImageIcon className="h-4 w-4" />
              Photo / Video
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={MEDIA_ACCEPT}
              multiple
              onChange={handleFileChange}
            />
            <span className="text-xs text-gray-400">
              {mediaFiles.length}/{MAX_MEDIA_ITEMS} attached
            </span>
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              'Share update'
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default TimelineComposer
