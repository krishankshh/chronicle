import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { Alert, Card } from '../../components/ui'
import { deleteTimelinePost, toggleTimelinePostLike } from './timelineApi'
import TimelineComments from './TimelineComments'

const MediaGallery = ({ media }) => {
  if (!media?.length) return null
  const images = media.filter((item) => item.media_type === 'image')
  const videos = media.filter((item) => item.media_type === 'video')

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div
          className={`grid gap-3 ${
            images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
          }`}
        >
          {images.map((image) => (
            <img
              key={image.id}
              src={image.file_url || image.path}
              alt={image.original_name}
              className="h-64 w-full rounded-2xl object-cover"
            />
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((video) => (
            <video
              key={video.id}
              src={video.file_url || video.path}
              controls
              className="h-72 w-full rounded-2xl bg-black object-cover"
            />
          ))}
        </div>
      )}
    </div>
  )
}

const TimelinePostCard = ({ post }) => {
  const queryClient = useQueryClient()
  const { user, role } = useAuthStore()
  const [showComments, setShowComments] = useState(false)
  const [error, setError] = useState('')
  const isOwner = post.created_by === user?.id

  const likeMutation = useMutation({
    mutationFn: () => toggleTimelinePostLike(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', 'feed'] })
      queryClient.invalidateQueries({ queryKey: ['timeline', 'student'] })
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to update like.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTimelinePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', 'feed'] })
      queryClient.invalidateQueries({ queryKey: ['timeline', 'student'] })
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to delete post.')
    },
  })

  const canModify = isOwner || role === 'staff' || role === 'admin'

  return (
    <Card className="divide-y divide-gray-100">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {post.author_avatar ? (
              <img
                src={post.author_avatar}
                alt={post.author_name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold">
                {post.author_name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{post.author_name}</p>
              <p className="text-xs text-gray-500">
                {post.author_role} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {canModify ? (
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              className="rounded-full border border-red-100 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-1 inline-block h-3 w-3" />
              Delete
            </button>
          ) : (
            <button type="button" className="rounded-full border border-gray-200 p-2 text-gray-500 hover:text-primary-600">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        </div>

        {post.content && (
          <p className="whitespace-pre-line text-gray-800 leading-relaxed">{post.content}</p>
        )}

        <MediaGallery media={post.media} />

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {error && (
          <Alert variant="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <div className="flex flex-wrap items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => likeMutation.mutate()}
              className={`flex items-center gap-2 rounded-full border px-4 py-1 font-medium ${
                post.is_liked
                  ? 'border-primary-200 bg-primary-50 text-primary-600'
                  : 'border-gray-200 hover:border-primary-200 hover:text-primary-600'
              }`}
            >
              <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-primary-500 text-primary-500' : ''}`} />
              {post.likes_count}
            </button>
            <button
              type="button"
              onClick={() => setShowComments((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-1 hover:border-primary-200 hover:text-primary-600"
            >
              <MessageCircle className="h-4 w-4" />
              {post.comments_count}
            </button>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:border-primary-200"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      </div>

      {showComments && (
        <div className="p-5 bg-gray-50">
          <TimelineComments postId={post.id} />
        </div>
      )}
    </Card>
  )
}

export default TimelinePostCard
