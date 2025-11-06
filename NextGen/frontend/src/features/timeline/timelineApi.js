import api from '../../lib/api'

export const fetchTimeline = async ({ page = 1, limit = 10 } = {}) => {
  const response = await api.get('/timeline', {
    params: { page, limit },
  })
  return response.data
}

export const fetchStudentTimeline = async (studentId, { page = 1, limit = 10 } = {}) => {
  const response = await api.get(`/students/${studentId}/timeline`, {
    params: { page, limit },
  })
  return response.data
}

export const fetchTimelinePost = async (postId) => {
  const response = await api.get(`/timeline/${postId}`)
  return response.data
}

export const createTimelinePost = async (formData) => {
  const response = await api.post('/timeline/post', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const updateTimelinePost = async (postId, payload) => {
  const response = await api.put(`/timeline/${postId}`, payload)
  return response.data
}

export const deleteTimelinePost = async (postId) => {
  const response = await api.delete(`/timeline/${postId}`)
  return response.data
}

export const toggleTimelinePostLike = async (postId) => {
  const response = await api.post(`/timeline/${postId}/like`)
  return response.data
}

export const unlikeTimelinePost = async (postId) => {
  const response = await api.delete(`/timeline/${postId}/like`)
  return response.data
}

export const fetchTimelineComments = async (postId, { page = 1, limit = 20 } = {}) => {
  const response = await api.get(`/timeline/${postId}/comments`, {
    params: { page, limit },
  })
  return response.data
}

export const createTimelineComment = async (postId, payload) => {
  const response = await api.post(`/timeline/${postId}/comment`, payload)
  return response.data
}

export const updateTimelineComment = async (commentId, payload) => {
  const response = await api.put(`/timeline/comments/${commentId}`, payload)
  return response.data
}

export const deleteTimelineComment = async (commentId) => {
  const response = await api.delete(`/timeline/comments/${commentId}`)
  return response.data
}

export const toggleTimelineCommentLike = async (commentId) => {
  const response = await api.post(`/timeline/comments/${commentId}/like`)
  return response.data
}

