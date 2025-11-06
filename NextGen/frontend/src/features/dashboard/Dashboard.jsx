import { Users, BookOpen, FileText, MessageSquare, Calendar, ClipboardList } from 'lucide-react'
import useAuthStore from '../../store/authStore'

export default function Dashboard() {
  const { user, role } = useAuthStore()

  const studentStats = [
    { name: 'My Courses', value: '5', icon: BookOpen, color: 'bg-blue-500' },
    { name: 'Study Materials', value: '24', icon: FileText, color: 'bg-green-500' },
    { name: 'Quizzes', value: '8', icon: ClipboardList, color: 'bg-purple-500' },
    { name: 'Discussions', value: '12', icon: MessageSquare, color: 'bg-orange-500' },
  ]

  const staffStats = [
    { name: 'Total Students', value: '245', icon: Users, color: 'bg-blue-500' },
    { name: 'Active Courses', value: '12', icon: BookOpen, color: 'bg-green-500' },
    { name: 'Quizzes Created', value: '18', icon: ClipboardList, color: 'bg-purple-500' },
    { name: 'Notices', value: '7', icon: Calendar, color: 'bg-orange-500' },
  ]

  const stats = role === 'student' ? studentStats : staffStats

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          {role === 'student'
            ? 'Here\'s what\'s happening with your courses today.'
            : 'Here\'s your dashboard overview.'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notices */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notices</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Semester Exam Schedule</p>
                <p className="text-sm text-gray-600 mt-1">Posted 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Holiday Notice</p>
                <p className="text-sm text-gray-600 mt-1">Posted 1 day ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex flex-col items-center justify-center">
                <span className="text-xs text-primary-600 font-medium">NOV</span>
                <span className="text-lg font-bold text-primary-600">15</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Technical Seminar</p>
                <p className="text-sm text-gray-600">Auditorium - 10:00 AM</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex flex-col items-center justify-center">
                <span className="text-xs text-primary-600 font-medium">NOV</span>
                <span className="text-lg font-bold text-primary-600">20</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Sports Day</p>
                <p className="text-sm text-gray-600">Sports Ground - All Day</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button className="card hover:shadow-lg transition-shadow text-center py-6">
            <BookOpen className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Courses</p>
          </button>
          <button className="card hover:shadow-lg transition-shadow text-center py-6">
            <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Materials</p>
          </button>
          <button className="card hover:shadow-lg transition-shadow text-center py-6">
            <ClipboardList className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Quizzes</p>
          </button>
          <button className="card hover:shadow-lg transition-shadow text-center py-6">
            <MessageSquare className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Discussions</p>
          </button>
        </div>
      </div>
    </div>
  )
}
