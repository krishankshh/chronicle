import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, MessageSquare, Send, ThumbsUp, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import useAuthStore from '../../store/authStore'
import { Alert, Button, Textarea } from '../../components/ui'
import {
  createTimelineComment,
  deleteTimelineComment,
  fetchTimelineComments,
  toggleTimelineCommentLike,
} from './timelineApi'

const TimelineComments = ({ postId }) => {
  const queryClient = useQueryClient()
  const { user, role } = useAuthStore()
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['timeline', 'comments', postId],
    queryFn: ({ pageParam = 1 }) => fetchTimelineComments(postId, { page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined
      const hasMore = lastPage.page * lastPage.limit < lastPage.total
      return hasMore ? lastPage.page + 1 : undefined
    },
    staleTime: 10 * 1000,
  })

  const comments = data?.pages.flatMap((page) => page.comments) ?? []

  const createMutation = useMutation({
    mutationFn: (payload) => createTimelineComment(postId, payload),
    onSuccess: () => {
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['timeline', 'comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['timeline', 'feed'] })
      queryClient.invalidateQueries({ queryKey: ['timeline', 'student'] })
    },
    onError: (err) => {
      const message = err.response?.data?.message || 'Failed to add comment.'
      setError(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId) => deleteTimelineComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', 'comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['timeline', 'feed'] })
    },
  })

  const likeMutation = useMutation({
    mutationFn: (commentId) => toggleTimelineCommentLike(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', 'comments', postId] })
    },
  })

  const currentUserId = user?.id

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!content.trim()) {
      setError('Add a message before posting.')
      return
    }
    setError('')
    createMutation.mutate({ content: content.trim() })
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          rows={2}
          placeholder="Write a comment..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        {error && (
          <Alert variant="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Share constructive, respectful feedback.</span>
          <Button type="submit" size="sm" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Posting
              </>
            ) : (
              <>
                <Send className="mr-1 h-4 w-4" />
                Comment
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            No comments yet. Start the conversation!
          </p>
        ) : (
          comments.map((comment) => {
            const canModify =
              comment.created_by === currentUserId || role === 'staff' || role === 'admin'
            return (
              <div key={comment.id} className="rounded-xl bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{comment.author_name}</p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <button
                      type="button"
                      onClick={() => likeMutation.mutate(comment.id)}
                      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 transition text-xs ${
                        comment.is_liked
                          ? 'border-primary-200 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-200'
                      }`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      {comment.likes_count}
                    </button>
                    {canModify && (
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(comment.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            )
          })
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <button type="button" onClick={() => refetch()} className="hover:text-primary-600">
          Refresh comments
        </button>
        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 hover:border-primary-500 hover:text-primary-600 disabled:opacity-60"
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default TimelineComments
