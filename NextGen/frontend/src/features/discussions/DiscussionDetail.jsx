import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { Alert, Badge, Card, Button } from '../../components/ui'
import { formatDateTime } from '../../lib/utils'
import useAuthStore from '../../store/authStore'
import {
  fetchDiscussionById,
  fetchDiscussionReplies,
  createDiscussionReply,
  deleteDiscussion,
  toggleDiscussionLike,
  deleteDiscussionReply,
  toggleReplyLike,
} from './discussionApi'
import ReplyComposer from './ReplyComposer'
import DiscussionThread from './DiscussionThread'

const DiscussionDetail = () => {
  const { discussionId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, role } = useAuthStore()

  const discussionQuery = useQuery({
    queryKey: ['discussions', 'detail', discussionId],
    queryFn: () => fetchDiscussionById(discussionId),
    enabled: !!discussionId,
  })

  const repliesQuery = useQuery({
    queryKey: ['discussions', discussionId, 'replies'],
    queryFn: () => fetchDiscussionReplies(discussionId),
    enabled: !!discussionId,
  })

  const replyMutation = useMutation({
    mutationFn: ({ payload, files }) => createDiscussionReply(discussionId, payload, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', discussionId, 'replies'] })
      queryClient.invalidateQueries({ queryKey: ['discussions', 'detail', discussionId] })
    },
  })

  const deleteDiscussionMutation = useMutation({
    mutationFn: () => deleteDiscussion(discussionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] })
      navigate('/discussions')
    },
  })

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId) => deleteDiscussionReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', discussionId, 'replies'] })
      queryClient.invalidateQueries({ queryKey: ['discussions', 'detail', discussionId] })
    },
  })

  const handleLikeDiscussion = async () => {
    try {
      await toggleDiscussionLike(discussionId)
      queryClient.invalidateQueries({ queryKey: ['discussions', 'detail', discussionId] })
      queryClient.invalidateQueries({ queryKey: ['discussions'] })
    } catch (error) {
      console.error(error)
    }
  }

  const handleLikeReply = async (replyId) => {
    try {
      await toggleReplyLike(replyId)
      queryClient.invalidateQueries({ queryKey: ['discussions', discussionId, 'replies'] })
    } catch (error) {
      console.error(error)
    }
  }

  const handleReplySubmit = async ({ payload, files }) => {
    await replyMutation.mutateAsync({ payload, files })
  }

  if (discussionQuery.isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">Loading discussion...</p>
      </Card>
    )
  }

  if (discussionQuery.error || !discussionQuery.data) {
    return <Alert variant="error">Discussion not found.</Alert>
  }

  const discussion = discussionQuery.data
  const replies = repliesQuery.data || []

  const canModifyDiscussion =
    role === 'admin' || role === 'staff' || discussion.created_by === user?.id

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{discussion.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>By {discussion.author_name || 'Anonymous'}</span>
              <span>{formatDateTime(discussion.created_at)}</span>
              {discussion.semester && <Badge variant="outline">Semester {discussion.semester}</Badge>}
              <Badge variant="outline">{discussion.reply_count} replies</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleLikeDiscussion}>
              👍 {discussion.likes_count}
            </Button>
            {canModifyDiscussion && (
              <>
                <Button variant="outline" onClick={() => navigate(`/discussions/${discussionId}/edit`)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => deleteDiscussionMutation.mutate()}
                  loading={deleteDiscussionMutation.isPending}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {discussion.attachments?.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-900">Attachments</h2>
            <ul className="space-y-1 text-sm text-primary-600">
              {discussion.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                    {attachment.original_name || attachment.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: discussion.content }}
        />
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Replies</h2>
        {repliesQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading replies...</p>
        ) : repliesQuery.error ? (
          <Alert variant="error">Failed to load replies.</Alert>
        ) : replies.length === 0 ? (
          <p className="text-sm text-gray-500">No replies yet. Start the conversation!</p>
        ) : (
          <DiscussionThread
            replies={replies}
            onLike={handleLikeReply}
            onDelete={(replyId) => deleteReplyMutation.mutate(replyId)}
            onReply={handleReplySubmit}
            currentUserId={user?.id}
            canModerate={['admin', 'staff'].includes(role)}
          />
        )}
      </Card>

      <ReplyComposer
        onSubmit={handleReplySubmit}
        loading={replyMutation.isPending}
      />
    </div>
  )
}

export default DiscussionDetail
