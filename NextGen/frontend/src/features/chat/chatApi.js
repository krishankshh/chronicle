import api from '../../lib/api'

export const fetchChats = async () => {
  const response = await api.get('/chats')
  return response.data
}

export const startChat = async (participantId, participantMeta) => {
  const response = await api.post('/chats/start', {
    participant_id: participantId,
    participant_meta: participantMeta,
  })
  return response.data
}

export const fetchChatMessages = async (chatId, params = {}) => {
  const response = await api.get(`/chats/${chatId}/messages`, { params })
  return response.data
}

export const sendChatMessage = async (chatId, payload, files = []) => {
  if (!files.length) {
    const response = await api.post(`/chats/${chatId}/messages`, payload)
    return response.data
  }

  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, value)
      }
    }
  })
  files.forEach((file) => formData.append('files', file))

  const response = await api.post(`/chats/${chatId}/messages`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const fetchGroupChats = async () => {
  const response = await api.get('/group-chats')
  return response.data
}

export const searchChatParticipants = async (search, limit = 10) => {
  const response = await api.get('/chats/participants', {
    params: {
      search,
      limit,
    },
  })
  return response.data.participants
}

export const createGroupChat = async (payload) => {
  const response = await api.post('/group-chats', payload)
  return response.data
}

export const fetchGroupMessages = async (groupId, params = {}) => {
  const response = await api.get(`/group-chats/${groupId}/messages`, { params })
  return response.data
}

export const sendGroupMessage = async (groupId, payload, files = []) => {
  if (!files.length) {
    const response = await api.post(`/group-chats/${groupId}/messages`, payload)
    return response.data
  }

  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, value)
      }
    }
  })
  files.forEach((file) => formData.append('files', file))

  const response = await api.post(`/group-chats/${groupId}/messages`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
