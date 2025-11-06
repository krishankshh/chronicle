import api from '../../lib/api'

export const fetchQuizzes = async (params = {}) => {
  const response = await api.get('/quizzes', { params })
  return response.data
}

export const fetchQuizById = async (quizId) => {
  const response = await api.get(`/quizzes/${quizId}`)
  return response.data
}

export const createQuiz = async (payload) => {
  const response = await api.post('/quizzes', payload)
  return response.data
}

export const updateQuiz = async (quizId, payload) => {
  const response = await api.put(`/quizzes/${quizId}`, payload)
  return response.data
}

export const deleteQuiz = async (quizId) => {
  const response = await api.delete(`/quizzes/${quizId}`)
  return response.data
}

export const fetchQuizQuestions = async (quizId) => {
  const response = await api.get(`/quizzes/${quizId}/questions`)
  return response.data
}

export const createQuizQuestion = async (quizId, payload) => {
  const response = await api.post(`/quizzes/${quizId}/questions`, payload)
  return response.data
}

export const updateQuizQuestion = async (questionId, payload) => {
  const response = await api.put(`/quizzes/questions/${questionId}`, payload)
  return response.data
}

export const deleteQuizQuestion = async (questionId) => {
  const response = await api.delete(`/quizzes/questions/${questionId}`)
  return response.data
}

export const startQuizAttempt = async (quizId) => {
  const response = await api.get(`/quizzes/${quizId}/start`)
  return response.data
}

export const submitQuizAttempt = async (quizId, payload) => {
  const response = await api.post(`/quizzes/${quizId}/submit`, payload)
  return response.data
}

export const fetchQuizResults = async (quizId, params = {}) => {
  const response = await api.get(`/quizzes/${quizId}/results`, { params })
  return response.data
}

export const fetchStudentQuizHistory = async () => {
  const response = await api.get('/quizzes/students/quiz-history')
  return response.data
}

export const fetchQuizAnalytics = async (quizId) => {
  const response = await api.get(`/quizzes/${quizId}/analytics`)
  return response.data
}

export const fetchQuizStudentResults = async (quizId) => {
  const response = await api.get(`/quizzes/${quizId}/student-results`)
  return response.data
}

export const fetchStudentQuizPerformance = async (studentId) => {
  const response = await api.get(`/quizzes/students/${studentId}/quiz-performance`)
  return response.data
}
