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

// Notices & Materials
import NoticeList from './features/notices/NoticeList'
import NoticeDetail from './features/notices/NoticeDetail'
import NoticeAdminList from './features/notices/NoticeAdminList'
import NoticeForm from './features/notices/NoticeForm'
import MaterialList from './features/materials/MaterialList'
import MaterialDetail from './features/materials/MaterialDetail'
import MaterialAdminList from './features/materials/MaterialAdminList'
import MaterialForm from './features/materials/MaterialForm'

// Discussions
import DiscussionList from './features/discussions/DiscussionList'
import DiscussionDetail from './features/discussions/DiscussionDetail'
import DiscussionForm from './features/discussions/DiscussionForm'

// Quizzes
import QuizList from './features/quizzes/QuizList'
import QuizStart from './features/quizzes/QuizStart'
import QuizAttempt from './features/quizzes/QuizAttempt'
import QuizResult from './features/quizzes/QuizResult'
import QuizHistory from './features/quizzes/QuizHistory'
import QuizAdminList from './features/quizzes/QuizAdminList'
import QuizForm from './features/quizzes/QuizForm'
import QuizQuestionManager from './features/quizzes/QuizQuestionManager'
import QuizAnalytics from './features/quizzes/QuizAnalytics'
import ChatPage from './features/chat/ChatPage'

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
  }, [getCurrentUser, isAuthenticated])

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

        {/* Phase 4: Notices */}
        <Route path="notices" element={<NoticeList />} />
        <Route path="notices/:noticeId" element={<NoticeDetail />} />
        <Route path="admin/notices" element={<NoticeAdminList />} />
        <Route path="admin/notices/new" element={<NoticeForm mode="create" />} />
        <Route path="admin/notices/:noticeId" element={<NoticeForm mode="edit" />} />

        {/* Phase 5: Study Materials */}
        <Route path="materials" element={<MaterialList />} />
        <Route path="materials/:materialId" element={<MaterialDetail />} />
        <Route path="admin/materials" element={<MaterialAdminList />} />
        <Route path="admin/materials/new" element={<MaterialForm mode="create" />} />
        <Route path="admin/materials/:materialId" element={<MaterialForm mode="edit" />} />

        {/* Phase 6: Quizzes & Assessments */}
        <Route path="quizzes" element={<QuizList />} />
        <Route path="quizzes/history" element={<QuizHistory />} />
        <Route path="quizzes/:quizId" element={<QuizStart />} />
        <Route path="quizzes/:quizId/attempt/:attemptId" element={<QuizAttempt />} />
        <Route path="quizzes/:quizId/results" element={<QuizResult />} />
        <Route path="admin/quizzes" element={<QuizAdminList />} />
        <Route path="admin/quizzes/new" element={<QuizForm mode="create" />} />
        <Route path="admin/quizzes/:quizId" element={<QuizForm mode="edit" />} />
        <Route path="admin/quizzes/:quizId/questions" element={<QuizQuestionManager />} />
        <Route path="admin/quizzes/:quizId/analytics" element={<QuizAnalytics />} />

        {/* Phase 7: Discussions */}
        <Route path="discussions" element={<DiscussionList />} />
        <Route path="discussions/new" element={<DiscussionForm mode="create" />} />
        <Route path="discussions/:discussionId" element={<DiscussionDetail />} />
        <Route path="discussions/:discussionId/edit" element={<DiscussionForm mode="edit" />} />

        {/* Phase 8: Real-time Chat */}
        <Route path="chat" element={<ChatPage />} />

        {/* More routes will be added in subsequent phases */}
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  )
}

export default App
