import { useState } from 'react'
import { Bell, Search, X, CheckCircle, Menu } from 'lucide-react'
import { Avatar } from '../common/Avatar'
import { useStore } from '../../store/useStore'

export function Header({ onMenuClick }) {
  const { user, notifications, markNotificationRead, clearNotification } = useStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  return (
    <header className="sticky top-0 h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 z-20">
      <div className="flex items-center gap-3 flex-1">
        {/* 모바일 햄버거 메뉴 */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* 데스크톱 검색바 */}
        <div className="hidden md:block relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="검색..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 모바일 검색 버튼 */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {/* 알림 드롭다운 */}
          {showNotifications && (
            <>
              {/* 모바일 오버레이 */}
              <div
                className="fixed inset-0 z-40 md:hidden"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 md:right-0 top-full mt-2 w-[calc(100vw-2rem)] md:w-80 max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 z-50 -mr-2 md:mr-0">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">알림</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications?.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">
                      알림이 없습니다.
                    </div>
                  ) : (
                    notifications?.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-50 hover:bg-gray-50 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {!notification.read && (
                              <button
                                onClick={() => markNotificationRead(notification.id)}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="읽음 표시"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                              </button>
                            )}
                            <button
                              onClick={() => clearNotification(notification.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="삭제"
                            >
                              <X className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200">
          <Avatar name={user?.name} size="sm" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name || '사용자'}</p>
            <p className="text-xs text-gray-500">
              {user?.role === 'coach' ? '코치' : '피코치'}
            </p>
          </div>
        </div>
      </div>

      {/* 모바일 검색 확장 */}
      {showSearch && (
        <div className="absolute left-0 right-0 top-full bg-white border-b border-gray-200 p-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="검색..."
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </header>
  )
}
