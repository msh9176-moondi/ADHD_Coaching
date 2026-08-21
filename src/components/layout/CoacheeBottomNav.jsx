import { NavLink } from 'react-router-dom'
import { CheckSquare, MessageSquare, BarChart3, MessageCircle, Settings } from 'lucide-react'

const navItems = [
  { icon: CheckSquare, label: '오늘', path: '/coachee/today' },
  { icon: MessageSquare, label: '상담', path: '/coachee/coaching' },
  { icon: BarChart3, label: '분석', path: '/coachee/analysis' },
  { icon: MessageCircle, label: '메시지', path: '/coachee/messages' },
  { icon: Settings, label: '설정', path: '/coachee/settings' }
]

export function CoacheeBottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[60px] transition-colors ${
                isActive
                  ? 'text-emerald-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
