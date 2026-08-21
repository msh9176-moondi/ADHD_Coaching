import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { getCoacheeProfile, getCoacheePackage } from '../../lib/coacheeService'
import { getCoacheeTasks } from '../../lib/taskService'
import { getActiveUltramindProgram } from '../../lib/ultramindProgramService'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { CurrentAction } from '../../components/coachee/CurrentAction'
import { BrainDump } from '../../components/coachee/BrainDump'
import { RoutineTasksCard } from '../../components/coachee/RoutineTasksCard'
import { SessionTasksCard } from '../../components/coachee/SessionTasksCard'
import { NotificationCard } from '../../components/coachee/NotificationCard'
import { MatchingCard } from '../../components/coachee/MatchingCard'
import { ExecutionRecords } from '../../components/coachee/ExecutionRecords'
import { UltramindTodayPlan } from '../../components/coachee/UltramindTodayPlan'
import { UltramindProgressCard } from '../../components/coachee/UltramindProgressCard'
import { User, Brain } from 'lucide-react'

export function TodayPage() {
  const navigate = useNavigate()
  const {
    user,
    matchedCoach,
    coacheeProfile,
    setCoacheeProfile,
    setMatchedCoach,
    setCoachingAction,
    setCoachingPackage
  } = useStore()
  const userName = user?.name || '회원'
  const [isLoading, setIsLoading] = useState(true)
  const [hasCoach, setHasCoach] = useState(!!matchedCoach)
  const [hasUltramindProgram, setHasUltramindProgram] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!user?.id || !isSupabaseConfigured()) {
        setIsLoading(false)
        return
      }

      try {
        // 프로필 및 코치 정보 로드
        const profileData = await getCoacheeProfile(user.id)
        if (profileData) {
          setCoacheeProfile(profileData)
          if (profileData.coach_id) {
            setHasCoach(true)
            let coachName = '플로카 코치'
            try {
              const { data: coachData } = await supabase
                .from('users')
                .select('name')
                .eq('id', profileData.coach_id)
                .single()
              if (coachData?.name) {
                coachName = coachData.name
              }
            } catch (err) {
              console.warn('코치 이름 조회 실패:', err)
            }
            setMatchedCoach({
              coachId: profileData.coach_id,
              coachName,
              packageType: profileData.package_type,
              totalSessions: profileData.total_sessions,
              matchedAt: profileData.matched_at
            })
          } else {
            setHasCoach(false)
          }
        }

        // 패키지 정보
        const packageData = await getCoacheePackage(user.id)
        if (packageData) {
          setCoachingPackage({
            type: packageData.package_type || 'basic',
            totalSessions: packageData.total_sessions || 5,
            completedSessions: packageData.completed_sessions || 0,
            currentSession: packageData.current_session || 1
          })
        }

        // 울트라마인드 프로그램 확인
        const ultramindData = await getActiveUltramindProgram(user.id)
        setHasUltramindProgram(!!ultramindData)

        // 실행과제에서 지금 할 일 설정
        const tasks = await getCoacheeTasks(user.id)
        if (tasks && tasks.length > 0) {
          const today = new Date().toISOString().split('T')[0]
          const pendingTasks = tasks.filter(t => t.status !== 'completed')
          const todayTask = pendingTasks.find(t => t.due_date === today)
          const currentTask = todayTask || pendingTasks[0]

          if (currentTask) {
            setCoachingAction({
              id: currentTask.id,
              title: currentTask.title,
              minAction: currentTask.description || currentTask.min_action,
              status: currentTask.status
            })
          }
        }
      } catch (err) {
        console.error('데이터 로드 실패:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 울트라마인드 프로그램이 있는 경우 - 통합 뷰
  if (hasUltramindProgram) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-20 lg:pb-6">
        {/* 환영 메시지 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              안녕하세요, {userName}님
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              오늘의 맞춤 플랜을 확인하세요
            </p>
          </div>
          <button
            onClick={() => navigate('/coachee/settings')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="내 정보"
          >
            <User className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 코치님 알림 */}
        <NotificationCard />

        {/* 울트라마인드 진행 현황 */}
        <UltramindProgressCard />

        {/* 오늘의 맞춤 플랜 (할 일 + 식단 + 보충제 통합) */}
        <UltramindTodayPlan />

        {/* 코칭 과제 (있는 경우) */}
        <SessionTasksCard />

        {/* 나의 실행 기록 */}
        <ExecutionRecords />

        {/* 상세 프로그램 페이지 링크 */}
        <button
          onClick={() => navigate('/coachee/ultramind/program')}
          className="w-full py-3 px-4 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl text-violet-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Brain className="w-4 h-4" />
          6주 프로그램 상세 보기
        </button>
      </div>
    )
  }

  // 일반 코칭 모드 (울트라마인드 없음)
  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-20 lg:pb-6">
      {/* 환영 메시지 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            안녕하세요, {userName}님
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            오늘은 무엇부터 시작해 볼까요?
          </p>
        </div>
        <button
          onClick={() => navigate('/coachee/settings')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="내 정보"
        >
          <User className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 코치 매칭 카드 (코치가 없을 때만) */}
      {!hasCoach && <MatchingCard />}

      {/* 코치님 알림 */}
      <NotificationCard />

      {/* 지금 할 일 */}
      <CurrentAction />

      {/* 다음 회기까지 과제 */}
      <SessionTasksCard />

      {/* 오늘의 루틴 */}
      {hasCoach && <RoutineTasksCard />}

      {/* 브레인 덤프 & 실행목록 */}
      <BrainDump />

      {/* 나의 실행 기록 */}
      <ExecutionRecords />
    </div>
  )
}
