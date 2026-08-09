import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '../../components/common/Card'
import { Avatar } from '../../components/common/Avatar'
import { Button } from '../../components/common/Button'
import { MessageList } from '../../components/messages/MessageList'
import { useStore } from '../../store/useStore'
import { getSessionsForCoachee } from '../../lib/sessionService'
import { getOrCreateConversation } from '../../lib/messageService'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  Target, Calendar, ChevronDown, ChevronUp,
  TrendingUp, CheckCircle, Flame, Star, MessageSquare
} from 'lucide-react'

export function MessagesPage() {
  const { matchedCoach, user } = useStore()
  const [messages, setMessages] = useState([])
  const [showGoalDetail, setShowGoalDetail] = useState(false)
  const [nextSession, setNextSession] = useState(null)
  const [conversationId, setConversationId] = useState(null)

  const coachName = matchedCoach?.coachName || '플로카 코치'
  const coachId = matchedCoach?.coachId

  // 대화방 생성/조회
  useEffect(() => {
    async function initConversation() {
      if (!user?.id || !coachId || !isSupabaseConfigured()) return
      try {
        const conversation = await getOrCreateConversation(coachId, user.id)
        setConversationId(conversation.id)
      } catch (err) {
        console.error('대화방 생성 실패:', err)
      }
    }
    initConversation()
  }, [user?.id, coachId])

  // 다음 세션 정보 로드
  useEffect(() => {
    async function loadNextSession() {
      if (!user?.id) return
      try {
        const sessions = await getSessionsForCoachee(user.id)
        // 예정된 세션 중 가장 가까운 것
        const upcoming = sessions
          .filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > new Date())
          .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0]
        setNextSession(upcoming || null)
      } catch (error) {
        console.error('Failed to load sessions:', error)
      }
    }
    loadNextSession()
  }, [user?.id])

  // 메시지에서 확정된 목표 합의서 찾기
  const confirmedGoal = useMemo(() => {
    const goalMessages = messages.filter(
      m => m.type === 'goal_agreement' && m.goalData?.status === 'confirmed'
    )
    if (goalMessages.length > 0) {
      return goalMessages[goalMessages.length - 1].goalData
    }
    return null
  }, [messages])

  return (
    <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
      {/* 코치 정보 카드 */}
      <Card>
        <CardContent className="py-3 md:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 md:w-4 md:h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-gray-900">{coachName}</h2>
                <p className="text-xs md:text-sm text-gray-500">ADHD 실행회복 코칭</p>
              </div>
            </div>

            <div className="text-left sm:text-right ml-15 sm:ml-0">
              <p className="text-xs md:text-sm text-gray-500">다음 세션</p>
              {nextSession ? (
                <p className="text-sm md:text-base font-medium text-gray-900 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  {new Date(nextSession.scheduled_at).toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              ) : (
                <p className="text-xs md:text-sm text-gray-400">예정된 세션 없음</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 나의 코칭 목표 카드 */}
      {confirmedGoal ? (
        <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="py-4">
            <button
              onClick={() => setShowGoalDetail(!showGoalDetail)}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">나의 코칭 목표</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-600 font-medium">
                    {confirmedGoal.goals?.length || 0}개 목표
                  </span>
                  {showGoalDetail ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* 목표 요약 (항상 표시) */}
              <div className="flex flex-wrap gap-2">
                {confirmedGoal.goals?.map((goal, idx) => (
                  <div
                    key={goal.id || idx}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-blue-200"
                  >
                    <Target className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">{goal.topic}</span>
                    <span className="text-xs text-blue-600 font-bold">
                      {goal.currentScore} → {goal.targetScore}
                    </span>
                  </div>
                ))}
              </div>
            </button>

            {/* 목표 상세 (펼쳤을 때) */}
            {showGoalDetail && (
              <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
                {confirmedGoal.goals?.map((goal, idx) => (
                  <GoalProgressCard key={goal.id || idx} goal={goal} index={idx} />
                ))}

                <div className="pt-2">
                  <p className="text-xs text-center text-blue-600">
                    목표를 향해 한 걸음씩 나아가고 있어요!
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-gray-200">
          <CardContent className="py-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-700 mb-1">아직 설정된 목표가 없습니다</h3>
              <p className="text-sm text-gray-500">코치님과 상담 후 목표가 설정됩니다.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 오늘의 한마디 / 동기부여 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-medium text-amber-900 mb-1">오늘의 코칭 팁</h3>
            <p className="text-sm text-amber-700">
              "완벽하게 하려고 하지 마세요. 시작하는 것 자체가 이미 절반의 성공입니다."
            </p>
          </div>
        </div>
      </div>

      {/* 메시지 리스트 */}
      <MessageList
        userRole="coachee"
        messages={messages}
        setMessages={setMessages}
        coacheeName={user?.name || '나'}
        coachName={coachName}
        conversationId={conversationId}
        userId={user?.id}
      />
    </div>
  )
}

// 목표 진행률 카드
function GoalProgressCard({ goal, index }) {
  const progress = ((goal.currentScore / goal.targetScore) * 100).toFixed(0)
  const progressWidth = Math.min(progress, 100)

  return (
    <div className="bg-white rounded-xl p-4 border border-blue-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">{index + 1}</span>
          </div>
          <h4 className="font-medium text-gray-900">{goal.topic}</h4>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-500">{goal.currentScore}점</span>
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-blue-600 font-bold">{goal.targetScore}점</span>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="mb-2">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* 바람직한 결과 */}
      {goal.desiredResult && (
        <div className="flex items-start gap-2 text-sm text-gray-500">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <span>{goal.desiredResult}</span>
        </div>
      )}
    </div>
  )
}
