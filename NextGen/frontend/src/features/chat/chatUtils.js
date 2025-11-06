export const getRoomKey = (type, id) => `${type}:${id}`

export const extractParticipant = (chat, currentUserId) => {
  if (!chat) {
    return {}
  }
  const participants = chat.participants || []
  const otherId = participants.find((participantId) => participantId !== currentUserId) || participants[0]
  const metaCandidates = chat.participant_meta || []
  const meta =
    metaCandidates.find(
      (item) =>
        item.user_id === otherId ||
        item.id === otherId ||
        item._id === otherId ||
        item.user_id !== currentUserId
    ) || metaCandidates[0] || {}

  return {
    id: otherId,
    name: meta.name || meta.display_name || meta.email || 'Conversation',
    email: meta.email,
    avatar: meta.avatar || meta.photo_url || meta.student_img || null,
    role: meta.role,
    meta,
  }
}
