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
  ChevronRight, AlertTriangle, CalendarPlus, Crown
} from 'lucide-react'
import { getCoachSubscribers } from '../../lib/subscriptionService'

const TABS = [
  { id: 'active', label: '진행 중', icon: Users },
  { id: 'subscriber', label: '구독자', icon: Crown },
  { id: 'completed', label: '완료', icon: null }
]

export function CoacheesPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('active')
  const [coachees, setCoachees] = useState([])
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user, openBookingModal } = useStore()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // 피코치 목록과 구독자 목록 병렬 로드
        const [coacheesData, subscribersData] = await Promise.all([
          coacheeService.getCoachCoachees(user?.id),
          getCoachSubscribers(user?.id)
        ])

        // 뷰 데이터를 컴포넌트가 기대하는 형태로 변환
        const formatted = coacheesData.map(c => ({
          id: c.user_id || c.id,  // user_id를 기본 id로 사용
          profileId: c.id,  // 프로필 ID (업데이트용)
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

        // 모든 회기가 완료되었지만 status가 'completed'가 아닌 피코치 자동 수정
        const needsSync = formatted.filter(c =>
          c.currentSession > c.totalSessions && c.status !== 'completed'
        )
        if (needsSync.length > 0) {
          console.log('완료 상태 동기화 필요:', needsSync.map(c => c.name))
          for (const c of needsSync) {
            try {
              await coacheeService.updateCoacheeById(c.profileId, { status: 'completed' })
              c.status = 'completed'
              console.log(`${c.name} 상태를 completed로 변경 완료`)
            } catch (err) {
              console.error(`${c.name} 상태 변경 실패:`, err)
            }
          }
        }

        setCoachees(formatted)

        // 구독자 데이터 변환
        const formattedSubscribers = subscribersData.map(s => ({
          id: s.user_id,
          name: s.user?.name || '구독자',
          email: s.user?.email || '',
          avatarUrl: s.user?.avatar_url,
          planType: s.plan_type,
          sessionsPerMonth: s.sessions_per_month,
          sessionsUsed: s.sessions_used_this_month,
          periodEnd: s.current_period_end,
          status: s.status
        }))
        setSubscribers(formattedSubscribers)
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
    loadData()
  }, [user?.id])

  // 탭별 필터링
  const getFilteredData = () => {
    if (activeTab === 'subscriber') {
      return subscribers.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    const statusFilter = activeTab === 'completed' ? 'completed' : 'active'
    return coachees.filter(c =>
      (c.status === statusFilter || (activeTab === 'active' && c.status === 'pending')) &&
      (c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       c.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  const filteredData = getFilteredData()

  // 탭별 카운트
  const activeCount = coachees.filter(c => c.status === 'active' || c.status === 'pending').length
  const completedCount = coachees.filter(c => c.status === 'completed').length
  const subscriberCount = subscribers.length

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

      {/* 탭 */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {TABS.map((tab) => {
          const count = tab.id === 'active' ? activeCount
            : tab.id === 'subscriber' ? subscriberCount
            : completedCount
          const TabIcon = tab.icon

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {TabIcon && <TabIcon className="w-4 h-4" />}
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="이름 또는 이메일로 검색..."
          className="max-w-md"
        />
      </div>

      {/* 목록 */}
      {filteredData.length === 0 && !error ? (
        <EmptyState
          icon={activeTab === 'subscriber' ? Crown : Users}
          title={
            activeTab === 'subscriber'
              ? '구독 중인 피코치가 없습니다'
              : activeTab === 'completed'
              ? '완료된 피코치가 없습니다'
              : '등록된 피코치가 없습니다'
          }
          description={
            activeTab === 'subscriber'
              ? '코칭을 완료한 피코치가 구독으로 전환하면 여기에 표시됩니다.'
              : activeTab === 'completed'
              ? '코칭이 완료된 피코치가 없습니다.'
              : '아직 등록된 피코치가 없습니다.'
          }
        />
      ) : activeTab === 'subscriber' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredData.map((subscriber) => (
            <SubscriberCard
              key={subscriber.id}
              subscriber={subscriber}
              onClick={() => navigate(`/coach/coachees/${subscriber.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredData.map((coachee) => (
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

function SubscriberCard({ subscriber, onClick }) {
  const planLabels = {
    monthly: '월간',
    quarterly: '분기',
    yearly: '연간'
  }

  const sessionsRemaining = subscriber.sessionsPerMonth - subscriber.sessionsUsed
  const periodEndDate = subscriber.periodEnd
    ? new Date(subscriber.periodEnd).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric'
      })
    : '-'

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="py-5">
        <div className="flex items-start gap-4">
          <Avatar name={subscriber.name} size="lg" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{subscriber.name}</h3>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                <Crown className="w-3 h-3" />
                {planLabels[subscriber.planType] || '월간'} 구독
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{subscriber.email}</p>

            {/* 세션 사용량 */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">이번 달 세션</span>
                <span className="font-medium">
                  {subscriber.sessionsUsed}/{subscriber.sessionsPerMonth}회 사용
                </span>
              </div>
              <ProgressBar
                current={subscriber.sessionsUsed}
                total={subscriber.sessionsPerMonth}
                color="yellow"
                size="md"
              />
            </div>

            {/* 갱신일 & 남은 세션 */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>갱신: {periodEndDate}</span>
              </div>
              <span className={`font-medium ${sessionsRemaining > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                {sessionsRemaining > 0 ? `${sessionsRemaining}회 남음` : '완료'}
              </span>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  )
}
