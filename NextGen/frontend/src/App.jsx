import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'

// Pages
import StudentLogin from './features/auth/StudentLogin'
import StaffLogin from './features/auth/StaffLogin'
import StudentRegister from './features/auth/StudentRegister'
import Dashboard from './features/dashboard/Dashboard'

// Layout
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'

function App() {
  const { isAuthenticated, getCurrentUser } = useAuthStore()

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('access_token')
    if (token && !isAuthenticated) {
      getCurrentUser().catch(() => {
        // Token invalid, will logout automatically
      })
    }
  }, [])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<StudentLogin />} />
      <Route path="/staff-login" element={<StaffLogin />} />
      <Route path="/register" element={<StudentRegister />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        {/* More routes will be added in subsequent phases */}
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  )
}

export default App
