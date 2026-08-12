import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card'
import { CategoryScoresCard } from '../../components/common/CategoryScoresCard'
import { Avatar } from '../../components/common/Avatar'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import {
  COMMUNICATION_STYLE_LABELS,
  TIME_SLOT_LABELS,
  CATEGORY_LABELS
} from '../../data/sampleCoachees'
import { ADHD_TYPES, PACKAGES } from '../../data/coachData'
import { SessionDetailModal } from '../../components/coach/SessionDetailModal'
import { TaskModal } from '../../components/coach/TaskModal'
import { CoachAIBriefing } from '../../components/coach/CoachAIBriefing'
import { coacheeService } from '../../lib'
import { getOrCreateConversation, sendMessage, getMessages } from '../../lib/messageService'
import { getCoacheeSessions } from '../../lib/sessionService'
import { useStore } from '../../store/useStore'
import {
  ArrowLeft, User, Heart, AlertCircle, MessageCircle, Clock,
  Brain, Target, CheckCircle, Calendar, TrendingUp,
  FileText, ChevronRight, AlertTriangle, Zap, Layers,
  Package, Plus, CalendarPlus, Edit3, Loader2, UserCheck, UserX,
  Sparkles, ChevronDown, ChevronUp
} from 'lucide-react'

const TYPE_ICONS = {
  inattention: Brain,
  hyperactivity: Zap,
  impulsivity: AlertTriangle,
  combined: Layers
}

const TYPE_COLORS = {
  inattention: 'bg-purple-100 text-purple-600',
  hyperactivity: 'bg-orange-100 text-orange-600',
  impulsivity: 'bg-red-100 text-red-600',
  combined: 'bg-emerald-100 text-emerald-600'
}

// ADHD 유형 분석 함수
function getADHDType(asrsResult) {
  if (!asrsResult) return 'combined'
  const { inattentionScore, hyperactivityScore, impulsivityScore } = asrsResult
  const scores = [
    { type: 'inattention', score: inattentionScore },
    { type: 'hyperactivity', score: hyperactivityScore },
    { type: 'impulsivity', score: impulsivityScore }
  ]
  const sorted = scores.sort((a, b) => b.score - a.score)
  if (sorted[0].score > sorted[1].score * 1.3) {
    return sorted[0].type
  }
  return 'combined'
}

export function CoacheeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useStore()

  // 데이터 상태
  const [coachee, setCoachee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [accepting, setAccepting] = useState(false)
  const [messages, setMessages] = useState([])
  const [sessionNotes, setSessionNotes] = useState([])
  const [showAIBriefing, setShowAIBriefing] = useState(false)

  // 모달 상태
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  // 피코치 데이터 로드
  useEffect(() => {
    async function loadCoachee() {
      try {
        setLoading(true)
        const data = await coacheeService.getCoacheeDetail(id)
        // 데이터 형식 변환
        const coacheeData = {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          matchedAt: data.matched_at,
          packageType: data.package_type,
          currentSession: data.current_session || 0,
          totalSessions: data.total_sessions || 5,
          nextSession: data.next_session_date ? `${data.next_session_date} ${data.next_session_time || ''}`.trim() : null,
          status: data.status,
          recentScore: data.recent_score || 0,
          targetScore: data.target_score || 5,
          hasWarning: data.has_warning || false,
          topics: data.topics || [],
          selfIntro: data.self_intro,
          asrsResult: data.asrs_result,
          preSurvey: data.pre_survey,
          coachingGoal: data.coaching_goal,
          tasks: data.tasks || [],
          sessionHistory: data.session_history || []
        }
        setCoachee(coacheeData)

        // AI 브리핑을 위한 추가 데이터 로드 (user가 있을 때만)
        if (user?.id && data.user_id) {
          try {
            // 메시지 로드 (대화방 조회 후 메시지 가져오기)
            const conversation = await getOrCreateConversation(user.id, data.user_id)
            if (conversation?.id) {
              const msgs = await getMessages(conversation.id, 100)
              setMessages(msgs || [])
            }

            // 세션 노트 로드
            const sessions = await getCoacheeSessions(user.id, data.user_id)
            const notes = sessions
              .filter(s => s.session_notes && s.session_notes.length > 0)
              .map(s => s.session_notes[0])
            setSessionNotes(notes)
          } catch (err) {
            console.warn('AI 브리핑 데이터 로드 실패:', err)
          }
        }
      } catch (err) {
        if (err.message === 'LOCAL_MODE') {
          setError('Supabase가 설정되지 않았습니다.')
        } else {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }
    loadCoachee()
  }, [id, user?.id])

  const pkg = coachee?.packageType ? PACKAGES[coachee.packageType] : null

  const packageColors = {
    starter: 'bg-green-100 text-green-700 border-green-200',
    basic: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    premium: 'bg-purple-100 text-purple-700 border-purple-200'
  }

  const handleWriteNote = (sessionNum) => {
    // 세션 일지 페이지로 이동 (sessionNum이 없으면 새 세션 작성)
    if (sessionNum) {
      navigate(`/coach/sessions?coachee=${coachee.id}&session=${sessionNum}`)
    } else {
      // 새 세션: session 파라미터 없이 이동하면 페이지에서 다음 회기 계산
      navigate(`/coach/sessions?coachee=${coachee.id}&new=true`)
    }
  }

  const handleSessionClick = (session) => {
    setSelectedSession(session)
    setIsDetailModalOpen(true)
  }

  const handleEditSession = (session) => {
    setIsDetailModalOpen(false)
    // 세션 일지 페이지로 이동
    navigate(`/coach/sessions?coachee=${coachee.id}&session=${session.session}`)
  }

  const handleAddTask = () => {
    setSelectedTask(null)
    setIsTaskModalOpen(true)
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  const handleSaveTask = (taskData) => {
    console.log('Task saved:', taskData)
    // TODO: 실제 저장 로직
  }

  const handleDeleteTask = (taskId) => {
    console.log('Task deleted:', taskId)
    // TODO: 실제 삭제 로직
  }

  // 피코치 수락
  const handleAccept = async () => {
    if (!coachee || !user?.id) return

    try {
      setAccepting(true)

      // 1. 매칭 처리 (코치 ID 연결)
      await coacheeService.matchCoachee(coachee.id, user.id, coachee.packageType || 'basic')

      // 2. 대화방 생성 및 웰컴 메시지 전송
      const conversation = await getOrCreateConversation(user.id, coachee.userId)

      const welcomeMessage = `안녕하세요, ${coachee.name}님! 🎉

저는 ${user.name || '코치'}입니다. 코칭 신청을 수락해주셔서 감사합니다.

앞으로 함께 성장해 나가는 시간이 되길 바랍니다.
궁금한 점이 있으시면 언제든 편하게 말씀해주세요!`

      await sendMessage(
        conversation.id,
        user.id,
        'coach',
        welcomeMessage,
        'normal',
        { type: 'welcome' }
      )

      // 3. 피코치 목록으로 이동
      alert(`${coachee.name}님을 수락했습니다. 웰컴 메시지가 전송되었습니다.`)
      navigate('/coach/coachees')

    } catch (err) {
      console.error('수락 처리 실패:', err)
      alert('수락 처리 중 오류가 발생했습니다.')
    } finally {
      setAccepting(false)
    }
  }

  // 피코치 거절
  const handleReject = async () => {
    if (!coachee) return

    const confirmed = window.confirm(`${coachee.name}님의 코칭 신청을 거절하시겠습니까?`)
    if (!confirmed) return

    try {
      // 상태를 rejected로 변경
      await coacheeService.updateCoacheeById(coachee.id, { status: 'rejected' })

      alert(`${coachee.name}님의 신청을 거절했습니다.`)
      navigate('/coach/coachees')

    } catch (err) {
      console.error('거절 처리 실패:', err)
      alert('거절 처리 중 오류가 발생했습니다.')
    }
  }

  // 대기 중인 신청자인지 확인
  const isPending = coachee?.status === 'pending'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="ml-2 text-gray-600">피코치 정보를 불러오는 중...</span>
      </div>
    )
  }

  if (error || !coachee) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 mb-4">{error || '피코치를 찾을 수 없습니다.'}</p>
        <Button variant="outline" onClick={() => navigate('/coach/coachees')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로 돌아가기
        </Button>
      </div>
    )
  }

  const adhdType = getADHDType(coachee.asrsResult)
  const typeInfo = ADHD_TYPES[adhdType]
  const TypeIcon = TYPE_ICONS[adhdType]
  const displaySession = Math.min(coachee.currentSession, coachee.totalSessions)
  const progress = Math.min((coachee.currentSession / coachee.totalSessions) * 100, 100)
  const isCoachingCompleted = coachee.currentSession > coachee.totalSessions

  // 약점 영역 계산
  const weakAreas = coachee.preSurvey?.categoryScores
    ? Object.entries(coachee.preSurvey.categoryScores)
        .filter(([key]) => key !== 'total')
        .map(([key, scoreData]) => {
          // scoreData가 객체면 average 사용, 숫자면 그대로 사용
          const score = typeof scoreData === 'object' ? scoreData.average : scoreData
          return { key, score: score || 0, label: CATEGORY_LABELS[key] }
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, 2)
    : []

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button variant="ghost" onClick={() => navigate('/coach/coachees')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{coachee.name}</h1>
              {isPending && (
                <Badge variant="warning" className="text-sm">신청 대기중</Badge>
              )}
            </div>
            <p className="text-gray-500 text-sm truncate">{coachee.email}</p>
          </div>
        </div>

        {/* 대기 중인 신청자: 수락/거절 버튼 */}
        {isPending ? (
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <Button
              variant="outline"
              onClick={handleReject}
              className="border-red-200 text-red-600 hover:bg-red-50"
              size="sm"
            >
              <UserX className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">거절</span>
            </Button>
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              {accepting ? (
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{accepting ? '처리 중...' : '수락하기'}</span>
            </Button>
          </div>
        ) : (
          <Button onClick={() => navigate(`/coach/messages?coachee=${coachee.id}`)} size="sm">
            <MessageCircle className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">메시지 보내기</span>
          </Button>
        )}
      </div>

      {/* 기본 정보 카드 */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <Avatar name={coachee.name} size="lg" className="hidden sm:flex" />
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Avatar name={coachee.name} size="md" className="sm:hidden" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{coachee.name}</h2>
                {pkg && (
                  <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${packageColors[coachee.packageType]}`}>
                    <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {pkg.name} {pkg.sessions}회기
                  </span>
                )}
                {coachee.hasWarning && (
                  <Badge variant="warning" className="flex items-center gap-1 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="hidden sm:inline">{coachee.warningReason || '주의 필요'}</span>
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mt-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">코칭 시작일</p>
                  <p className="text-sm sm:text-base font-medium truncate">{coachee.matchedAt?.split('T')[0] || coachee.matchedAt}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">다음 세션</p>
                  <p className="text-sm sm:text-base font-medium">{coachee.nextSession || '-'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">연락처</p>
                  <p className="text-sm sm:text-base font-medium">{coachee.phone || '-'}</p>
                </div>
              </div>

              {/* 진행률 */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">코칭 진행률</span>
                  <span className="font-medium">
                    {displaySession}/{coachee.totalSessions} 회기
                    {isCoachingCompleted && ' (완료)'}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI 코칭 브리핑 섹션 */}
      {!isPending && (
        <div className="space-y-3">
          <button
            onClick={() => setShowAIBriefing(!showAIBriefing)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl hover:from-emerald-100 hover:to-teal-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-emerald-900">AI 코칭 브리핑</h3>
                <p className="text-sm text-emerald-700">
                  피코치 분석, 코칭 전략, 질문 제안
                </p>
              </div>
            </div>
            {showAIBriefing ? (
              <ChevronUp className="w-5 h-5 text-emerald-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-emerald-600" />
            )}
          </button>

          {showAIBriefing && (
            <CoachAIBriefing
              coacheeData={{
                name: coachee.name,
                packageType: coachee.packageType,
                totalSessions: coachee.totalSessions,
                topics: coachee.topics,
                startDate: coachee.matchedAt
              }}
              messages={messages}
              sessionNotes={sessionNotes}
              reflections={[]}
              currentSessionNumber={coachee.currentSession + 1}
              mode="full"
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 자기소개 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              자기소개
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <User className="w-4 h-4 text-emerald-500" />
                소개
              </h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {coachee.selfIntro?.intro || '작성된 내용이 없습니다.'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Heart className="w-4 h-4 text-pink-500" />
                기대하는 것
              </h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {coachee.selfIntro?.expectation || '작성된 내용이 없습니다.'}
              </p>
            </div>

            {coachee.selfIntro?.concern && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  걱정되는 것
                </h4>
                <p className="text-sm text-gray-600 bg-amber-50 p-3 rounded-lg">
                  {coachee.selfIntro.concern}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <MessageCircle className="w-4 h-4 text-green-500" />
                선호하는 소통 방식
              </h4>
              <div className="flex flex-wrap gap-2">
                {coachee.selfIntro?.communicationStyles?.map((style) => (
                  <Badge key={style} variant="success">
                    {COMMUNICATION_STYLE_LABELS[style]}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Clock className="w-4 h-4 text-purple-500" />
                희망 시간대
              </h4>
              <div className="flex flex-wrap gap-2">
                {coachee.selfIntro?.preferredTimes?.map((time) => (
                  <Badge key={time} variant="default">
                    {TIME_SLOT_LABELS[time]}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 오른쪽 열: ADHD 분석 결과 + 영역별 점수 */}
        <div className="space-y-6">
          {/* ADHD 분석 결과 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                ADHD 분석 결과
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coachee.asrsResult ? (
                <>
                  {/* ADHD 유형 */}
                  <div className={`p-4 rounded-xl ${TYPE_COLORS[adhdType].split(' ')[0]}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${TYPE_COLORS[adhdType]} flex items-center justify-center`}>
                        <TypeIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{typeInfo?.name}</h4>
                        <p className="text-sm text-gray-600">{typeInfo?.description?.slice(0, 50)}...</p>
                      </div>
                    </div>
                  </div>

                  {/* 점수 */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { label: '주의력', score: coachee.asrsResult?.inattentionScore, max: 36, color: 'purple' },
                      { label: '과잉행동', score: coachee.asrsResult?.hyperactivityScore, max: 20, color: 'orange' },
                      { label: '충동성', score: coachee.asrsResult?.impulsivityScore, max: 16, color: 'red' }
                    ].map(item => (
                      <div key={item.label} className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className={`text-2xl font-bold text-${item.color}-600`}>
                          {item.score || 0}
                        </div>
                        <div className="text-xs text-gray-500">{item.label}</div>
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-${item.color}-500 rounded-full`}
                            style={{ width: `${((item.score || 0) / item.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 코칭 필요 영역 */}
                  {weakAreas.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
                        <Target className="w-4 h-4 text-red-500" />
                        코칭 집중 영역
                      </h4>
                      <div className="space-y-2">
                        {weakAreas.map((area, idx) => (
                          <div
                            key={area.key}
                            className={`p-3 rounded-lg border ${
                              idx === 0 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  idx === 0 ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700'
                                }`}>
                                  {idx + 1}순위
                                </span>
                                <span className="font-medium text-gray-900">{area.label}</span>
                              </div>
                              <span className={`font-bold ${idx === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                {area.score.toFixed(1)} / 5
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center">
                  <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">ASRS 테스트 미완료</p>
                  <p className="text-sm text-gray-400 mt-1">피코치가 ASRS 자가진단을 완료하면 결과가 표시됩니다.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 영역별 점수 (사전설문 결과) */}
          <CategoryScoresCard
            preSurvey={coachee.preSurvey}
            title="영역별 점수 (사전설문)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 현재 코칭 목표 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              현재 코칭 목표
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 목표 합의서 주제들 */}
            {coachee.topics && coachee.topics.length > 0 ? (
              <div className="space-y-3 mb-4">
                {coachee.topics.map((topic, index) => (
                  <div key={`topic-${index}-${topic.id || ''}`} className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {topic.title}
                        </h3>
                        {topic.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {topic.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-green-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${((topic.current_score || 0) / (topic.target_score || 10)) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-green-700">
                            {topic.current_score || 0} / {topic.target_score || 10}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : coachee.coachingGoal?.title ? (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {coachee.coachingGoal.title}
                </h3>
                {coachee.coachingGoal.currentAction && (
                  <p className="text-sm text-gray-600 mb-3">
                    {coachee.coachingGoal.currentAction}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${((coachee.coachingGoal.currentScore || 0) / (coachee.coachingGoal.targetScore || 10)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-green-700">
                    {coachee.coachingGoal.currentScore || 0} / {coachee.coachingGoal.targetScore || 10}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center mb-4">
                <Target className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500 text-sm">목표 합의서가 아직 없습니다</p>
                <p className="text-gray-400 text-xs mt-1">채팅에서 목표 합의서를 작성해주세요</p>
              </div>
            )}

            {/* 과제 현황 */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">과제 현황</h4>
              <button
                onClick={handleAddTask}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                과제 추가
              </button>
            </div>
            <div className="space-y-2">
              {coachee.tasks?.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => handleEditTask(task)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      task.status === 'completed' ? 'bg-green-100' :
                      task.status === 'in_progress' ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}>
                      {task.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : task.status === 'in_progress' ? (
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <span className={`text-sm ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {task.title}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{task.dueDate}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 세션 기록 */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              세션 기록
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/coach/schedule?coachee=${coachee.id}`)}
                className="text-xs sm:text-sm"
              >
                <CalendarPlus className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">세션 예약</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWriteNote()}
                className="text-xs sm:text-sm"
              >
                <Edit3 className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">일지 작성</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {coachee.sessionHistory?.slice().reverse().map((session, index) => (
                <div
                  key={session.id || `session-${session.session}-${index}`}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                  onClick={() => handleSessionClick(session)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">{session.session}회기</Badge>
                      <span className="text-sm font-medium text-gray-900">{session.topic}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{session.date}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{session.note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 모달들 */}
      <SessionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        coachee={coachee}
        session={selectedSession}
        onEdit={handleEditSession}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        coachee={coachee}
        task={selectedTask}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  )
}
