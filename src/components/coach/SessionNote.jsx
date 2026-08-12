import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { Textarea, Input, Select } from '../common/Input'
import { Badge } from '../common/Badge'
import { Avatar } from '../common/Avatar'
import { useStore } from '../../store/useStore'
import { getOrCreateSession, saveSessionNote, getSessionNote, deleteSessionNote, deleteSession } from '../../lib/sessionService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { getOrCreateConversation, getMessages } from '../../lib/messageService'
import { getSessionNoteAssist, isAIConfigured } from '../../lib/aiService'
import {
  FileText, Target, CheckSquare, Brain, Heart,
  AlertTriangle, Lightbulb, Rocket, Save, Sparkles, CheckCircle, AlertCircle, Loader2, Trash2, RotateCcw
} from 'lucide-react'

export function SessionNote({ coachee, sessionNumber = 1, session, onDelete, onBack }) {
  const { user } = useStore()
  const [note, setNote] = useState({
    coachingGoal: '',
    sessionTopic: '',
    taskReview: '',
    content: '',
    achievement: '',
    desiredResult: '',
    nextTask: '',
    privateNote: '',
    mood: '',
    emotion: '',
    bodyResponse: '',
    autoThought: '',
    avoidance: '',
    helpfulAction: '',
  })
  const [sessionId, setSessionId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'success' | 'error' | null
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isAIGenerating, setIsAIGenerating] = useState(false)

  // 세션 및 기존 일지 로드
  useEffect(() => {
    async function loadSessionNote() {
      const coacheeUserId = coachee?.userId || session?.coacheeUserId

      if (!user?.id || !coacheeUserId || !isSupabaseConfigured()) {
        setIsLoading(false)
        return
      }

      try {
        // 세션 조회 또는 생성
        const sessionData = await getOrCreateSession(user.id, coacheeUserId, sessionNumber)
        setSessionId(sessionData.id)

        // 기존 세션일지 로드
        const existingNote = await getSessionNote(sessionData.id)
        if (existingNote) {
          setNote(prev => ({ ...prev, ...existingNote }))
        }
      } catch (err) {
        console.error('세션일지 로드 실패:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSessionNote()
  }, [user?.id, coachee?.userId, session?.coacheeUserId, sessionNumber])

  const handleChange = (field, value) => {
    setNote(prev => ({ ...prev, [field]: value }))
    if (saveStatus) setSaveStatus(null)
  }

  const handleSave = async () => {
    if (!sessionId || !user?.id) {
      setSaveStatus('error')
      return
    }

    setIsSaving(true)
    setSaveStatus(null)

    try {
      await saveSessionNote(sessionId, user.id, note)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (err) {
      console.error('세션일지 저장 실패:', err)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  // 일지 내용만 초기화
  const handleReset = () => {
    setNote({
      coachingGoal: '',
      sessionTopic: '',
      taskReview: '',
      content: '',
      achievement: '',
      desiredResult: '',
      nextTask: '',
      privateNote: '',
      mood: '',
      emotion: '',
      bodyResponse: '',
      autoThought: '',
      avoidance: '',
      helpfulAction: '',
    })
    setSaveStatus(null)
  }

  // AI 자동작성
  const handleAIAssist = async () => {
    const coacheeUserId = coachee?.userId || session?.coacheeUserId
    if (!user?.id || !coacheeUserId || !isAIConfigured()) return

    setIsAIGenerating(true)
    try {
      // 대화방 조회
      const conversation = await getOrCreateConversation(user.id, coacheeUserId)
      if (!conversation?.id) {
        console.warn('대화방을 찾을 수 없습니다')
        setIsAIGenerating(false)
        return
      }

      // 메시지 로드
      const messages = await getMessages(conversation.id, 100)
      if (!messages || messages.length === 0) {
        console.warn('분석할 채팅 기록이 없습니다')
        setIsAIGenerating(false)
        return
      }

      // AI 분석 요청
      const coacheeInfo = {
        name: coachee?.name || '피코치',
        coachingGoal: coachee?.coachingGoal?.goal || '',
        topics: coachee?.topics || []
      }

      const result = await getSessionNoteAssist(messages, coacheeInfo, sessionNumber)

      if (result) {
        setNote(prev => ({
          ...prev,
          coachingGoal: result.coachingGoal || prev.coachingGoal,
          sessionTopic: result.sessionTopic || prev.sessionTopic,
          mood: result.mood || prev.mood,
          emotion: result.emotion || prev.emotion,
          bodyResponse: result.bodyResponse || prev.bodyResponse,
          content: result.content || prev.content,
          autoThought: result.autoThought || prev.autoThought,
          avoidance: result.avoidance || prev.avoidance,
          helpfulAction: result.helpfulAction || prev.helpfulAction,
          achievement: result.achievement || prev.achievement,
          desiredResult: result.desiredResult || prev.desiredResult,
          nextTask: result.nextTask || prev.nextTask,
          taskReview: result.taskReview || prev.taskReview,
        }))
      }
    } catch (err) {
      console.error('AI 분석 실패:', err)
    } finally {
      setIsAIGenerating(false)
    }
  }

  // 세션 및 일지 삭제
  const handleDelete = async () => {
    if (!sessionId) return

    setIsDeleting(true)
    try {
      await deleteSession(sessionId)
      setShowDeleteConfirm(false)
      if (onDelete) onDelete()
      if (onBack) onBack()
    } catch (err) {
      console.error('세션 삭제 실패:', err)
      setSaveStatus('error')
    } finally {
      setIsDeleting(false)
    }
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="ml-2 text-gray-600">세션일지를 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* 모바일: 피코치 정보 (접이식) */}
      <div className="lg:hidden space-y-3">
        <details className="group">
          <summary className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer list-none">
            <div className="flex items-center gap-3">
              <Avatar name={coachee?.name || '피코치'} size="sm" />
              <span className="font-medium text-gray-900">{coachee?.name || '피코치'}</span>
            </div>
            <span className="text-xs text-gray-500 group-open:hidden">정보 보기</span>
            <span className="text-xs text-gray-500 hidden group-open:inline">접기</span>
          </summary>
          <div className="mt-2 space-y-3">
            <CoacheeInfoCard coachee={coachee} />
            <AIAssistCard />
          </div>
        </details>
      </div>

      {/* 데스크톱: 왼쪽 사이드바 */}
      <div className="hidden lg:block space-y-4">
        <CoacheeInfoCard coachee={coachee} />
        <RecentRecordsCard />
        <AIAssistCard />
      </div>

      {/* 세션 노트 */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              {sessionNumber}회기 세션 일지
            </CardTitle>
            <div className="flex items-center gap-2">
              {isAIConfigured() && (
                <button
                  onClick={handleAIAssist}
                  disabled={isAIGenerating}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    isAIGenerating
                      ? 'bg-purple-100 text-purple-400'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-sm'
                  }`}
                >
                  {isAIGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="hidden sm:inline">채팅 분석 중...</span>
                      <span className="sm:hidden">분석 중</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">AI 자동작성</span>
                      <span className="sm:hidden">AI</span>
                    </>
                  )}
                </button>
              )}
              <Badge variant="primary" className="hidden sm:inline-flex">작성 중</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label="코칭 목표"
                value={note.coachingGoal}
                onChange={(e) => handleChange('coachingGoal', e.target.value)}
                placeholder="이번 코칭 전체의 목표"
              />
              <Input
                label="회기 주제"
                value={note.sessionTopic}
                onChange={(e) => handleChange('sessionTopic', e.target.value)}
                placeholder="오늘 다룬 주제"
              />
            </div>

            {/* 컨디션 체크 */}
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-4">
              <h4 className="font-medium text-gray-700 flex items-center gap-2 text-sm sm:text-base">
                <Heart className="w-4 h-4 text-pink-500" />
                오늘의 컨디션
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Select
                  label="기분"
                  value={note.mood}
                  onChange={(e) => handleChange('mood', e.target.value)}
                  options={[
                    { value: '', label: '선택하세요' },
                    { value: 'good', label: '좋음' },
                    { value: 'normal', label: '보통' },
                    { value: 'difficult', label: '어려움' },
                  ]}
                />
                <Input
                  label="주요 감정"
                  value={note.emotion}
                  onChange={(e) => handleChange('emotion', e.target.value)}
                  placeholder="불안, 피로, 무기력..."
                />
                <Input
                  label="신체 반응"
                  value={note.bodyResponse}
                  onChange={(e) => handleChange('bodyResponse', e.target.value)}
                  placeholder="두통, 피로감..."
                />
              </div>
            </div>

            {/* 과제 점검 */}
            <Textarea
              label={
                <span className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-green-500" />
                  과제 점검
                </span>
              }
              value={note.taskReview}
              onChange={(e) => handleChange('taskReview', e.target.value)}
              placeholder="지난 회기 과제 수행 여부와 결과"
              rows={3}
            />

            {/* 상담 내용 */}
            <Textarea
              label={
                <span className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  상담 내용
                </span>
              }
              value={note.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="오늘 상담에서 다룬 핵심 내용"
              rows={5}
            />

            {/* 자동사고 & 회피 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Textarea
                label="자동사고"
                value={note.autoThought}
                onChange={(e) => handleChange('autoThought', e.target.value)}
                placeholder="피코치에게서 관찰된 자동적 사고"
                rows={3}
              />
              <Textarea
                label="회피 행동"
                value={note.avoidance}
                onChange={(e) => handleChange('avoidance', e.target.value)}
                placeholder="관찰된 회피 행동 패턴"
                rows={3}
              />
            </div>

            {/* 도움이 된 행동 */}
            <Textarea
              label={
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  도움이 된 행동
                </span>
              }
              value={note.helpfulAction}
              onChange={(e) => handleChange('helpfulAction', e.target.value)}
              placeholder="피코치에게 효과적이었던 전략이나 행동"
              rows={2}
            />

            {/* 코칭 성과 & 바람직한 결과 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Textarea
                label="코칭 성과"
                value={note.achievement}
                onChange={(e) => handleChange('achievement', e.target.value)}
                placeholder="이번 회기에서 얻은 성과"
                rows={3}
              />
              <Textarea
                label="바람직한 결과"
                value={note.desiredResult}
                onChange={(e) => handleChange('desiredResult', e.target.value)}
                placeholder="앞으로 기대하는 변화"
                rows={3}
              />
            </div>

            {/* 다음 실행 과제 */}
            <Textarea
              label={
                <span className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-emerald-500" />
                  다음 실행 과제
                </span>
              }
              value={note.nextTask}
              onChange={(e) => handleChange('nextTask', e.target.value)}
              placeholder="다음 회기까지 수행할 과제"
              rows={3}
            />

            {/* 코치 개인 메모 (비공개) */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Textarea
                label={
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    코치 개인 메모 (비공개)
                  </span>
                }
                value={note.privateNote}
                onChange={(e) => handleChange('privateNote', e.target.value)}
                placeholder="피코치에게 공개되지 않는 개인 메모, 슈퍼비전 요청 사항 등"
                rows={3}
              />
            </div>

            {/* 저장 상태 피드백 */}
            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <CheckCircle className="w-5 h-5" />
                세션일지가 저장되었습니다.
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5" />
                저장에 실패했습니다. 다시 시도해주세요.
              </div>
            )}

            {/* 삭제 확인 모달 */}
            {showDeleteConfirm && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium mb-3">
                  정말 이 세션일지를 삭제하시겠습니까?
                </p>
                <p className="text-red-600 text-sm mb-4">
                  삭제된 데이터는 복구할 수 없습니다.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    취소
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-100"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        삭제 중...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-1" />
                        삭제
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* 버튼 영역 */}
            <div className="flex flex-wrap gap-2 sm:gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="text-gray-500"
                onClick={handleReset}
                disabled={isSaving || isDeleting}
              >
                <RotateCcw className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">초기화</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving || isDeleting || !sessionId}
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">삭제</span>
              </Button>
              <Button onClick={handleSave} size="sm" className="flex-1 min-w-[100px]" disabled={isSaving || isDeleting}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                    <span className="hidden sm:inline">저장 중...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 sm:mr-2" />
                    <span>저장</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CoacheeInfoCard({ coachee }) {
  const name = coachee?.name || '피코치'
  const currentSession = coachee?.currentSession || 1
  const totalSessions = coachee?.totalSessions || 6
  const topics = coachee?.topics || []
  const recentScore = coachee?.recentScore || 0
  const targetScore = coachee?.targetScore || 0

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={name} size="lg" />
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{currentSession}/{totalSessions} 회기 진행 중</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">코칭 주제</p>
            <div className="flex flex-wrap gap-1">
              {topics.length > 0 ? (
                topics.map((topic, idx) => (
                  <Badge key={idx}>{topic}</Badge>
                ))
              ) : (
                <span className="text-sm text-gray-400">주제 없음</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold text-gray-900">{recentScore}</p>
              <p className="text-xs text-gray-500">현재 점수</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <p className="text-lg font-semibold text-emerald-600">{targetScore}</p>
              <p className="text-xs text-emerald-500">목표 점수</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentRecordsCard({ coachee }) {
  // 실제 데이터가 있으면 사용, 없으면 기본값
  const lastCheckin = coachee?.lastCheckin || '-'
  const weeklyStarts = coachee?.weeklyStarts ?? '-'
  const returnCount = coachee?.returnCount ?? '-'

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">최근 기록</CardTitle>
      </CardHeader>
      <CardContent className="py-2 space-y-2">
        <div className="text-sm">
          <p className="text-gray-500">마지막 체크인</p>
          <p className="text-gray-900">{lastCheckin}</p>
        </div>
        <div className="text-sm">
          <p className="text-gray-500">이번 주 시작 횟수</p>
          <p className="text-gray-900">{weeklyStarts}회</p>
        </div>
        <div className="text-sm">
          <p className="text-gray-500">복귀 횟수</p>
          <p className="text-gray-900">{returnCount}회</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AIAssistCard() {
  return (
    <Card className="border-emerald-200 bg-emerald-50">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          AI 코칭 보조
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 space-y-3 text-sm">
        <div>
          <p className="font-medium text-blue-800 mb-1">확인해 볼 가능성</p>
          <p className="text-emerald-700">
            시작 전 부담감보다 휴대폰의 즉각적인 사회적 보상이 더 강하게 작용할 수 있습니다.
          </p>
        </div>
        <div>
          <p className="font-medium text-blue-800 mb-1">추가 질문 제안</p>
          <p className="text-emerald-700">
            "휴대폰을 보기 직전 어떤 기분이나 생각이 있었나요?"
          </p>
        </div>
        <Button variant="outline" size="sm" className="w-full">
          더 많은 제안 보기
        </Button>
      </CardContent>
    </Card>
  )
}
