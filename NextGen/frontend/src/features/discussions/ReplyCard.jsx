import { useState } from 'react'
import { Card, Button, Badge } from '../../components/ui'
import ReplyComposer from './ReplyComposer'
import { formatDateTime } from '../../lib/utils'

const ReplyCard = ({ reply, depth, onLike, onDelete, onReply, currentUserId, canModerate }) => {
  const [showReplyComposer, setShowReplyComposer] = useState(false)

  const handleReply = async ({ payload, files }) => {
    if (onReply) {
      await onReply({ payload, files })
      setShowReplyComposer(false)
    }
  }

  const allowDelete = canModerate || reply.created_by === currentUserId

  return (
    <div className="space-y-3">
      <Card className="space-y-3 border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">
              {reply.author_name || 'Anonymous'}
              {reply.author_role && (
                <Badge variant="outline" className="ml-2">
                  {reply.author_role}
                </Badge>
              )}
            </p>
            <p className="text-xs text-gray-500">{formatDateTime(reply.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onLike(reply.id)}>
              👍 {reply.likes_count}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReplyComposer((prev) => !prev)}
            >
              Reply
            </Button>
            {allowDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(reply.id)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        <div
          className="prose max-w-none text-sm text-gray-800"
          dangerouslySetInnerHTML={{ __html: reply.content }}
        />

        {reply.attachments?.length > 0 && (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-700">Attachments</p>
            <ul className="mt-1 space-y-1 text-xs text-primary-600">
              {reply.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                    {attachment.original_name || attachment.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {showReplyComposer && (
        <div className="ml-6">
          <ReplyComposer
            parentReplyId={reply.id}
            onSubmit={handleReply}
            loading={false}
          />
        </div>
      )}

      {reply.children?.length > 0 && (
        <div className="ml-6 space-y-3">
          {reply.children.map((child) => (
            <ReplyCard
              key={child.id}
              reply={child}
              depth={depth + 1}
              onLike={onLike}
              onDelete={onDelete}
              onReply={onReply}
              currentUserId={currentUserId}
              canModerate={canModerate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ReplyCard
