import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MessageSquare,
  Calendar,
  FileText,
  ClipboardList,
  MessagesSquare,
  Image,
  UserCircle,
  UserCog,
  BarChart3,
  FileSpreadsheet,
  Award,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import useAuthStore from '../../store/authStore'

export default function Sidebar() {
  const location = useLocation()
  const { role } = useAuthStore()

  const studentNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', href: '/profile/student', icon: UserCircle },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Study Materials', href: '/materials', icon: FileText },
    { name: 'Quizzes', href: '/quizzes', icon: ClipboardList },
    { name: 'Discussions', href: '/discussions', icon: MessageSquare },
    { name: 'Notices', href: '/notices', icon: Calendar },
    { name: 'Timeline', href: '/timeline', icon: Image },
    { name: 'My Certificates', href: '/my-certificates', icon: Award },
    { name: 'Chat', href: '/chat', icon: MessagesSquare },
  ]

  const staffNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', href: '/profile/user', icon: UserCircle },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Reports', href: '/admin/reports', icon: FileSpreadsheet },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Subjects', href: '/subjects', icon: FileText },
    { name: 'Study Materials', href: '/materials', icon: FileText },
    { name: 'Certificates', href: '/certificates', icon: FileText },
    { name: 'Quizzes', href: '/quizzes', icon: ClipboardList },
    { name: 'Manage Materials', href: '/admin/materials', icon: ClipboardList },
    { name: 'Manage Quizzes', href: '/admin/quizzes', icon: ClipboardList },
    { name: 'Discussions', href: '/discussions', icon: MessageSquare },
    { name: 'Timeline', href: '/timeline', icon: Image },
    { name: 'Notices', href: '/notices', icon: Calendar },
    { name: 'Manage Notices', href: '/admin/notices', icon: FileText },
  ]

  const adminNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', href: '/profile/user', icon: UserCircle },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Reports', href: '/admin/reports', icon: FileSpreadsheet },
    { name: 'Manage Students', href: '/admin/students', icon: Users },
    { name: 'Manage Users', href: '/admin/users', icon: UserCog },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Subjects', href: '/subjects', icon: FileText },
    { name: 'Study Materials', href: '/materials', icon: FileText },
    { name: 'Certificates', href: '/certificates', icon: FileText },
    { name: 'Certificate Types', href: '/certificate-types', icon: Award },
    { name: 'Quizzes', href: '/quizzes', icon: ClipboardList },
    { name: 'Manage Materials', href: '/admin/materials', icon: ClipboardList },
    { name: 'Manage Quizzes', href: '/admin/quizzes', icon: ClipboardList },
    { name: 'Discussions', href: '/discussions', icon: MessageSquare },
    { name: 'Timeline', href: '/timeline', icon: Image },
    { name: 'Notices', href: '/notices', icon: Calendar },
    { name: 'Manage Notices', href: '/admin/notices', icon: FileText },
  ]

  const navItems = role === 'admin' ? adminNav : role === 'staff' ? staffNav : studentNav

  return (
    <aside className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            location.pathname === item.href ||
            (location.pathname.startsWith(item.href) && item.href !== '/' && location.pathname.charAt(item.href.length) === '/')

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
