import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { Bell, CheckCircle, X, ClipboardList } from 'lucide-react'

export function NotificationCard() {
  const { notifications, markNotificationRead, clearNotification, markAllNotificationsRead } = useStore()

  // 읽지 않은 알림만 필터링
  const unreadNotifications = notifications.filter(n => !n.read)

  if (unreadNotifications.length === 0) {
    return null
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_reminder':
        return <ClipboardList className="w-5 h-5 text-blue-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="relative">
              <Bell className="w-5 h-5 text-blue-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadNotifications.length}
              </span>
            </div>
            코치님의 알림
          </CardTitle>
          {unreadNotifications.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllNotificationsRead}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              모두 읽음
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {unreadNotifications.map((notification) => (
          <div
            key={notification.id}
            className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </h4>
                  <span className="text-xs text-gray-400">
                    {formatTime(notification.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{notification.message}</p>
                {notification.taskTitle && (
                  <div className="mt-2 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 inline-block">
                    {notification.taskTitle}
                  </div>
                )}
              </div>
              <button
                onClick={() => clearNotification(notification.id)}
                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => markNotificationRead(notification.id)}
                className="text-xs"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                확인
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
