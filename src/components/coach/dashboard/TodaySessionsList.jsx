import { Calendar, ChevronRight } from 'lucide-react'
import { Avatar } from '../../common/Avatar'
import { Badge } from '../../common/Badge'

export function TodaySessionsList({ sessions = [] }) {
  if (sessions.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p>오늘 예정된 상담이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, index) => (
        <div
          key={session.id || `session-${index}`}
          className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div className="flex-shrink-0 w-16 text-center">
            <span className="text-lg font-semibold text-gray-900">{session.time}</span>
          </div>
          <Avatar name={session.coachee_name || session.name} size="sm" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">{session.coachee_name || session.name}</p>
            <p className="text-sm text-gray-500">
              {session.session_number || session.session}회기 · {session.topic || '미정'}
            </p>
          </div>
          <Badge variant="primary">예정</Badge>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      ))}
    </div>
  )
}
