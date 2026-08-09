import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card'
import { Avatar } from '../../components/common/Avatar'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { SearchInput } from '../../components/common/SearchInput'
import { LoadingContainer } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { ProgressBar } from '../../components/common/ProgressBar'
import { SessionBookingModal } from '../../components/schedule/SessionBookingModal'
import { useStore } from '../../store/useStore'
import { PACKAGES } from '../../data/coachData'
import { PACKAGE_COLORS } from '../../constants/styles'
import { coacheeService } from '../../lib'
import {
  Users, TrendingUp, Calendar,
  ChevronRight, AlertTriangle, CalendarPlus
} from 'lucide-react'

export function CoacheesPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [coachees, setCoachees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user, openBookingModal } = useStore()

  useEffect(() => {
    async function loadCoachees() {
      try {
        setLoading(true)
        const data = await coacheeService.getCoachCoachees(user?.id)
        // 뷰 데이터를 컴포넌트가 기대하는 형태로 변환
        const formatted = data.map(c => ({
          id: c.user_id || c.id,  // user_id를 기본 id로 사용
          name: c.name,
          email: c.email,
          phone: c.phone,
          matchedAt: c.matched_at,
          packageType: c.package_type,
          currentSession: c.current_session || 0,
          totalSessions: c.total_sessions || 5,
          nextSession: c.next_session_date ? `${c.next_session_date} ${c.next_session_time || ''}`.trim() : '-',
          status: c.status,
          recentScore: c.recent_score || 0,
          targetScore: c.target_score || 5,
          hasWarning: c.has_warning || false,
          warningReason: c.warning_reason,
          topics: c.topics || []
        }))
        setCoachees(formatted)
      } catch (err) {
        if (err.message === 'LOCAL_MODE') {
          setError('Supabase가 설정되지 않았습니다. 피코치를 등록해주세요.')
        } else {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }
    loadCoachees()
  }, [user?.id])

  const filteredCoachees = coachees.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <LoadingContainer text="피코치 목록을 불러오는 중..." />
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">피코치 관리</h1>
          <p className="text-sm md:text-base text-gray-600">
            담당 피코치 목록과 진행 상황을 확인하세요.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="primary" className="text-sm md:text-base px-3 md:px-4 py-1.5 md:py-2">
            <Users className="w-4 h-4 mr-2" />
            총 {coachees.length}명
          </Badge>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          {error}
        </div>
      )}

      {/* 검색 */}
      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="이름 또는 이메일로 검색..."
          className="max-w-md"
        />
      </div>

      {/* 피코치 목록 */}
      {coachees.length === 0 && !error ? (
        <EmptyState
          icon={Users}
          title="등록된 피코치가 없습니다"
          description="아직 등록된 피코치가 없습니다."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCoachees.map((coachee) => (
            <CoacheeCard
              key={coachee.id}
              coachee={coachee}
              onBookSession={() => openBookingModal(coachee)}
              onClick={() => navigate(`/coach/coachees/${coachee.id}`)}
            />
          ))}
        </div>
      )}

      {/* 예약 모달 */}
      <SessionBookingModal />
    </div>
  )
}

function CoacheeCard({ coachee, onBookSession, onClick }) {
  const displaySession = Math.min(coachee.currentSession, coachee.totalSessions)
  const isCompleted = coachee.currentSession > coachee.totalSessions
  const pkg = coachee.packageType ? PACKAGES[coachee.packageType] : null

  const handleBookClick = (e) => {
    e.stopPropagation()
    onBookSession()
  }

  const pkgColor = coachee.packageType ? PACKAGE_COLORS[coachee.packageType] : null

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="py-5">
        <div className="flex items-start gap-4">
          <Avatar name={coachee.name} size="lg" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{coachee.name}</h3>
              {pkg && pkgColor && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${pkgColor.badge}`}>
                  {pkg.name} {pkg.sessions}회기
                </span>
              )}
              {coachee.hasWarning && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  주의
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-3">{coachee.email}</p>

            {/* 코칭 주제 */}
            <div className="flex flex-wrap gap-1 mb-3">
              {coachee.topics.map((topic) => (
                <Badge key={topic} variant="default">{topic}</Badge>
              ))}
            </div>

            {/* 진행률 */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">진행률</span>
                <span className="font-medium">
                  {displaySession}/{coachee.totalSessions} 회기
                  {isCompleted && ' (완료)'}
                </span>
              </div>
              <ProgressBar
                current={displaySession}
                total={coachee.totalSessions}
                color="blue"
                size="md"
              />
            </div>

            {/* 점수 & 일정 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>{coachee.recentScore}</span>
                  <span className="text-gray-400">/ {coachee.targetScore}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{coachee.nextSession}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBookClick}
                className="flex items-center gap-1"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                예약
              </Button>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  )
}
