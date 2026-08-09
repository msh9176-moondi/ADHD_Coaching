import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { useStore } from '../../store/useStore'
import { getCoachSessions, getSessionsForCoachee } from '../../lib/sessionService'
import { SessionDetailModal } from '../coach/SessionDetailModal'
import { Calendar, Clock, MessageSquare, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

export function SessionSchedule({ userRole = 'coachee', coacheeId = null }) {
  const navigate = useNavigate()
  const { user, sessions: storeSessions, openBookingModal } = useStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dbSessions, setDbSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  // 상세보기 클릭
  const handleViewDetail = (session) => {
    setSelectedSession(session)
    setDetailModalOpen(true)
  }

  // 입장하기 클릭 (메시지 페이지로 이동)
  const handleEnterSession = (session) => {
    if (userRole === 'coach') {
      navigate(`/coach/messages?coachee=${session.coachee_id}`)
    } else {
      navigate('/coachee/messages')
    }
  }

  // Supabase에서 세션 데이터 로드
  useEffect(() => {
    async function loadSessions() {
      try {
        setLoading(true)
        let data = []
        if (userRole === 'coach' && user?.id) {
          data = await getCoachSessions(user.id)
        } else if (userRole === 'coachee') {
          const id = coacheeId || user?.id
          if (id) {
            data = await getSessionsForCoachee(id)
          }
        }
        setDbSessions(data || [])
      } catch (err) {
        console.warn('세션 로드 실패:', err)
        setDbSessions([])
      } finally {
        setLoading(false)
      }
    }
    loadSessions()
  }, [userRole, user?.id, coacheeId])

  // 세션 데이터 (DB + store 병합, 중복 제거)
  const sessions = useMemo(() => {
    // ID 기준으로 중복 제거 (DB 데이터 우선)
    const sessionMap = new Map()
    dbSessions.forEach(s => sessionMap.set(s.id, s))
    storeSessions.forEach(s => {
      if (!sessionMap.has(s.id)) {
        sessionMap.set(s.id, s)
      }
    })
    let allSessions = Array.from(sessionMap.values())

    // 피코치인 경우 자신의 세션만 필터링
    if (userRole === 'coachee') {
      const myId = coacheeId || user?.id
      allSessions = allSessions.filter((s) => s.coachee_id === myId)
    }

    // 정렬: 예정(scheduled) 먼저, 완료(completed) 나중에 + 날짜순
    return allSessions.sort((a, b) => {
      // 상태 우선순위: scheduled > completed
      if (a.status === 'scheduled' && b.status !== 'scheduled') return -1
      if (a.status !== 'scheduled' && b.status === 'scheduled') return 1
      // 같은 상태면 날짜순 (가까운 날짜 먼저)
      return new Date(a.date) - new Date(b.date)
    })
  }, [dbSessions, storeSessions, userRole, user?.id, coacheeId])

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  return (
    <div className="space-y-6">
      {/* 캘린더 미니 뷰 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
          </CardTitle>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <MiniCalendar date={currentDate} sessions={sessions} />
        </CardContent>
      </Card>

      {/* 예약하기 버튼 (피코치) */}
      {userRole === 'coachee' && (
        <Button className="w-full" size="lg" onClick={() => openBookingModal()}>
          <Calendar className="w-4 h-4 mr-2" />
          새 상담 예약하기
        </Button>
      )}

      {/* 다가오는 세션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            다가오는 상담
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">불러오는 중...</span>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              예정된 상담이 없습니다.
            </p>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                formatDate={formatDate}
                showCoacheeName={userRole === 'coach'}
                onViewDetail={handleViewDetail}
                onEnterSession={handleEnterSession}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* 세션 상세 모달 */}
      <SessionDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        session={selectedSession ? {
          session: selectedSession.session_number || selectedSession.sessionNumber,
          topic: selectedSession.topic,
          date: formatDate(selectedSession.date),
          note: selectedSession.note,
          summary: selectedSession.summary,
          progress: selectedSession.progress,
          nextActions: selectedSession.next_actions || selectedSession.nextActions,
          coacheeCondition: selectedSession.coachee_condition || selectedSession.coacheeCondition,
          scoreChange: selectedSession.score_change || selectedSession.scoreChange,
          warnings: selectedSession.warnings
        } : null}
        coachee={{ name: selectedSession?.coachee_name || selectedSession?.coacheeName }}
      />
    </div>
  )
}

function SessionCard({ session, formatDate, showCoacheeName = false, onViewDetail, onEnterSession }) {
  // snake_case (Supabase) / camelCase 둘 다 지원
  const sessionNumber = session.session_number || session.sessionNumber
  const coacheeName = session.coachee_name || session.coacheeName

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-blue-100 rounded-xl flex flex-col items-center justify-center">
          <span className="text-base md:text-lg font-bold text-blue-600">{sessionNumber}</span>
          <span className="text-[10px] md:text-xs text-blue-500">회기</span>
        </div>

        <div className="flex-1 min-w-0 md:hidden">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-medium text-gray-900 text-sm">{session.topic}</h4>
            <Badge variant={session.status === 'scheduled' ? 'primary' : 'success'} className="text-xs">
              {session.status === 'scheduled' ? '예정' : '완료'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 hidden md:block">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900">{session.topic}</h4>
          {showCoacheeName && coacheeName && (
            <Badge variant="default">{coacheeName}</Badge>
          )}
          <Badge variant={session.status === 'scheduled' ? 'primary' : 'success'}>
            {session.status === 'scheduled' ? '예정' : '완료'}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(session.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {session.time} ({session.duration}분)
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> 메시지
          </span>
        </div>
      </div>

      {/* 모바일 날짜/시간 정보 */}
      <div className="flex items-center gap-3 text-xs text-gray-500 md:hidden ml-15 -mt-1">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(session.date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {session.time}
        </span>
      </div>

      <div className="flex gap-2 ml-15 md:ml-0">
        <Button variant="outline" size="sm" onClick={() => onViewDetail(session)} className="text-xs md:text-sm">
          상세보기
        </Button>
        {session.status === 'scheduled' && (
          <Button size="sm" onClick={() => onEnterSession(session)} className="text-xs md:text-sm">
            입장하기
          </Button>
        )}
      </div>
    </div>
  )
}

function MiniCalendar({ date, sessions }) {
  const [hoveredDay, setHoveredDay] = useState(null)
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // 날짜별 세션 그룹화
  const sessionsByDate = sessions.reduce((acc, session) => {
    const sessionDate = new Date(session.date)
    if (sessionDate.getFullYear() === year && sessionDate.getMonth() === month) {
      const day = sessionDate.getDate()
      if (!acc[day]) acc[day] = []
      acc[day].push(session)
    }
    return acc
  }, {})

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="text-center text-xs text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const daySessions = day ? sessionsByDate[day] || [] : []
          const sessionCount = daySessions.length
          const hasSession = sessionCount > 0
          const isToday = isCurrentMonth && day === today.getDate()

          return (
            <div
              key={index}
              className="relative"
              onMouseEnter={() => hasSession && setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div
                className={`aspect-square flex flex-col items-center justify-center text-sm rounded-lg cursor-default ${
                  day === null
                    ? ''
                    : hasSession
                    ? sessionCount >= 3
                      ? 'bg-blue-600 text-white font-medium'
                      : sessionCount >= 2
                      ? 'bg-blue-500 text-white font-medium'
                      : 'bg-blue-400 text-white font-medium'
                    : isToday
                    ? 'bg-gray-200 font-medium'
                    : 'hover:bg-gray-100'
                }`}
              >
                <span>{day}</span>
                {sessionCount > 1 && (
                  <span className="text-[10px] leading-none opacity-90">
                    {sessionCount}건
                  </span>
                )}
              </div>

              {/* 툴팁 */}
              {hoveredDay === day && hasSession && (
                <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-1 w-48 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-2">
                  <div className="font-medium mb-1 text-blue-300">
                    {month + 1}월 {day}일 상담 ({sessionCount}건)
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {daySessions.map((s, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="truncate flex-1">
                          {s.coachee_name || s.coacheeName || '피코치'}
                        </span>
                        <span className="text-gray-400 ml-2 whitespace-nowrap">
                          {s.time?.slice(0, 5)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-end gap-3 mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-400" />
          <span>1건</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>2건</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-600" />
          <span>3건+</span>
        </div>
      </div>
    </div>
  )
}
