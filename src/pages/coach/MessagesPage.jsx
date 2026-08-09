import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card'
import { Avatar } from '../../components/common/Avatar'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { MessageList } from '../../components/messages/MessageList'
import { PACKAGES, COACHING_AREAS } from '../../data/coachData'
import { useStore } from '../../store/useStore'
import { coacheeService } from '../../lib'
import { getOrCreateConversation, sendMessage, getMessages, getConfirmedGoals } from '../../lib/messageService'
import { saveCoachingTopicsFromGoal } from '../../lib/coacheeService'
import { getOrCreateSession, saveSessionNote, getSessionNote, deleteSession, scheduleFollowUpSession, getCoacheeSessions } from '../../lib/sessionService'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  Search, MessageCircle, Clock, FileText, ChevronRight,
  X, Save, Brain, Heart, CheckSquare, Lightbulb, Rocket,
  AlertTriangle, ChevronDown, ChevronUp, Plus, Calendar,
  CheckCircle2, Loader2, CheckCircle, AlertCircle,
  Trash2, RotateCcw, TrendingUp, User, Target, TrendingDown,
  Sparkles, ArrowLeft, Menu, MoreVertical
} from 'lucide-react'
import { AIInsightsPanel } from '../../components/messages/AIInsightsPanel'

// 패키지 색상 설정
const packageColors = {
  starter: 'bg-green-100 text-green-700',
  basic: 'bg-blue-100 text-blue-700',
  premium: 'bg-purple-100 text-purple-700'
}

export function CoachMessagesPage() {
  const [searchParams] = useSearchParams()
  const preselectedCoacheeId = searchParams.get('coachee')
  const { user } = useStore()

  const [coacheesData, setCoacheesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCoacheeId, setSelectedCoacheeId] = useState(
    preselectedCoacheeId ? preselectedCoacheeId : null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [coacheeMessages, setCoacheeMessages] = useState({})
  const [showSessionNote, setShowSessionNote] = useState(false)
  const [showSessionEndModal, setShowSessionEndModal] = useState(false)
  const [showCoacheeInfo, setShowCoacheeInfo] = useState(false) // 피코치 정보 패널
  const [showAIInsights, setShowAIInsights] = useState(false) // AI 분석 패널
  const [conversationId, setConversationId] = useState(null)
  const [showConversationList, setShowConversationList] = useState(true) // 모바일에서 대화 목록 표시 여부

  // 피코치 데이터 로드
  useEffect(() => {
    async function loadCoachees() {
      try {
        setLoading(true)
        const data = await coacheeService.getCoachCoachees(user?.id)
        const formatted = data.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          userId: c.user_id, // 피코치의 실제 user_id (메시지 전송에 필요)
          packageType: c.package_type,
          currentSession: c.current_session || 0,
          totalSessions: c.total_sessions || 5,
          nextSession: c.next_session_date ? `${c.next_session_date} ${c.next_session_time || ''}`.trim() : '-',
          hasWarning: c.has_warning || false,
          topics: c.topics || []
        }))
        setCoacheesData(formatted)
        // 첫 번째 피코치 자동 선택
        if (formatted.length > 0 && !selectedCoacheeId) {
          setSelectedCoacheeId(formatted[0].id)
        }
      } catch (err) {
        console.warn('피코치 로드 실패:', err)
        setCoacheesData([])
      } finally {
        setLoading(false)
      }
    }
    loadCoachees()
  }, [user?.id])

  const selectedCoachee = coacheesData.find(c => c.id === selectedCoacheeId)
  const messages = coacheeMessages[selectedCoacheeId] || []

  // 피코치 선택 시 대화방 생성/조회
  useEffect(() => {
    async function initConversation() {
      if (!user?.id || !selectedCoachee?.userId || !isSupabaseConfigured()) {
        setConversationId(null)
        return
      }
      try {
        const conversation = await getOrCreateConversation(user.id, selectedCoachee.userId)
        setConversationId(conversation.id)
      } catch (err) {
        console.error('대화방 생성 실패:', err)
        setConversationId(null)
      }
    }
    initConversation()
  }, [user?.id, selectedCoachee?.userId])

  const setMessages = (updater) => {
    setCoacheeMessages(prev => ({
      ...prev,
      [selectedCoacheeId]: typeof updater === 'function'
        ? updater(prev[selectedCoacheeId] || [])
        : updater
    }))
  }

  const filteredCoachees = coacheesData.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getLastMessage = (coacheeId) => {
    const msgs = coacheeMessages[coacheeId] || []
    if (msgs.length === 0) return null
    const last = msgs[msgs.length - 1]
    return {
      content: last.content?.slice(0, 30) + (last.content?.length > 30 ? '...' : ''),
      timestamp: new Date(last.timestamp).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      }),
      isOwn: last.sender === 'coach'
    }
  }

  // 회기 종료 처리
  const handleEndSession = async (endData = {}) => {
    const { isLastSession = false } = endData

    // 총 회기 수 초과 검사
    if (selectedCoachee.currentSession > selectedCoachee.totalSessions) {
      alert(`이미 모든 회기(${selectedCoachee.totalSessions}회기)가 완료되었습니다.`)
      setShowSessionEndModal(false)
      return
    }

    if (!user?.id || !selectedCoachee?.userId || !isSupabaseConfigured()) {
      // Supabase 없으면 로컬 상태만 업데이트
      setCoacheesData(prev => prev.map(c =>
        c.id === selectedCoacheeId
          ? { ...c, currentSession: c.currentSession + 1 }
          : c
      ))
      setShowSessionEndModal(false)
      return
    }

    try {
      const sessionNumber = selectedCoachee.currentSession
      const conversation = await getOrCreateConversation(user.id, selectedCoachee.userId)

      // 해당 회기의 세션을 'in_progress' 상태로 생성 (세션 일지 작성 대기)
      // 이렇게 하면 세션 일지 패널에서 이 세션을 찾아 사용함
      try {
        await getOrCreateSession(user.id, selectedCoachee.userId, sessionNumber)
        console.log(`[회기종료] ${sessionNumber}회기 세션 생성/확인 완료`)
      } catch (sessionErr) {
        console.warn('[회기종료] 세션 생성 실패:', sessionErr)
      }

      // 회기 종료 메시지 전송
      const endMessage = `🎉 ${sessionNumber}회기가 종료되었습니다!\n\n오늘 세션 수고하셨습니다.\n성찰일지를 작성하여 오늘의 코칭을 정리해보세요.`

      await sendMessage(
        conversation.id,
        user.id,
        'coach',
        endMessage,
        'normal',
        {
          type: 'session_end',
          sessionNumber: sessionNumber,
          endedAt: new Date().toISOString(),
          isLastSession: isLastSession
        }
      )

      // 피코치의 currentSession 증가 (DB 업데이트)
      await coacheeService.updateCoacheeById(selectedCoachee.id, {
        current_session: sessionNumber + 1
      })

      // 마지막 회기인 경우 사후관리 세션 예약
      if (isLastSession) {
        try {
          await scheduleFollowUpSession(user.id, selectedCoachee.userId)
          console.log('사후관리 세션 예약 완료')
        } catch (err) {
          console.error('사후관리 세션 예약 실패:', err)
          // 사후관리 세션 예약 실패는 회기 종료를 막지 않음
        }
      }

      // 로컬 상태 업데이트
      setCoacheesData(prev => prev.map(c =>
        c.id === selectedCoacheeId
          ? { ...c, currentSession: c.currentSession + 1 }
          : c
      ))

      // 메시지 새로고침
      const updatedMessages = await getMessages(conversation.id, 100)
      setMessages(updatedMessages)

      setShowSessionEndModal(false)
    } catch (err) {
      console.error('회기 종료 처리 실패:', err)
      alert('회기 종료 처리에 실패했습니다.')
    }
  }

  // 모바일에서 대화 선택 시 목록 숨기기
  const handleSelectCoachee = (coacheeId) => {
    if (coacheeId !== selectedCoacheeId) {
      setConversationId(null)
      setSelectedCoacheeId(coacheeId)
    }
    setShowConversationList(false) // 모바일에서 메시지 화면으로 전환
  }

  return (
    <div className="flex gap-2 lg:gap-4 h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] relative">
      {/* 대화 목록 - 모바일에서는 전체 화면, 데스크톱에서는 사이드바 */}
      <Card className={`
        ${showConversationList ? 'flex' : 'hidden'} lg:flex
        w-full lg:w-72 flex-shrink-0 flex-col
        absolute lg:relative inset-0 lg:inset-auto z-10 lg:z-auto
      `}>
        <div className="p-3 border-b">
          <h2 className="text-base font-bold text-gray-900 mb-2">메시지</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="피코치 검색..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredCoachees.map((coachee) => {
            const lastMsg = getLastMessage(coachee.id)
            const isSelected = coachee.id === selectedCoacheeId

            return (
              <button
                key={coachee.id}
                onClick={() => handleSelectCoachee(coachee.id)}
                className={`w-full p-3 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <div className="relative">
                  <Avatar name={coachee.name} size="sm" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-medium text-sm ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                      {coachee.name}
                    </span>
                    {lastMsg && (
                      <span className="text-xs text-gray-400">{lastMsg.timestamp}</span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 truncate">
                    {lastMsg ? (
                      <>
                        {lastMsg.isOwn && <span className="text-gray-400">나: </span>}
                        {lastMsg.content}
                      </>
                    ) : (
                      <span className="text-gray-400">대화 시작</span>
                    )}
                  </p>

                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    {coachee.packageType && PACKAGES[coachee.packageType] && (
                      <span className={`px-1.5 py-0 rounded-full text-[10px] font-medium ${packageColors[coachee.packageType]}`}>
                        {PACKAGES[coachee.packageType].icon}
                      </span>
                    )}
                    <span>
                      {Math.min(coachee.currentSession, coachee.totalSessions)}/{coachee.totalSessions}회기
                      {coachee.currentSession > coachee.totalSessions && ' ✓'}
                    </span>
                    {coachee.hasWarning && (
                      <Badge variant="warning" className="text-xs px-1 py-0 ml-1">주의</Badge>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 대화 영역 - 모바일에서는 목록이 숨겨져 있을 때만 표시 */}
      <div className={`
        ${showConversationList ? 'hidden' : 'flex'} lg:flex
        flex-1 flex-col min-w-0
      `}>
        {selectedCoachee ? (
          <>
            {/* 피코치 정보 헤더 */}
            <Card className="mb-2 lg:mb-3 flex-shrink-0">
              <CardContent className="py-2 lg:py-2.5">
                <div className="flex items-center justify-between gap-2">
                  {/* 왼쪽: 뒤로가기(모바일) + 피코치 정보 */}
                  <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                    {/* 모바일 뒤로가기 버튼 */}
                    <button
                      onClick={() => setShowConversationList(true)}
                      className="lg:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Avatar name={selectedCoachee.name} size="sm" className="flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{selectedCoachee.name}</h3>
                        {selectedCoachee.packageType && PACKAGES[selectedCoachee.packageType] && (
                          <span className={`hidden sm:inline px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${packageColors[selectedCoachee.packageType]}`}>
                            {PACKAGES[selectedCoachee.packageType].icon} {PACKAGES[selectedCoachee.packageType].name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {Math.min(selectedCoachee.currentSession, selectedCoachee.totalSessions)}/{selectedCoachee.totalSessions}회기
                        {selectedCoachee.currentSession > selectedCoachee.totalSessions && ' (완료)'}
                        <span className="hidden sm:inline">
                          {selectedCoachee.currentSession <= selectedCoachee.totalSessions && ` · 다음: ${selectedCoachee.nextSession}`}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* 오른쪽: 버튼들 - 데스크톱 */}
                  <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                    {selectedCoachee.topics?.slice(0, 2).map((topic, idx) => (
                      <Badge key={idx} variant="default" className="text-xs">{topic}</Badge>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSessionEndModal(true)}
                      disabled={selectedCoachee.currentSession > selectedCoachee.totalSessions}
                      className={selectedCoachee.currentSession > selectedCoachee.totalSessions
                        ? "text-gray-400 border-gray-200 cursor-not-allowed"
                        : "text-green-600 border-green-300 hover:bg-green-50"
                      }
                      title={selectedCoachee.currentSession > selectedCoachee.totalSessions
                        ? "모든 회기가 완료되었습니다"
                        : `${selectedCoachee.currentSession}회기 종료`
                      }
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {selectedCoachee.currentSession > selectedCoachee.totalSessions
                        ? "코칭 완료"
                        : "회기 종료"
                      }
                    </Button>
                    <Button
                      variant={showSessionNote ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setShowSessionNote(!showSessionNote)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      세션 일지
                    </Button>
                    <Button
                      variant={showCoacheeInfo ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setShowCoacheeInfo(!showCoacheeInfo)}
                    >
                      <User className="w-4 h-4 mr-1" />
                      피코치 정보
                    </Button>
                    <Button
                      variant={showAIInsights ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setShowAIInsights(!showAIInsights)}
                      className={showAIInsights ? '' : 'text-purple-600 border-purple-300 hover:bg-purple-50'}
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      AI 분석
                    </Button>
                  </div>

                  {/* 오른쪽: 버튼들 - 모바일 (아이콘만) */}
                  <div className="flex lg:hidden items-center gap-1 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSessionEndModal(true)}
                      disabled={selectedCoachee.currentSession > selectedCoachee.totalSessions}
                      className={`p-2 ${selectedCoachee.currentSession > selectedCoachee.totalSessions
                        ? "text-gray-400 border-gray-200"
                        : "text-green-600 border-green-300"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={showSessionNote ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setShowSessionNote(!showSessionNote)}
                      className="p-2"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={showCoacheeInfo ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setShowCoacheeInfo(!showCoacheeInfo)}
                      className="p-2"
                    >
                      <User className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={showAIInsights ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setShowAIInsights(!showAIInsights)}
                      className={`p-2 ${showAIInsights ? '' : 'text-purple-600 border-purple-300'}`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 메시지 + 세션일지 영역 */}
            <div className="flex-1 flex gap-2 lg:gap-3 min-h-0 relative">
              {/* 메시지 리스트 */}
              <div className="flex-1 min-w-0">
                <MessageList
                  key={selectedCoacheeId}
                  userRole="coach"
                  messages={messages}
                  setMessages={setMessages}
                  coacheeName={selectedCoachee.name}
                  coachName="플로카 코치"
                  conversationId={conversationId}
                  userId={user?.id}
                  coacheeUserId={selectedCoachee.userId}
                />
              </div>

              {/* 세션 일지 패널 - 데스크톱에서는 사이드, 모바일에서는 바텀시트 */}
              {showSessionNote && (
                <SessionNotePanel
                  coachee={selectedCoachee}
                  onClose={() => setShowSessionNote(false)}
                />
              )}

              {/* 피코치 정보 패널 - 데스크톱에서는 사이드, 모바일에서는 바텀시트 */}
              {showCoacheeInfo && (
                <CoacheeInfoPanel
                  coachee={selectedCoachee}
                  onClose={() => setShowCoacheeInfo(false)}
                />
              )}

              {/* AI 분석 패널 - 데스크톱에서는 사이드, 모바일에서는 바텀시트 */}
              {showAIInsights && (
                <AIInsightsPanel
                  coachee={selectedCoachee}
                  messages={messages}
                  onClose={() => setShowAIInsights(false)}
                />
              )}
            </div>
          </>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>피코치를 선택하여 대화를 시작하세요</p>
            </div>
          </Card>
        )}
      </div>

      {/* 회기 종료 확인 모달 */}
      {showSessionEndModal && selectedCoachee && (
        <SessionEndModal
          coachee={selectedCoachee}
          onClose={() => setShowSessionEndModal(false)}
          onConfirm={handleEndSession}
        />
      )}
    </div>
  )
}

// 세션 일지 패널 컴포넌트
function SessionNotePanel({ coachee, onClose }) {
  const { user } = useStore()
  const [note, setNote] = useState({
    coachingGoal: '',
    sessionTopic: '',
    mood: '',
    emotion: '',
    bodyResponse: '',
    taskReview: '',
    content: '',
    autoThought: '',
    avoidance: '',
    helpfulAction: '',
    achievement: '',
    desiredResult: '',
    nextTask: '',
    privateNote: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'success' | 'error' | null
  const [sessionId, setSessionId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sessionNumber, setSessionNumber] = useState(1)

  // 기존 세션일지 로드 및 회기 번호 계산
  useEffect(() => {
    async function loadSessionNote() {
      console.log('[세션일지] 로드 시작:', {
        userId: user?.id,
        coacheeUserId: coachee?.userId,
        coacheeId: coachee?.id,
        coacheeCurrentSession: coachee?.currentSession,
        supabaseConfigured: isSupabaseConfigured()
      })

      if (!user?.id || !coachee?.userId) {
        console.warn('[세션일지] userId 또는 coacheeUserId가 없음')
        setIsLoading(false)
        return
      }

      if (!isSupabaseConfigured()) {
        console.warn('[세션일지] Supabase가 설정되지 않음')
        setIsLoading(false)
        return
      }

      try {
        // 기존 세션 목록 조회
        const existingSessions = await getCoacheeSessions(user.id, coachee.userId)
        console.log('[세션일지] 기존 세션 목록:', existingSessions)

        // 진행 중인 세션이 있는지 확인 (status = 'in_progress')
        const inProgressSession = existingSessions.find(s => s.status === 'in_progress')

        let currentSession
        let currentSessionNumber

        if (inProgressSession) {
          // 진행 중인 세션이 있으면 해당 세션 사용
          console.log('[세션일지] 진행 중인 세션 발견:', inProgressSession)
          currentSession = inProgressSession
          currentSessionNumber = inProgressSession.session_number
        } else {
          // 진행 중인 세션이 없으면:
          // 1) 피코치의 currentSession이 설정되어 있으면 그 이전 회기 사용 (방금 종료한 회기)
          // 2) 아니면 완료된 세션 중 가장 높은 회기 + 1
          const completedNumbers = existingSessions
            .filter(s => s.status === 'completed')
            .map(s => s.session_number)
          const maxCompletedNumber = completedNumbers.length > 0 ? Math.max(...completedNumbers) : 0

          // coachee.currentSession이 2 이상이면 방금 종료한 회기(currentSession - 1)에 대한 일지 작성
          // 그렇지 않으면 완료된 회기 + 1
          if (coachee.currentSession > 1 && coachee.currentSession > maxCompletedNumber) {
            // 방금 종료한 회기 = currentSession - 1
            currentSessionNumber = coachee.currentSession - 1
            console.log('[세션일지] 방금 종료한 회기 사용:', currentSessionNumber)
          } else {
            currentSessionNumber = maxCompletedNumber + 1
            console.log('[세션일지] 새 세션 생성:', currentSessionNumber)
          }

          currentSession = await getOrCreateSession(user.id, coachee.userId, currentSessionNumber)
        }

        console.log('[세션일지] 현재 세션:', currentSession, '회기:', currentSessionNumber)
        setSessionNumber(currentSessionNumber)
        setSessionId(currentSession.id)

        // 기존 세션일지 로드
        console.log('[세션일지] 기존 일지 로드 시도...')
        const existingNote = await getSessionNote(currentSession.id)
        console.log('[세션일지] 기존 일지:', existingNote)
        if (existingNote) {
          setNote(existingNote)
        }
      } catch (err) {
        console.error('[세션일지] 로드 실패:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSessionNote()
  }, [user?.id, coachee?.userId])

  const handleChange = (field, value) => {
    setNote(prev => ({ ...prev, [field]: value }))
    // 변경 시 저장 상태 초기화
    if (saveStatus) setSaveStatus(null)
  }

  const handleSave = async () => {
    console.log('[세션일지] 저장 시작:', { sessionId, userId: user?.id, note })

    if (!sessionId || !user?.id) {
      console.error('[세션일지] sessionId 또는 userId가 없음:', { sessionId, userId: user?.id })
      setSaveStatus('error')
      return
    }

    setIsSaving(true)
    setSaveStatus(null)

    try {
      console.log('[세션일지] saveSessionNote 호출...')
      const result = await saveSessionNote(sessionId, user.id, note)
      console.log('[세션일지] 저장 결과:', result)
      setSaveStatus('success')

      // 3초 후 성공 메시지 숨김
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (err) {
      console.error('[세션일지] 저장 실패:', err)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  // 일지 내용 초기화
  const handleReset = () => {
    setNote({
      coachingGoal: '',
      sessionTopic: '',
      mood: '',
      emotion: '',
      bodyResponse: '',
      taskReview: '',
      content: '',
      autoThought: '',
      avoidance: '',
      helpfulAction: '',
      achievement: '',
      desiredResult: '',
      nextTask: '',
      privateNote: '',
    })
    setSaveStatus(null)
  }

  // 세션 및 일지 삭제
  const handleDelete = async () => {
    if (!sessionId) return

    setIsDeleting(true)
    try {
      await deleteSession(sessionId)
      setShowDeleteConfirm(false)
      setSessionId(null)
      handleReset()
      onClose()
    } catch (err) {
      console.error('[세션일지] 삭제 실패:', err)
      setSaveStatus('error')
    } finally {
      setIsDeleting(false)
    }
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <>
        {/* 모바일 오버레이 */}
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
        <Card className={`
          w-full lg:w-[420px] flex-shrink-0 flex flex-col overflow-hidden
          fixed lg:relative inset-x-0 bottom-0 lg:inset-auto
          z-50 lg:z-auto rounded-t-2xl lg:rounded-xl
          max-h-[85vh] lg:max-h-full
        `}>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600 text-sm">세션일지를 불러오는 중...</span>
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      {/* 모바일 오버레이 */}
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      <Card className={`
        w-full lg:w-[420px] flex-shrink-0 flex flex-col overflow-hidden
        fixed lg:relative inset-x-0 bottom-0 lg:inset-auto
        z-50 lg:z-auto rounded-t-2xl lg:rounded-xl
        max-h-[85vh] lg:max-h-full
      `}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-3 border-b bg-blue-50 rounded-t-2xl lg:rounded-t-xl">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900 text-sm">{sessionNumber}회기 세션 일지</h3>
              <p className="text-xs text-blue-600">{coachee.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-blue-100 rounded-lg">
            <X className="w-5 h-5 text-blue-600" />
          </button>
        </div>

      {/* 내용 - 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 기본 정보 */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">코칭 목표</label>
            <input
              type="text"
              value={note.coachingGoal}
              onChange={(e) => handleChange('coachingGoal', e.target.value)}
              placeholder="이번 코칭 전체의 목표"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">회기 주제</label>
            <input
              type="text"
              value={note.sessionTopic}
              onChange={(e) => handleChange('sessionTopic', e.target.value)}
              placeholder="오늘 다룬 주제"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 오늘의 컨디션 */}
        <div className="p-3 bg-gray-50 rounded-lg space-y-3">
          <h4 className="font-medium text-gray-700 text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            오늘의 컨디션
          </h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">기분</label>
              <select
                value={note.mood}
                onChange={(e) => handleChange('mood', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                <option value="good">좋음</option>
                <option value="normal">보통</option>
                <option value="difficult">어려움</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">주요 감정</label>
              <input
                type="text"
                value={note.emotion}
                onChange={(e) => handleChange('emotion', e.target.value)}
                placeholder="불안, 피로, 무기력..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">신체 반응</label>
              <input
                type="text"
                value={note.bodyResponse}
                onChange={(e) => handleChange('bodyResponse', e.target.value)}
                placeholder="두통, 피로감..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 과제 점검 */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-green-500" />
            과제 점검
          </label>
          <textarea
            value={note.taskReview}
            onChange={(e) => handleChange('taskReview', e.target.value)}
            placeholder="지난 회기 과제 수행 여부와 결과"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* 상담 내용 */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            상담 내용
          </label>
          <textarea
            value={note.content}
            onChange={(e) => handleChange('content', e.target.value)}
            placeholder="오늘 상담에서 다룬 핵심 내용"
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* 자동사고 & 회피 행동 */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">자동사고</label>
            <textarea
              value={note.autoThought}
              onChange={(e) => handleChange('autoThought', e.target.value)}
              placeholder="피코치에게서 관찰된 자동적 사고"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">회피 행동</label>
            <textarea
              value={note.avoidance}
              onChange={(e) => handleChange('avoidance', e.target.value)}
              placeholder="관찰된 회피 행동 패턴"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* 도움이 된 행동 */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            도움이 된 행동
          </label>
          <textarea
            value={note.helpfulAction}
            onChange={(e) => handleChange('helpfulAction', e.target.value)}
            placeholder="피코치에게 효과적이었던 전략이나 행동"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* 코칭 성과 & 바람직한 결과 */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">코칭 성과</label>
            <textarea
              value={note.achievement}
              onChange={(e) => handleChange('achievement', e.target.value)}
              placeholder="이번 회기에서 얻은 성과"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">바람직한 결과</label>
            <textarea
              value={note.desiredResult}
              onChange={(e) => handleChange('desiredResult', e.target.value)}
              placeholder="앞으로 기대하는 변화"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* 다음 실행 과제 */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-blue-500" />
            다음 실행 과제
          </label>
          <textarea
            value={note.nextTask}
            onChange={(e) => handleChange('nextTask', e.target.value)}
            placeholder="다음 회기까지 수행할 과제"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* 코치 개인 메모 (비공개) */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            코치 개인 메모 (비공개)
          </label>
          <textarea
            value={note.privateNote}
            onChange={(e) => handleChange('privateNote', e.target.value)}
            placeholder="피코치에게 공개되지 않는 개인 메모, 슈퍼비전 요청 사항 등"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-yellow-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
          />
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="p-3 border-t bg-gray-50 space-y-2">
        {/* 저장 상태 피드백 */}
        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            세션일지가 저장되었습니다.
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            저장에 실패했습니다. 다시 시도해주세요.
          </div>
        )}

        {/* 삭제 확인 */}
        {showDeleteConfirm && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium mb-2">정말 삭제하시겠습니까?</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                취소
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 border-red-300 hover:bg-red-100"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving || isDeleting}
            title="내용 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 border-red-200 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving || isDeleting || !sessionId}
            title="세션 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button size="sm" className="flex-1" onClick={handleSave} disabled={isSaving || isDeleting}>
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                저장
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
    </>
  )
}

// 회기 종료 확인 모달 (간소화)
function SessionEndModal({ coachee, onClose, onConfirm }) {
  const currentSession = coachee.currentSession
  const totalSessions = coachee.totalSessions
  const isLastSession = currentSession >= totalSessions
  const isCompleted = currentSession > totalSessions

  // 종료 처리
  const handleConfirm = () => {
    onConfirm({ isLastSession })
  }

  // 이미 모든 회기가 완료된 경우
  if (isCompleted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
              코칭이 완료되었습니다
            </h2>
            <p className="text-center text-gray-500 mb-4">
              {coachee.name}님의 {totalSessions}회기 코칭이 모두 완료되었습니다.
            </p>
          </div>
          <div className="flex border-t border-gray-100">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-blue-600 font-medium hover:bg-blue-50 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {currentSession}회기 종료
              </h2>
              <p className="text-sm text-gray-500">
                {coachee.name}님 · {currentSession}/{totalSessions}회기
              </p>
            </div>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              회기를 종료할까요?
            </h3>
            <p className="text-gray-500 text-sm">
              세션 일지를 먼저 작성해주세요.
            </p>
          </div>

          {/* 진행률 */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-blue-700">진행률</span>
              <span className="font-semibold text-blue-900">
                {currentSession} / {totalSessions} 회기
              </span>
            </div>
            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(currentSession / totalSessions) * 100}%` }}
              />
            </div>
            {isLastSession && (
              <p className="mt-2 text-xs text-amber-600 text-center">
                마지막 회기입니다. 종료 후 결과보고서를 작성할 수 있습니다.
              </p>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              종료하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 접을 수 있는 섹션 컴포넌트
function CollapsibleSection({ title, icon: Icon, color, expanded, onToggle, children }) {
  const colorClasses = {
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600' },
    green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-600' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', icon: 'text-pink-600' },
  }

  const colors = colorClasses[color] || colorClasses.blue

  return (
    <div className={`border rounded-lg overflow-hidden ${expanded ? colors.border : 'border-gray-200'}`}>
      <button
        onClick={onToggle}
        className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors ${
          expanded ? colors.bg : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors.icon}`} />
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  )
}

// 피코치 정보 패널 컴포넌트
function CoacheeInfoPanel({ coachee, onClose }) {
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    intro: true,
    asrs: true,
    topics: true,
    goal: true,
    survey: true
  })

  // 피코치 상세 정보 로드
  useEffect(() => {
    async function loadDetail() {
      if (!coachee?.id || !isSupabaseConfigured()) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const data = await coacheeService.getCoacheeDetail(coachee.id)
        console.log('=== 피코치 정보 패널 데이터 ===')
        console.log('topics:', data.topics)
        console.log('pre_survey:', data.pre_survey)
        console.log('전체 데이터:', data)

        // topics가 비어있으면 확정된 목표 합의서에서 동기화 시도
        if ((!data.topics || data.topics.length === 0) && data.user_id) {
          console.log('=== 코칭 주제 자동 동기화 시도 ===')
          try {
            const confirmedGoals = await getConfirmedGoals(data.user_id)
            console.log('확정된 목표 합의서:', confirmedGoals)

            if (confirmedGoals && confirmedGoals.length > 0) {
              // 가장 최근 확정된 목표 사용
              const latestGoal = confirmedGoals[0]
              if (latestGoal.goals && latestGoal.goals.length > 0) {
                console.log('목표에서 코칭 주제 동기화:', latestGoal.goals)
                await saveCoachingTopicsFromGoal(data.user_id, latestGoal.goals)

                // 데이터 다시 로드
                const refreshedData = await coacheeService.getCoacheeDetail(coachee.id)
                setDetail(refreshedData)
                console.log('코칭 주제 동기화 완료! 새 topics:', refreshedData.topics)
                return
              }
            }
          } catch (syncErr) {
            console.error('코칭 주제 동기화 실패:', syncErr)
          }
        }

        setDetail(data)
      } catch (err) {
        console.error('피코치 정보 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDetail()
  }, [coachee?.id])

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // ASRS 레벨 색상
  const getAsrsLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-green-600 bg-green-100'
    }
  }

  const getAsrsLevelText = (level) => {
    switch (level) {
      case 'high': return '고위험'
      case 'medium': return '중간'
      default: return '저위험'
    }
  }

  return (
    <>
      {/* 모바일 오버레이 */}
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      <Card className={`
        w-full lg:w-80 flex-shrink-0 flex flex-col
        fixed lg:relative inset-x-0 bottom-0 lg:inset-auto
        z-50 lg:z-auto rounded-t-2xl lg:rounded-xl
        max-h-[85vh] lg:max-h-full
      `}>
        {/* 헤더 */}
        <div className="p-3 border-b flex items-center justify-between bg-gray-50 rounded-t-2xl lg:rounded-t-xl">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-sm text-gray-900">피코치 정보</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* 내용 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-500">불러오는 중...</span>
          </div>
        ) : !detail ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            정보를 불러올 수 없습니다.
          </div>
        ) : (
          <>
            {/* 자기소개 */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('intro')}
                className={`w-full px-3 py-2 flex items-center justify-between text-left ${
                  expandedSections.intro ? 'bg-purple-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm text-gray-800">자기소개</span>
                </div>
                {expandedSections.intro ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.intro && detail.self_intro && (
                <div className="px-3 py-2 space-y-2 text-xs">
                  {detail.self_intro.intro && (
                    <div>
                      <p className="text-gray-500 mb-0.5">나를 소개하면</p>
                      <p className="text-gray-700">{detail.self_intro.intro}</p>
                    </div>
                  )}
                  {detail.self_intro.expectation && (
                    <div>
                      <p className="text-gray-500 mb-0.5">코칭에서 기대하는 것</p>
                      <p className="text-gray-700">{detail.self_intro.expectation}</p>
                    </div>
                  )}
                  {detail.self_intro.concern && (
                    <div>
                      <p className="text-gray-500 mb-0.5">걱정되는 점</p>
                      <p className="text-gray-700">{detail.self_intro.concern}</p>
                    </div>
                  )}
                  {detail.self_intro.communicationStyles?.length > 0 && (
                    <div>
                      <p className="text-gray-500 mb-0.5">선호 소통 방식</p>
                      <div className="flex flex-wrap gap-1">
                        {detail.self_intro.communicationStyles.map((style, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ASRS 분석 결과 */}
            {detail.asrs_result && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('asrs')}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left ${
                    expandedSections.asrs ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm text-gray-800">ADHD 분석결과</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getAsrsLevelColor(detail.asrs_result.level)}`}>
                      {getAsrsLevelText(detail.asrs_result.level)}
                    </span>
                  </div>
                  {expandedSections.asrs ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedSections.asrs && (
                  <div className="px-3 py-2 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">총점</span>
                      <span className="font-semibold text-gray-800">
                        {detail.asrs_result.totalScore} / {detail.asrs_result.maxScore || 72}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-[10px] text-gray-500">주의력결핍</p>
                        <p className="font-semibold text-blue-600">{detail.asrs_result.inattentionScore || '-'}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-[10px] text-gray-500">과잉행동</p>
                        <p className="font-semibold text-orange-600">{detail.asrs_result.hyperactivityScore || '-'}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-[10px] text-gray-500">충동성</p>
                        <p className="font-semibold text-red-600">{detail.asrs_result.impulsivityScore || '-'}</p>
                      </div>
                    </div>
                    {detail.asrs_result.interpretation && (
                      <p className="text-gray-600 bg-blue-50 p-2 rounded">
                        {detail.asrs_result.interpretation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 코칭 주제 점수 */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('topics')}
                className={`w-full px-3 py-2 flex items-center justify-between text-left ${
                  expandedSections.topics ? 'bg-teal-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-600" />
                  <span className="font-medium text-sm text-gray-800">영역별 점수</span>
                </div>
                {expandedSections.topics ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.topics && (
                <div className="px-3 py-2 space-y-2">
                  {detail.topics?.length > 0 ? (
                    detail.topics.map((topic, idx) => {
                      const progress = topic.target_score
                        ? Math.round((topic.current_score / topic.target_score) * 100)
                        : 0
                      const growth = (topic.current_score || 0) - (topic.start_score || 0)
                      return (
                        <div key={idx} className="text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-700 font-medium">{topic.title}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">{topic.current_score || 0}/{topic.target_score || 10}</span>
                              {growth !== 0 && (
                                <span className={`flex items-center ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {growth > 0 ? '+' : ''}{growth}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-teal-500'}`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">설정된 코칭 주제가 없습니다.</p>
                  )}
                </div>
              )}
            </div>

            {/* 현재 코칭 목표 */}
            {detail.coaching_goal && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('goal')}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left ${
                    expandedSections.goal ? 'bg-amber-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-sm text-gray-800">코칭 목표</span>
                  </div>
                  {expandedSections.goal ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedSections.goal && (
                  <div className="px-3 py-2 space-y-2 text-xs">
                    <p className="font-medium text-gray-800">{detail.coaching_goal.title}</p>
                    {detail.coaching_goal.description && (
                      <p className="text-gray-600">{detail.coaching_goal.description}</p>
                    )}
                    <div className="flex items-center justify-between text-gray-500">
                      <span>현재 점수</span>
                      <span className="font-semibold text-amber-600">
                        {detail.coaching_goal.currentScore || 0} / {detail.coaching_goal.targetScore || 10}
                      </span>
                    </div>
                    {detail.coaching_goal.currentAction && (
                      <div className="p-2 bg-amber-50 rounded">
                        <p className="text-[10px] text-amber-600 mb-0.5">현재 실행 중인 행동</p>
                        <p className="text-gray-700">{detail.coaching_goal.currentAction}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 사전 설문 결과 (카테고리 점수) */}
            {detail.pre_survey?.categoryScores && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('survey')}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left ${
                    expandedSections.survey ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-sm text-gray-800">실행기능 진단</span>
                  </div>
                  {expandedSections.survey ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedSections.survey && (
                  <div className="px-3 py-2 space-y-1.5">
                    {Object.entries(detail.pre_survey.categoryScores)
                      .filter(([key]) => key !== 'total')
                      .map(([category, scoreData], idx) => {
                        // scoreData가 객체면 average 사용, 숫자면 그대로 사용
                        const score = typeof scoreData === 'object' ? scoreData.average : scoreData
                        const label = COACHING_AREAS[category]?.name || category
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${Math.min(((score || 0) / 5) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-gray-700 font-medium w-8 text-right">{(score || 0).toFixed(1)}</span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
    </>
  )
}
