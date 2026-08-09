import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '../../components/common/Card'
import { Avatar } from '../../components/common/Avatar'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { StatCard } from '../../components/common/StatCard'
import { SearchInput } from '../../components/common/SearchInput'
import { LoadingContainer } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { SessionNote } from '../../components/coach/SessionNote'
import { PACKAGES } from '../../data/coachData'
import { useStore } from '../../store/useStore'
import { useCollapsibleList } from '../../hooks'
import { coacheeService } from '../../lib'
import { getCoachSessions } from '../../lib/sessionService'
import {
  FileText, Calendar, Clock, Play, Check,
  ChevronRight, ChevronDown, Edit, Eye,
  User, Plus
} from 'lucide-react'

// 패키지 색상 설정
const packageColors = {
  starter: 'bg-green-100 text-green-700',
  basic: 'bg-emerald-100 text-emerald-700',
  premium: 'bg-purple-100 text-purple-700'
}

export function SessionPage() {
  const [searchParams] = useSearchParams()
  const preselectedCoacheeId = searchParams.get('coachee')
  const preselectedSessionNum = searchParams.get('session')
  const isNewSession = searchParams.get('new') === 'true'
  const { user } = useStore()

  const [coachees, setCoachees] = useState([])
  const [dbSessions, setDbSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // useCollapsibleList 훅 사용
  const {
    isExpanded,
    toggle: toggleCoachee,
    expand,
    expandAll,
    collapseAll
  } = useCollapsibleList([])

  // 피코치 데이터 로드
  useEffect(() => {
    async function loadCoachees() {
      try {
        setLoading(true)
        const data = await coacheeService.getCoachCoachees(user?.id)
        const formatted = data.map(c => ({
          id: c.id,
          userId: c.user_id, // 피코치의 실제 user_id
          name: c.name,
          email: c.email,
          packageType: c.package_type,
          currentSession: c.current_session || 0,
          totalSessions: c.total_sessions || 5,
          nextSession: c.next_session_date ? `${c.next_session_date} ${c.next_session_time || ''}`.trim() : null,
          coachingGoal: c.coaching_goal,
          sessionHistory: c.session_history || []
        }))
        setCoachees(formatted)

        // Supabase에서 세션 데이터도 로드
        try {
          const sessions = await getCoachSessions(user?.id)
          setDbSessions(sessions || [])
        } catch (err) {
          console.warn('DB 세션 로드 실패:', err)
        }
      } catch (err) {
        console.warn('피코치 로드 실패:', err)
        setCoachees([])
      } finally {
        setLoading(false)
      }
    }
    loadCoachees()
  }, [user?.id])

  // 피코치별로 세션 데이터 그룹화
  const coacheesWithSessions = useMemo(() => {
    return coachees.map(coachee => {
      const sessions = []
      const addedSessionNumbers = new Set()

      // Supabase DB에서 가져온 세션 (우선)
      dbSessions
        .filter(s => s.coachee_id === coachee.userId)
        .forEach(session => {
          const sessionNote = session.session_notes?.[0]
          const topic = sessionNote?.main_topics?.[0] || ''

          sessions.push({
            id: session.id,
            dbSessionId: session.id, // DB 세션 ID 저장
            coacheeId: coachee.id,
            coacheeUserId: coachee.userId,
            coacheeName: coachee.name,
            sessionNumber: session.session_number,
            date: session.date,
            time: session.time,
            topic: topic,
            note: sessionNote,
            status: session.status || 'completed'
          })
          addedSessionNumbers.add(session.session_number)
        })

      // 완료된 세션 (session_history에서 - DB에 없는 것만)
      coachee.sessionHistory?.forEach(session => {
        if (!addedSessionNumbers.has(session.session)) {
          sessions.push({
            id: `${coachee.id}-${session.session}`,
            coacheeId: coachee.id,
            coacheeUserId: coachee.userId,
            coacheeName: coachee.name,
            sessionNumber: session.session,
            date: session.date,
            topic: session.topic,
            note: session.note,
            status: 'completed'
          })
          addedSessionNumbers.add(session.session)
        }
      })

      // 예정된 세션
      if (coachee.nextSession) {
        // 기존 세션 중 가장 높은 회기 번호 + 1
        const maxExisting = addedSessionNumbers.size > 0
          ? Math.max(...addedSessionNumbers)
          : 0
        const nextSessionNum = maxExisting + 1
        if (!addedSessionNumbers.has(nextSessionNum)) {
          const [date, time] = coachee.nextSession.split(' ')
          sessions.push({
            id: `${coachee.id}-next`,
            coacheeId: coachee.id,
            coacheeUserId: coachee.userId,
            coacheeName: coachee.name,
            sessionNumber: nextSessionNum,
            date: date,
            time: time,
            topic: '예정된 세션',
            status: 'scheduled'
          })
        }
      }

      // 날짜 기준 정렬 (최신순)
      sessions.sort((a, b) => new Date(b.date) - new Date(a.date))

      return {
        ...coachee,
        sessions,
        completedCount: sessions.filter(s => s.status === 'completed' || s.status === 'in_progress').length,
        scheduledCount: sessions.filter(s => s.status === 'scheduled').length
      }
    })
  }, [coachees, dbSessions])

  // URL 파라미터로 전달된 피코치/세션 자동 선택
  useEffect(() => {
    if (preselectedCoacheeId) {
      const coacheeId = Number(preselectedCoacheeId)
      const coachee = coacheesWithSessions.find(c => c.id === coacheeId)

      if (!coachee) return

      // 해당 피코치 펼치기
      expand(coacheeId)

      // 새 세션 요청 (new=true)
      if (isNewSession) {
        // 기존 세션 중 가장 높은 회기 번호 찾기
        const existingSessions = coachee.sessions || []
        const existingNumbers = existingSessions
          .filter(s => s.status === 'completed' || s.status === 'in_progress' || s.status === 'draft')
          .map(s => s.sessionNumber)
        const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
        const nextSessionNum = maxNumber + 1

        const today = new Date().toISOString().split('T')[0]
        const newSession = {
          id: `${coacheeId}-new-${Date.now()}`,
          coacheeId: coacheeId,
          coacheeUserId: coachee.userId,
          coacheeName: coachee.name,
          sessionNumber: nextSessionNum,
          date: today,
          topic: '',
          status: 'draft',
          isNew: true
        }
        setSelectedSession(newSession)
        return
      }

      // 특정 세션 번호가 있으면 해당 세션 선택
      if (preselectedSessionNum) {
        const sessionNum = Number(preselectedSessionNum)

        // 기존 세션 찾기
        const existingSession = coachee.sessions.find(s => s.sessionNumber === sessionNum)

        if (existingSession) {
          setSelectedSession(existingSession)
        } else {
          // 새 세션 일지 작성 모드
          const today = new Date().toISOString().split('T')[0]
          const newSession = {
            id: `${coacheeId}-new-${Date.now()}`,
            coacheeId: coacheeId,
            coacheeUserId: coachee.userId,
            coacheeName: coachee.name,
            sessionNumber: sessionNum,
            date: today,
            topic: '',
            status: 'draft',
            isNew: true
          }
          setSelectedSession(newSession)
        }
      }
    }
  }, [preselectedCoacheeId, preselectedSessionNum, isNewSession, coacheesWithSessions, expand])

  // 검색 필터링
  const filteredCoachees = coacheesWithSessions.filter(coachee =>
    !searchQuery || coachee.name.includes(searchQuery)
  )

  // 전체 통계
  const totalStats = useMemo(() => {
    const allSessions = coacheesWithSessions.flatMap(c => c.sessions)
    return {
      totalCoachees: coacheesWithSessions.length,
      totalSessions: allSessions.length,
      scheduled: allSessions.filter(s => s.status === 'scheduled').length,
      completed: allSessions.filter(s => s.status === 'completed').length
    }
  }, [coacheesWithSessions])

  // 전체 펼치기/접기 핸들러
  const handleExpandAll = () => {
    expandAll(coacheesWithSessions.map(c => c.id))
  }

  const handleCollapseAll = () => {
    collapseAll()
  }

  // 새 세션 일지 작성
  const handleCreateNewSession = (coachee) => {
    const existingSessions = coachee.sessions || []

    // 먼저 진행 중(in_progress) 또는 작성 중(draft) 세션이 있는지 확인
    const inProgressSession = existingSessions.find(s => s.status === 'in_progress')
    const draftSession = existingSessions.find(s => s.status === 'draft')

    // 진행 중인 세션이 있으면 그 세션 선택
    if (inProgressSession) {
      setSelectedSession(inProgressSession)
      return
    }

    // 작성 중인 세션이 있으면 그 세션 선택
    if (draftSession) {
      setSelectedSession(draftSession)
      return
    }

    // 진행 중/작성 중 세션이 없으면 새로 생성
    const today = new Date().toISOString().split('T')[0]

    // 완료된 세션 중 가장 높은 회기 번호 찾기
    const completedNumbers = existingSessions
      .filter(s => s.status === 'completed')
      .map(s => s.sessionNumber)

    // 다음 회기 번호 = 완료된 세션 최대 + 1, 없으면 1
    const maxSessionNumber = completedNumbers.length > 0
      ? Math.max(...completedNumbers)
      : 0
    const nextSessionNumber = maxSessionNumber + 1

    const newSession = {
      id: `${coachee.id}-new-${Date.now()}`,
      coacheeId: coachee.id,
      coacheeUserId: coachee.userId, // 피코치의 실제 user_id
      coacheeName: coachee.name,
      sessionNumber: nextSessionNumber,
      date: today,
      topic: '',
      status: 'draft',
      isNew: true
    }

    setSelectedSession(newSession)
  }

  // 로딩 상태
  if (loading) {
    return <LoadingContainer text="세션 데이터를 불러오는 중..." />
  }

  // 세션 삭제 후 목록 새로고침
  const handleSessionDeleted = async () => {
    try {
      const sessions = await getCoachSessions(user?.id)
      setDbSessions(sessions || [])
    } catch (err) {
      console.warn('세션 목록 새로고침 실패:', err)
    }
    setSelectedSession(null)
  }

  // 세션 노트 뷰
  if (selectedSession) {
    const coachee = coachees.find(c => c.id === selectedSession.coacheeId)
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => setSelectedSession(null)}>
            <ChevronRight className="w-5 h-5 rotate-180" />
            목록으로
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedSession.coacheeName} - {selectedSession.sessionNumber}회기
              {selectedSession.isNew && (
                <Badge variant="warning" className="ml-2">새 일지</Badge>
              )}
            </h1>
            <p className="text-gray-500">{selectedSession.date}</p>
          </div>
        </div>
        <SessionNote
          coachee={coachee}
          sessionNumber={selectedSession.sessionNumber}
          session={selectedSession}
          onDelete={handleSessionDeleted}
          onBack={() => setSelectedSession(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">세션 일지</h1>
          <p className="text-gray-600">
            피코치별로 세션 기록을 관리하고 일지를 작성하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExpandAll}>
            전체 펼치기
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll}>
            전체 접기
          </Button>
        </div>
      </div>

      {/* 간단한 통계 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={User}
          label="피코치"
          value={totalStats.totalCoachees}
          color="blue"
        />
        <StatCard
          icon={FileText}
          label="전체 세션"
          value={totalStats.totalSessions}
          color="gray"
        />
        <StatCard
          icon={Calendar}
          label="예정된 세션"
          value={totalStats.scheduled}
          color="purple"
        />
        <StatCard
          icon={Check}
          label="완료된 세션"
          value={totalStats.completed}
          color="green"
        />
      </div>

      {/* 검색 */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="피코치 이름으로 검색..."
        className="max-w-md"
      />

      {/* 피코치별 서랍형 세션 목록 */}
      <div className="space-y-3">
        {filteredCoachees.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={User}
                title="해당하는 피코치가 없습니다"
                description={searchQuery ? "검색어를 변경해 보세요." : undefined}
              />
            </CardContent>
          </Card>
        ) : (
          filteredCoachees.map((coachee) => (
            <CoacheeDrawer
              key={coachee.id}
              coachee={coachee}
              isExpanded={isExpanded(coachee.id)}
              onToggle={() => toggleCoachee(coachee.id)}
              onSelectSession={setSelectedSession}
              onCreateSession={() => handleCreateNewSession(coachee)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function CoacheeDrawer({ coachee, isExpanded, onToggle, onSelectSession, onCreateSession }) {
  return (
    <Card className={`overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
      {/* 피코치 헤더 (클릭하면 펼침/접힘) */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* 펼침/접힘 아이콘 */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          isExpanded ? 'bg-emerald-100' : 'bg-gray-100'
        }`}>
          {isExpanded ? (
            <ChevronDown className={`w-5 h-5 ${isExpanded ? 'text-emerald-600' : 'text-gray-500'}`} />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
        </div>

        {/* 피코치 정보 */}
        <Avatar name={coachee.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{coachee.name}</h3>
            {coachee.packageType && PACKAGES[coachee.packageType] && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${packageColors[coachee.packageType] || 'bg-gray-100 text-gray-700'}`}>
                {PACKAGES[coachee.packageType].icon} {PACKAGES[coachee.packageType].name}
              </span>
            )}
            <Badge variant="secondary">
              {Math.min(coachee.currentSession, coachee.totalSessions)}/{coachee.totalSessions} 회기
              {coachee.currentSession > coachee.totalSessions && ' ✓'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 truncate">
            {coachee.coachingGoal?.goal || '목표 미설정'}
          </p>
        </div>

        {/* 세션 통계 */}
        <div className="flex items-center gap-4">
          {coachee.scheduledCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span className="text-gray-600">{coachee.scheduledCount}개 예정</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-gray-600">{coachee.completedCount}개 완료</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">다음 세션</p>
            <p className="font-medium text-gray-900">
              {coachee.nextSession || '-'}
            </p>
          </div>
        </div>
      </button>

      {/* 세션 목록 (펼쳐졌을 때) */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50">
          {coachee.sessions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              아직 세션 기록이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {coachee.sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  onClick={() => onSelectSession(session)}
                />
              ))}
            </div>
          )}

          {/* 새 세션 추가 버튼 */}
          <div className="p-3 bg-white border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation()
                onCreateSession()
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              새 세션 일지 작성
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

function SessionRow({ session, onClick }) {
  const statusConfig = {
    scheduled: {
      label: '예정',
      bgColor: 'bg-purple-50',
      badgeColor: 'bg-purple-100 text-purple-700',
      icon: Calendar
    },
    completed: {
      label: '완료',
      bgColor: 'bg-white',
      badgeColor: 'bg-green-100 text-green-700',
      icon: Check
    },
    draft: {
      label: '작성 중',
      bgColor: 'bg-amber-50',
      badgeColor: 'bg-amber-100 text-amber-700',
      icon: Edit
    },
    in_progress: {
      label: '진행 중',
      bgColor: 'bg-emerald-50',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      icon: Play
    }
  }

  const config = statusConfig[session.status] || statusConfig.completed
  const StatusIcon = config.icon

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-4 pl-16 hover:bg-emerald-50 cursor-pointer transition-colors ${config.bgColor}`}
    >
      {/* 회기 번호 */}
      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-base font-bold text-emerald-600">{session.sessionNumber}</span>
        <span className="text-[10px] text-emerald-500">회기</span>
      </div>

      {/* 세션 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${config.badgeColor}`}>
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </span>
          <span className="text-sm font-medium text-gray-700">{session.topic || '주제 미정'}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {session.date}
          </span>
          {session.time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {session.time}
            </span>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2">
        {session.status === 'scheduled' ? (
          <Button size="sm">
            <Play className="w-4 h-4 mr-1" />
            세션 시작
          </Button>
        ) : session.status === 'completed' ? (
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-1" />
            일지 보기
          </Button>
        ) : session.status === 'draft' ? (
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-1" />
            계속 작성
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-1" />
            계속 작성
          </Button>
        )}
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  )
}
