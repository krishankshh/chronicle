import ReplyCard from './ReplyCard'

const DiscussionThread = ({ replies, onLike, onDelete, onReply, currentUserId, canModerate }) => {
  if (!replies?.length) return null

  return (
    <div className="space-y-4">
      {replies.map((reply) => (
        <ReplyCard
          key={reply.id}
          reply={reply}
          depth={0}
          onLike={onLike}
          onDelete={onDelete}
          onReply={onReply}
          currentUserId={currentUserId}
          canModerate={canModerate}
        />
      ))}
    </div>
  )
}

export default DiscussionThread
