import axios from 'axios'

// Use same API base as web; adjust for device if needed
const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000'

export const api = axios.create({ baseURL })

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

