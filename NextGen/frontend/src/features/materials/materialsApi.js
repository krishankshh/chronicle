import api from '../../lib/api'

export const fetchMaterials = async (params = {}) => {
  const response = await api.get('/materials', { params })
  return response.data
}

export const fetchMaterialById = async (materialId) => {
  const response = await api.get(`/materials/${materialId}`)
  return response.data
}

export const createMaterial = async (payload) => {
  const response = await api.post('/materials', payload)
  return response.data
}

export const updateMaterial = async (materialId, payload) => {
  const response = await api.put(`/materials/${materialId}`, payload)
  return response.data
}

export const deleteMaterial = async (materialId) => {
  const response = await api.delete(`/materials/${materialId}`)
  return response.data
}

export const uploadMaterialFiles = async (materialId, files) => {
  if (!files?.length) return null

  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await api.post(`/materials/${materialId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const deleteMaterialAttachment = async (materialId, attachmentId) => {
  const response = await api.delete(`/materials/${materialId}/files/${attachmentId}`)
  return response.data
}

export const downloadMaterialBundle = async (materialId, format = 'files') => {
  const response = await api.get(`/materials/${materialId}/download`, {
    params: { format },
    responseType: 'blob',
  })
  return response
}

export const downloadMaterialAttachment = (materialId, attachmentId) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  const url = `${baseUrl}/materials/${materialId}/files/${attachmentId}`
  window.open(url, '_blank', 'noopener')
}
