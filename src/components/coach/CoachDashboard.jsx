import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Badge } from '../common/Badge'
import { StatCard } from '../common/StatCard'
import { LoadingContainer } from '../common/LoadingSpinner'
import { useStore } from '../../store/useStore'
import { coacheeService, sessionService } from '../../lib'
import { getCoachSubscribers, confirmSubscriptionPayment } from '../../lib/subscriptionService'
import { Users, Calendar, AlertTriangle, Clock, Crown, CheckCircle, Loader2 } from 'lucide-react'

// 분리된 서브 컴포넌트 import
import { TodaySessionsList } from './dashboard/TodaySessionsList'
import { WarningList } from './dashboard/WarningList'
import { PendingApplicantsList } from './dashboard/PendingApplicantsList'
import { PendingSubscriptionsList } from './dashboard/PendingSubscriptionsList'
import { CoacheeQuickList } from './dashboard/CoacheeQuickList'

export function CoachDashboard() {
  const navigate = useNavigate()
  const { user } = useStore()
  const [coachees, setCoachees] = useState([])
  const [pendingApplicants, setPendingApplicants] = useState([])
  const [pendingSubscriptions, setPendingSubscriptions] = useState([])
  const [todaySessions, setTodaySessions] = useState([])
  const [allSubscribers, setAllSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCoachees: 0,
    weekSessions: 0,
    warnings: 0,
    pendingApplicants: 0,
    pendingSubscriptions: 0
  })

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)

        // 피코치 목록 로드 (담당 + 신청자)
        const { matched, pending } = await coacheeService.getAllCoacheesForCoach(user?.id)

        const formatted = (matched || []).map(c => ({
          id: c.id,
          name: c.name,
          packageType: c.package_type,
          currentSession: c.current_session || 0,
          totalSessions: c.total_sessions || 5,
          nextSession: c.next_session_date ? `${c.next_session_date} ${c.next_session_time || ''}`.trim() : '-',
          recentScore: c.recent_score || 0,
          targetScore: c.target_score || 5,
          hasWarning: c.has_warning || false
        }))
        setCoachees(formatted)
        setPendingApplicants(pending || [])

        // 이번 주 세션 수 조회
        let weekSessionCount = 0
        try {
          weekSessionCount = await sessionService.getWeekSessionsCount(user?.id)
        } catch {
          weekSessionCount = 0
        }

        // 통계 계산
        const warningCount = formatted.filter(c => c.hasWarning).length
        setStats({
          totalCoachees: formatted.length,
          weekSessions: weekSessionCount,
          warnings: warningCount,
          pendingApplicants: (pending || []).length
        })

        // 오늘 세션 로드
        try {
          const sessions = await sessionService.getTodaySessions(user?.id)
          setTodaySessions(sessions || [])
        } catch {
          setTodaySessions([])
        }

        // 구독자 로드
        try {
          const subscribers = await getCoachSubscribers(user?.id)
          const pendingSubs = subscribers.filter(s => s.status === 'pending')
          setPendingSubscriptions(pendingSubs)
          setStats(prev => ({ ...prev, pendingSubscriptions: pendingSubs.length }))
          // 모든 구독자를 CoacheeQuickList용으로 포맷
          const formattedSubs = subscribers.map(s => ({
            id: s.id,
            subscriptionId: s.id,
            userId: s.user_id,
            name: s.user?.name || '구독자',
            email: s.user?.email || '',
            planType: s.plan_type,
            status: s.status,
            sessionsUsed: s.sessions_used_this_month || 0,
            sessionsPerMonth: s.sessions_per_month || 3
          }))
          setAllSubscribers(formattedSubs)
        } catch {
          setPendingSubscriptions([])
          setAllSubscribers([])
        }
      } catch (err) {
        console.warn('대시보드 데이터 로드 실패:', err)
        setCoachees([])
        setPendingApplicants([])
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [user?.id])

  if (loading) {
    return <LoadingContainer text="대시보드를 불러오는 중..." />
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 요약 카드들 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={Users}
          label="담당 피코치"
          value={String(stats.totalCoachees)}
          color="blue"
        />
        <StatCard
          icon={Clock}
          label="신규 신청"
          value={String(stats.pendingApplicants)}
          color="green"
          highlight={stats.pendingApplicants > 0}
        />
        <StatCard
          icon={Calendar}
          label="이번 주 상담"
          value={String(stats.weekSessions)}
          color="purple"
        />
        <StatCard
          icon={AlertTriangle}
          label="주의 필요"
          value={String(stats.warnings)}
          color="yellow"
        />
      </div>

      {/* 입금 대기 중인 구독 (있을 때만 표시) */}
      {pendingSubscriptions.length > 0 && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Crown className="w-5 h-5" />
              입금 확인 필요
              <Badge variant="warning" className="ml-2">{pendingSubscriptions.length}건</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PendingSubscriptionsList
              subscriptions={pendingSubscriptions}
              onConfirmed={(id) => {
                setPendingSubscriptions(prev => prev.filter(s => s.id !== id))
                setStats(prev => ({ ...prev, pendingSubscriptions: prev.pendingSubscriptions - 1 }))
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* 신규 신청자 (있을 때만 표시) */}
      {pendingApplicants.length > 0 && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Clock className="w-5 h-5" />
              신규 코칭 신청
              <Badge variant="success" className="ml-2">{pendingApplicants.length}명</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PendingApplicantsList applicants={pendingApplicants} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* 오늘의 상담 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              오늘의 상담
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TodaySessionsList sessions={todaySessions} />
          </CardContent>
        </Card>

        {/* 주의가 필요한 피코치 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
              주의 필요
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WarningList coachees={coachees.filter(c => c.hasWarning)} />
          </CardContent>
        </Card>
      </div>

      {/* 피코치 목록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>담당 피코치</CardTitle>
          <button
            onClick={() => navigate('/coach/coachees')}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            전체보기
          </button>
        </CardHeader>
        <CardContent>
          <CoacheeQuickList coachees={coachees} subscribers={allSubscribers} />
        </CardContent>
      </Card>
    </div>
  )
}
