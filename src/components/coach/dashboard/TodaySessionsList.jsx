import { useNavigate } from 'react-router-dom'
import { Calendar, ChevronRight } from 'lucide-react'
import { Avatar } from '../../common/Avatar'
import { Badge } from '../../common/Badge'

export function TodaySessionsList({ sessions = [] }) {
  const navigate = useNavigate()

  if (sessions.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p>오늘 예정된 상담이 없습니다.</p>
      </div>
    )
  }

  const handleSessionClick = (session) => {
    // 세션 일지 페이지로 이동 (피코치 ID와 세션 번호 전달)
    const coacheeId = session.coachee_id || session.coacheeId
    const sessionNum = session.session_number || session.session
    if (coacheeId) {
      navigate(`/coach/sessions?coachee=${coacheeId}&session=${sessionNum}`)
    } else {
      // 피코치 ID가 없으면 세션 일지 목록으로 이동
      navigate('/coach/sessions')
    }
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, index) => (
        <div
          key={session.id || `session-${index}`}
          onClick={() => handleSessionClick(session)}
          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div className="flex-shrink-0 w-14 sm:w-16 text-center">
            <span className="text-base sm:text-lg font-semibold text-gray-900">{session.time}</span>
          </div>
          <Avatar name={session.coachee_name || session.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{session.coachee_name || session.name}</p>
            <p className="text-xs sm:text-sm text-gray-500">
              {session.session_number || session.session}회기 · {session.topic || '미정'}
            </p>
          </div>
          <Badge variant="primary" className="hidden sm:inline-flex">예정</Badge>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}
