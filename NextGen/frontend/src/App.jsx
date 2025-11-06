import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'

// Auth Pages
import StudentLogin from './features/auth/StudentLogin'
import StaffLogin from './features/auth/StaffLogin'
import StudentRegister from './features/auth/StudentRegister'

// Dashboard
import Dashboard from './features/dashboard/Dashboard'

// Profile Pages (Phase 2)
import StudentProfile from './features/profile/StudentProfile'
import UserProfile from './features/profile/UserProfile'

// Admin Pages (Phase 2)
import StudentManagement from './features/admin/StudentManagement'
import UserManagement from './features/admin/UserManagement'

// Course/Subject Pages (Phase 3)
import CourseManagement from './features/courses/CourseManagement'
import SubjectManagement from './features/subjects/SubjectManagement'

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

        {/* Phase 2: Profile Management */}
        <Route path="profile/student" element={<StudentProfile />} />
        <Route path="profile/user" element={<UserProfile />} />

        {/* Phase 2: Admin Management (Admin only) */}
        <Route path="admin/students" element={<StudentManagement />} />
        <Route path="admin/users" element={<UserManagement />} />

        {/* Phase 3: Course & Subject Management (Staff/Admin) */}
        <Route path="courses" element={<CourseManagement />} />
        <Route path="subjects" element={<SubjectManagement />} />

        {/* More routes will be added in subsequent phases */}
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  )
}

export default App
