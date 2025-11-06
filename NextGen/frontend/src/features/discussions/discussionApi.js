import api from '../../lib/api'

export const fetchDiscussions = async (params = {}) => {
  const response = await api.get('/discussions', { params })
  return response.data
}

export const fetchDiscussionById = async (discussionId) => {
  const response = await api.get(`/discussions/${discussionId}`)
  return response.data
}

export const fetchDiscussionReplies = async (discussionId) => {
  const response = await api.get(`/discussions/${discussionId}/replies`)
  return response.data
}

export const createDiscussion = async (payload, files = []) => {
  if (files.length === 0) {
    const response = await api.post('/discussions', payload)
    return response.data
  }

  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value)
    }
  })
  files.forEach((file) => formData.append('files', file))

  const response = await api.post('/discussions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const updateDiscussion = async (discussionId, payload) => {
  const response = await api.put(`/discussions/${discussionId}`, payload)
  return response.data
}

export const deleteDiscussion = async (discussionId) => {
  const response = await api.delete(`/discussions/${discussionId}`)
  return response.data
}

export const createDiscussionReply = async (discussionId, payload, files = []) => {
  if (files.length === 0) {
    const response = await api.post(`/discussions/${discussionId}/reply`, payload)
    return response.data
  }

  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value)
    }
  })
  files.forEach((file) => formData.append('files', file))

  const response = await api.post(`/discussions/${discussionId}/reply`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const updateDiscussionReply = async (replyId, payload) => {
  const response = await api.put(`/discussions/replies/${replyId}`, payload)
  return response.data
}

export const deleteDiscussionReply = async (replyId) => {
  const response = await api.delete(`/discussions/replies/${replyId}`)
  return response.data
}

export const toggleDiscussionLike = async (discussionId) => {
  const response = await api.post(`/discussions/${discussionId}/like`)
  return response.data
}

export const toggleReplyLike = async (replyId) => {
  const response = await api.post(`/discussions/replies/${replyId}/like`)
  return response.data
}
