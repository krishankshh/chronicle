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
  Image
} from 'lucide-react'
import { cn } from '../../lib/utils'
import useAuthStore from '../../store/authStore'

export default function Sidebar() {
  const location = useLocation()
  const { role } = useAuthStore()

  const studentNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Study Materials', href: '/materials', icon: FileText },
    { name: 'Quizzes', href: '/quizzes', icon: ClipboardList },
    { name: 'Discussions', href: '/discussions', icon: MessageSquare },
    { name: 'Notices', href: '/notices', icon: Calendar },
    { name: 'Timeline', href: '/timeline', icon: Image },
    { name: 'Chat', href: '/chat', icon: MessagesSquare },
  ]

  const staffNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Study Materials', href: '/materials', icon: FileText },
    { name: 'Quizzes', href: '/quizzes', icon: ClipboardList },
    { name: 'Discussions', href: '/discussions', icon: MessageSquare },
    { name: 'Notices', href: '/notices', icon: Calendar },
  ]

  const adminNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Study Materials', href: '/materials', icon: FileText },
    { name: 'Quizzes', href: '/quizzes', icon: ClipboardList },
    { name: 'Discussions', href: '/discussions', icon: MessageSquare },
    { name: 'Notices', href: '/notices', icon: Calendar },
  ]

  const navItems = role === 'admin' ? adminNav : role === 'staff' ? staffNav : studentNav

  return (
    <aside className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href

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
