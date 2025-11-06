import api from '../../lib/api'

export const fetchNotices = async (params = {}) => {
  const response = await api.get('/notices', { params })
  return response.data
}

export const fetchNoticeById = async (id) => {
  const response = await api.get(`/notices/${id}`)
  return response.data
}

export const fetchLatestNotices = async (limit = 5) => {
  const response = await api.get('/notices/latest', { params: { limit } })
  return response.data
}

export const fetchFeaturedNotices = async (limit = 5) => {
  const response = await api.get('/notices/featured', { params: { limit } })
  return response.data
}

export const createNotice = async (payload) => {
  const response = await api.post('/notices', payload)
  return response.data
}

export const updateNotice = async (id, payload) => {
  const response = await api.put(`/notices/${id}`, payload)
  return response.data
}

export const deleteNotice = async (id) => {
  const response = await api.delete(`/notices/${id}`)
  return response.data
}

export const uploadNoticeImage = async (noticeId, file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post(`/notices/${noticeId}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
