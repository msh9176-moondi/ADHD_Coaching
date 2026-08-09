import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Target,
  Calendar,
  FileText,
  CheckSquare,
  MessageCircle,
  Settings,
  LogOut,
  Users,
  X
} from 'lucide-react'
import { useStore } from '../../store/useStore'

export function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { user, resetAll } = useStore()
  const isCoach = user?.role === 'coach'

  const handleLogout = () => {
    resetAll()
    navigate('/login')
  }

  const handleNavClick = () => {
    // 모바일에서 메뉴 클릭 시 사이드바 닫기
    if (window.innerWidth < 1024) {
      onClose?.()
    }
  }

  const coachMenuItems = [
    { icon: LayoutDashboard, label: '대시보드', path: '/coach' },
    { icon: Users, label: '피코치 관리', path: '/coach/coachees' },
    { icon: CheckSquare, label: '과제 관리', path: '/coach/tasks' },
    { icon: Calendar, label: '일정', path: '/coach/schedule' },
    { icon: FileText, label: '세션 일지', path: '/coach/sessions' },
    { icon: MessageCircle, label: '메시지', path: '/coach/messages' },
  ]

  const coacheeMenuItems = [
    { icon: LayoutDashboard, label: '홈', path: '/coachee' },
    { icon: Target, label: '나의 목표', path: '/coachee/goals' },
    { icon: CheckSquare, label: '실행 과제', path: '/coachee/tasks' },
    { icon: Calendar, label: '상담 일정', path: '/coachee/schedule' },
    { icon: FileText, label: '성찰 일지', path: '/coachee/reflections' },
    { icon: MessageCircle, label: '메시지', path: '/coachee/messages' },
  ]

  const menuItems = isCoach ? coachMenuItems : coacheeMenuItems

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-emerald-600">FLOCA</h1>
          <p className="text-xs text-gray-500 mt-0.5">ADHD 실행회복 코칭</p>
        </div>
        {/* 모바일 닫기 버튼 */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/coach' || item.path === '/coachee'}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <NavLink
          to="/settings"
          onClick={handleNavClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-5 h-5" />
          설정
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
