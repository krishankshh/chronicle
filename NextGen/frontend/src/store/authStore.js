import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Student registration
      registerStudent: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/student/register', data)
          set({ isLoading: false })
          return response.data
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Registration failed'
          set({ isLoading: false, error: errorMessage })
          throw error
        }
      },

      // Student login
      loginStudent: async (rollNo, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/student/login', {
            roll_no: rollNo,
            password: password
          })

          const { access_token, refresh_token, user } = response.data

          // Store tokens
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          set({
            user: user,
            role: 'student',
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })

          return response.data
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed'
          set({ isLoading: false, error: errorMessage })
          throw error
        }
      },

      // Staff/Admin login
      loginStaff: async (loginId, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/staff/login', {
            login_id: loginId,
            password: password
          })

          const { access_token, refresh_token, user } = response.data
          const role = user.user_type === 'Admin' ? 'admin' : 'staff'

          // Store tokens
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          set({
            user: user,
            role: role,
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })

          return response.data
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed'
          set({ isLoading: false, error: errorMessage })
          throw error
        }
      },

      // Logout
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({
          user: null,
          role: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null
        })
      },

      // Get current user
      getCurrentUser: async () => {
        try {
          const response = await api.get('/auth/me')
          const { user, role } = response.data
          set({
            user: user,
            role: role,
            isAuthenticated: true
          })
          return response.data
        } catch (error) {
          get().logout()
          throw error
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)

export default useAuthStore
