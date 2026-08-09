import { useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'
import { getASRSResult, getSurveyResult } from '../../lib/surveyService'
import { getCoacheePackage, getCoacheeProfile, getCoachingTopics, getCoachingGoal } from '../../lib/coacheeService'
import { getCoacheeTasks } from '../../lib/taskService'
import { getCoachingProgressStatus, getLastCoachMessage, getConfirmedGoals } from '../../lib/messageService'
import { getSessionsForCoachee } from '../../lib/sessionService'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { CurrentAction } from '../../components/coachee/CurrentAction'
import { TodayTasks } from '../../components/coachee/TodayTasks'
import { CoachingProgress } from '../../components/coachee/CoachingProgress'
import { NextSession } from '../../components/coachee/NextSession'
import { CoachMessage } from '../../components/coachee/CoachMessage'
import { MyGoal } from '../../components/coachee/MyGoal'
import { ReturnButton } from '../../components/coachee/ReturnButton'
import { MyAnalysisResult } from '../../components/coachee/MyAnalysisResult'
import { PackageProgress } from '../../components/coachee/PackageProgress'
import { TopicsScore } from '../../components/coachee/TopicsScore'
import { ExecutionRecords } from '../../components/coachee/ExecutionRecords'
import { SessionTasksCard } from '../../components/coachee/SessionTasksCard'
import { RoutineTasksCard } from '../../components/coachee/RoutineTasksCard'
import { NotificationCard } from '../../components/coachee/NotificationCard'
import { MatchingCard } from '../../components/coachee/MatchingCard'
import { AICheckinCard } from '../../components/coachee/AICheckinCard'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card'
import { Calendar, Clock } from 'lucide-react'

export function CoacheeDashboardPage() {
  const {
    user,
    sessions,
    matchedCoach,
    coachingPackage,
    setASRSResult,
    setPreSurvey,
    setPostSurvey,
    setCoachingPackage,
    setCoachingTopics,
    setCoachingGoal,
    setMatchedCoach,
    setCoachingStatus,
    setLastCoachMessage,
    setCoachingAction,
    setSessions
  } = useStore()
  const userName = user?.name || '다나'
  const [isLoading, setIsLoading] = useState(true)
  const [hasCoach, setHasCoach] = useState(!!matchedCoach)

  // Supabase에서 데이터 로드
  useEffect(() => {
    async function loadDashboardData() {
      if (!user?.id || !isSupabaseConfigured()) {
        setIsLoading(false)
        return
      }

      try {
        // 병렬로 데이터 로드
        const [asrsData, preSurveyData, postSurveyData, packageData, topicsData, goalData, profileData] = await Promise.allSettled([
          getASRSResult(user.id),
          getSurveyResult(user.id, 'pre'),
          getSurveyResult(user.id, 'post'),
          getCoacheePackage(user.id),
          getCoachingTopics(user.id),
          getCoachingGoal(user.id),
          getCoacheeProfile(user.id)
        ])

        // 코치 매칭 상태 확인
        if (profileData.status === 'fulfilled' && profileData.value) {
          const profile = profileData.value
          if (profile.coach_id) {
            setHasCoach(true)
            // 코치 이름 조회
            let coachName = '플로카 코치'
            try {
              const { data: coachData } = await supabase
                .from('users')
                .select('name')
                .eq('id', profile.coach_id)
                .single()
              if (coachData?.name) {
                coachName = coachData.name
              }
            } catch (err) {
              console.warn('코치 이름 조회 실패:', err)
            }
            setMatchedCoach({
              coachId: profile.coach_id,
              coachName,
              packageType: profile.package_type,
              totalSessions: profile.total_sessions,
              matchedAt: profile.matched_at
            })
          } else {
            setHasCoach(false)
          }
        }

        // ASRS 결과
        if (asrsData.status === 'fulfilled' && asrsData.value) {
          setASRSResult({
            totalScore: asrsData.value.total_score,
            maxScore: asrsData.value.max_score,
            inattentionScore: asrsData.value.inattention_score,
            hyperactivityScore: asrsData.value.hyperactivity_score,
            impulsivityScore: asrsData.value.impulsivity_score,
            level: asrsData.value.level,
            interpretation: asrsData.value.interpretation
          })
        }

        // 사전 설문
        if (preSurveyData.status === 'fulfilled' && preSurveyData.value) {
          setPreSurvey({
            answers: preSurveyData.value.answers,
            categoryScores: preSurveyData.value.category_scores,
            totalScore: preSurveyData.value.total_score
          })
        }

        // 사후 설문
        if (postSurveyData.status === 'fulfilled' && postSurveyData.value) {
          setPostSurvey({
            answers: postSurveyData.value.answers,
            categoryScores: postSurveyData.value.category_scores,
            totalScore: postSurveyData.value.total_score
          })
        }

        // 패키지 정보
        if (packageData.status === 'fulfilled' && packageData.value) {
          setCoachingPackage({
            type: packageData.value.package_type || 'basic',
            totalSessions: packageData.value.total_sessions || 5,
            completedSessions: packageData.value.completed_sessions || 0,
            currentSession: packageData.value.current_session || 1
          })
        }

        // 코칭 주제
        if (topicsData.status === 'fulfilled' && topicsData.value) {
          setCoachingTopics(topicsData.value.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            startScore: t.start_score || 0,
            currentScore: t.current_score || 0,
            targetScore: t.target_score || 5
          })))
        }

        // 코칭 목표
        if (goalData.status === 'fulfilled' && goalData.value) {
          setCoachingGoal({
            title: goalData.value.title,
            currentScore: goalData.value.current_score || 0,
            targetScore: goalData.value.target_score || 5,
            currentAction: goalData.value.current_action
          })
        } else {
          // coaching_goals 테이블에 없으면 메시지에서 확정된 목표합의서 확인
          try {
            const confirmedGoals = await getConfirmedGoals(user.id)
            if (confirmedGoals && confirmedGoals.length > 0) {
              const latestGoal = confirmedGoals[0]
              if (latestGoal.goals && latestGoal.goals.length > 0) {
                // 첫 번째 목표를 메인 코칭 목표로 설정
                const mainGoal = latestGoal.goals[0]
                // 목표 데이터 구조: {id, topic, targetScore, currentScore, desiredResult}
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

        // 코칭 진행 상태 (선언서, 목표합의서 완료 여부)
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

        // 세션 데이터 로드 (코치가 예약한 상담 일정)
        try {
          const sessionsData = await getSessionsForCoachee(user.id)
          if (sessionsData && sessionsData.length > 0) {
            setSessions(sessionsData)
          }
        } catch (err) {
          console.warn('세션 데이터 로드 실패:', err)
        }

        // 실행과제에서 지금 할 일 설정
        try {
          const tasks = await getCoacheeTasks(user.id)
          if (tasks && tasks.length > 0) {
            // 미완료된 과제 중 첫 번째 또는 오늘이 마감인 과제
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
          console.warn('실행과제 로드 실패:', err)
        }
      } catch (err) {
        console.error('대시보드 데이터 로드 실패:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user?.id])

  // 오늘의 일정 (예약된 세션)
  const today = new Date().toISOString().split('T')[0]
  const todaySchedule = sessions.filter((s) => s.date === today && s.status === 'scheduled')

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* 환영 메시지 */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          안녕하세요, {userName}님.
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          오늘은 무엇부터 시작해 볼까요?
        </p>
      </div>

      {/* 코치 매칭 카드 (항상 표시 - 내부에서 상태 관리) */}
      <MatchingCard />

      {/* 코치님 알림 */}
      <NotificationCard />

      {/* AI 체크인 */}
      {hasCoach && (
        <AICheckinCard
          userName={userName}
          currentGoal={useStore.getState().coachingGoal?.title}
          currentTask={useStore.getState().coachingAction?.title}
        />
      )}

      {/* 패키지 진행 현황 (코치 매칭 후에만 표시) */}
      {hasCoach && <PackageProgress />}

      {/* 다음 회기까지 과제 */}
      <SessionTasksCard />

      {/* 오늘의 루틴 (채팅에서 받은 루틴 과제) */}
      {hasCoach && <RoutineTasksCard />}

      {/* 지금 할 일 (가장 크게) */}
      <CurrentAction />

      {/* 2열 그리드: 오늘의 일정 & 오늘의 할 일 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* 오늘의 일정 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              오늘의 일정
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                오늘 예정된 일정이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {schedule.time}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {schedule.topic || '코칭 세션'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 오늘의 할 일 */}
        <TodayTasks />
      </div>

      {/* 2열 그리드: 코칭 진행 상태 & 코치 메시지 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <CoachingProgress />
        <CoachMessage />
      </div>

      {/* 주제별 점수 */}
      <TopicsScore />

      {/* 나의 실행 기록 */}
      <ExecutionRecords />

      {/* 나의 코칭 목표 */}
      <MyGoal />

      {/* 다음 상담 */}
      <NextSession />

      {/* 나의 분석 결과 */}
      <MyAnalysisResult />

      {/* 복귀 버튼 (항상 표시) */}
      <ReturnButton />
    </div>
  )
}
