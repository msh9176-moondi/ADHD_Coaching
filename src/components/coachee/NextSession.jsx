import { useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { Calendar, Clock, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function NextSession() {
  const { sessions, user } = useStore()
  const navigate = useNavigate()

  // 다음 예정된 세션 찾기
  const nextSession = useMemo(() => {
    const now = new Date()
    const upcoming = sessions
      .filter((s) => {
        const sessionDate = new Date(`${s.date}T${s.time}`)
        return sessionDate > now && s.status === 'scheduled'
      })
      .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))

    return upcoming[0] || null
  }, [sessions])

  // 세션이 없으면 안내 메시지 표시
  if (!nextSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            다음 코칭
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">예정된 상담이 없습니다.</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/coachee/schedule')}
            >
              일정 확인하기
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sessionDate = new Date(`${nextSession.date}T${nextSession.time || '00:00'}`)
  const formattedDate = sessionDate.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  const formattedTime = sessionDate.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          다음 코칭
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="font-medium text-gray-900">{formattedDate}</p>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formattedTime} ({nextSession.duration}분)
            </p>
          </div>

          {nextSession.topic && (
            <div className="text-sm">
              <span className="text-gray-500">주제: </span>
              <span className="text-gray-700">{nextSession.topic}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MessageCircle className="w-4 h-4" />
            <span>플로카 코치</span>
          </div>

          <div className="pt-2 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/coachee/schedule')}
            >
              상담 준비하기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-gray-600"
              onClick={() => navigate('/coachee/messages')}
            >
              채팅방 열기
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
