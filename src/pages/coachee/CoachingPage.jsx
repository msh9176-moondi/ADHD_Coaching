import { useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'
import { getCoacheeProfile, getCoacheePackage, getCoachingGoal } from '../../lib/coacheeService'
import { getCoachingProgressStatus, getLastCoachMessage, getConfirmedGoals } from '../../lib/messageService'
import { getSessionsForCoachee } from '../../lib/sessionService'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { CoachingProgress } from '../../components/coachee/CoachingProgress'
import { NextSession } from '../../components/coachee/NextSession'
import { CoachMessage } from '../../components/coachee/CoachMessage'
import { MyGoal } from '../../components/coachee/MyGoal'
import { PackageProgress } from '../../components/coachee/PackageProgress'
import { SessionTasksCard } from '../../components/coachee/SessionTasksCard'
import { MatchingCard } from '../../components/coachee/MatchingCard'
import { MessageSquare } from 'lucide-react'

export function CoachingPage() {
  const {
    user,
    matchedCoach,
    subscription,
    setCoacheeProfile,
    setMatchedCoach,
    setCoachingPackage,
    setCoachingGoal,
    setCoachingStatus,
    setLastCoachMessage,
    setSessions
  } = useStore()
  const [isLoading, setIsLoading] = useState(true)
  const [hasCoach, setHasCoach] = useState(!!matchedCoach)

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

        // 코칭 목표
        const goalData = await getCoachingGoal(user.id)
        if (goalData) {
          setCoachingGoal({
            title: goalData.title,
            currentScore: goalData.current_score || 0,
            targetScore: goalData.target_score || 5,
            currentAction: goalData.current_action
          })
        } else {
          // coaching_goals 테이블에 없으면 메시지에서 확정된 목표합의서 확인
          try {
            const confirmedGoals = await getConfirmedGoals(user.id)
            if (confirmedGoals && confirmedGoals.length > 0) {
              const latestGoal = confirmedGoals[0]
              if (latestGoal.goals && latestGoal.goals.length > 0) {
                const mainGoal = latestGoal.goals[0]
                setCoachingGoal({
                  title: mainGoal.topic || mainGoal.title || (typeof mainGoal === 'string' ? mainGoal : ''),
                  currentScore: mainGoal.currentScore || 0,
                  targetScore: mainGoal.targetScore || 5,
                  currentAction: mainGoal.desiredResult || mainGoal.currentAction || null
                })
              }
            }
          } catch (err) {
            console.warn('확정된 목표합의서 조회 실패:', err)
          }
        }

        // 코칭 진행 상태
        try {
          const progressStatus = await getCoachingProgressStatus(user.id)
          setCoachingStatus(progressStatus)
        } catch (err) {
          console.warn('코칭 진행 상태 로드 실패:', err)
        }

        // 최신 코치 메시지
        try {
          const lastMessage = await getLastCoachMessage(user.id)
          if (lastMessage) {
            setLastCoachMessage(lastMessage)
          }
        } catch (err) {
          console.warn('최신 코치 메시지 로드 실패:', err)
        }

        // 세션 데이터 로드
        try {
          const sessionsData = await getSessionsForCoachee(user.id)
          if (sessionsData && sessionsData.length > 0) {
            setSessions(sessionsData)
          }
        } catch (err) {
          console.warn('세션 데이터 로드 실패:', err)
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

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-20 lg:pb-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">코칭 상담</h1>
          <p className="text-sm text-gray-500">코치와 함께 목표를 향해 나아가세요</p>
        </div>
      </div>

      {/* 코치 매칭 카드 (코치가 없을 때만) */}
      {!hasCoach && <MatchingCard />}

      {/* 패키지 진행 현황 */}
      {hasCoach && !subscription && <PackageProgress />}

      {/* 2열 그리드: 코칭 진행 상태 & 코치 메시지 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <CoachingProgress />
        <CoachMessage />
      </div>

      {/* 나의 코칭 목표 */}
      <MyGoal />

      {/* 다음 회기까지 과제 */}
      <SessionTasksCard />

      {/* 다음 상담 */}
      <NextSession />
    </div>
  )
}
