import api from '../../lib/api'

export const fetchAdminDashboard = async () => {
  const response = await api.get('/admin/dashboard')
  return response.data
}

export const fetchAdminStatistics = async () => {
  const response = await api.get('/admin/statistics')
  return response.data
}

export const fetchAdminActivity = async (limit = 25) => {
  const response = await api.get('/admin/activity-logs', { params: { limit } })
  return response.data
}

export const fetchUserAnalytics = async () => {
  const response = await api.get('/admin/user-analytics')
  return response.data
}

export const fetchContentAnalytics = async () => {
  const response = await api.get('/admin/content-analytics')
  return response.data
}

export const fetchReport = async (type, params = {}) => {
  const response = await api.get(`/reports/${type}`, { params })
  return response.data
}
