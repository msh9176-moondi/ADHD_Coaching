/**
 * 태스크 실행 준비 모달
 * ADHD 대처기술에 기반한 실행 도우미
 * - AI가 가장 작은 첫 단계 제안 (수정 가능)
 * - AI가 각 항목 예시 제공
 * - 사용자가 직접 작성하며 자기 인식
 */

import { useState, useEffect } from 'react'
import { Button } from '../common/Button'
import { generateTaskExamples } from '../../lib/taskClassificationService'
import {
  X, Sparkles, Loader2, Edit3, Check, Timer,
  Lightbulb, Heart, Target, AlertCircle, Play, Pause
} from 'lucide-react'

export function TaskExecutionModal({ task, onClose, onComplete }) {
  const [loading, setLoading] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [isEditingFirstStep, setIsEditingFirstStep] = useState(false)

  // 사용자 입력 상태
  const [firstStep, setFirstStep] = useState('')
  const [negativeFeeling, setNegativeFeeling] = useState('')
  const [positiveOutcome, setPositiveOutcome] = useState('')
  const [ifThenPlan, setIfThenPlan] = useState({ if: '', then: '' })
  const [discomfortScore, setDiscomfortScore] = useState(50)

  // 타이머 상태
  const [timerActive, setTimerActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10 * 60) // 10분

  // AI 예시 로드
  useEffect(() => {
    loadAISuggestions()
  }, [task])

  const loadAISuggestions = async () => {
    setLoading(true)
    try {
      const suggestions = await generateTaskExamples(task.text)
      setAiSuggestions(suggestions)
      setFirstStep(suggestions.firstStep)
    } catch (err) {
      console.error('AI 예시 생성 실패:', err)
      // 폴백 예시
      setAiSuggestions({
        firstStep: '이 일을 시작하기 위한 가장 작은 행동 정하기',
        negativeExample: '하기 싫음, 귀찮음, 막막함',
        positiveExample: '완료하면 뿌듯할 거야, 스트레스가 줄어들 거야',
        ifThenExample: { if: '방해가 생기면', then: '5분만 쉬고 다시 시작할 거야' }
      })
      setFirstStep('이 일을 시작하기 위한 가장 작은 행동 정하기')
    } finally {
      setLoading(false)
    }
  }

  // 타이머 로직
  useEffect(() => {
    let interval
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setTimerActive(false)
      // 타이머 완료 알림
      if (Notification.permission === 'granted') {
        new Notification('10분 타이머 완료!', {
          body: '잘했어요! 계속할지 잠시 쉴지 결정해주세요.'
        })
      }
    }
    return () => clearInterval(interval)
  }, [timerActive, timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDiscomfortMessage = (score) => {
    if (score <= 20) return '😊 아주 가벼운 불편함이에요. 바로 시작해볼까요?'
    if (score <= 40) return '🙂 충분히 견딜 수 있어요! 시작하면 기분이 나아질 거예요.'
    if (score <= 60) return '😐 조금 불편하지만, 10분만 해보면 달라질 거예요.'
    if (score <= 80) return '😣 많이 힘들죠. 가장 작은 단계부터 천천히 시작해봐요.'
    return '😰 정말 힘든 상황이네요. 1분만이라도 시작해보는 건 어떨까요?'
  }

  const handleStartTimer = () => {
    // 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
    setTimerActive(true)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-3" />
          <p className="text-gray-600">AI가 도움말을 준비하고 있어요...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg my-4">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-600" />
            <h2 className="font-semibold text-gray-900">실행 준비</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 태스크 이름 */}
        <div className="p-4 bg-violet-50 border-b border-violet-100">
          <p className="text-lg font-medium text-violet-900">{task.text}</p>
        </div>

        {/* 입력 폼 */}
        <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* 1. 가장 작은 첫 단계 (AI 제안, 수정 가능) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className="w-5 h-5 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              가장 작은 첫 단계
            </label>
            <div className="relative">
              {isEditingFirstStep ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={firstStep}
                    onChange={(e) => setFirstStep(e.target.value)}
                    className="flex-1 p-3 border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsEditingFirstStep(false)}
                    className="p-3 bg-violet-100 text-violet-600 rounded-lg hover:bg-violet-200"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                  <Sparkles className="w-4 h-4 text-violet-500 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-800">{firstStep}</span>
                  <button
                    onClick={() => setIsEditingFirstStep(true)}
                    className="p-1.5 hover:bg-violet-100 rounded-lg"
                    title="수정하기"
                  >
                    <Edit3 className="w-4 h-4 text-violet-500" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. 미루게 만드는 감정 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              이 일을 미루게 만드는 감정은?
            </label>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>예시: {aiSuggestions?.negativeExample}</span>
            </div>
            <textarea
              value={negativeFeeling}
              onChange={(e) => setNegativeFeeling(e.target.value)}
              placeholder="어떤 감정이 이 일을 시작하기 어렵게 만드나요?"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none h-20"
            />
          </div>

          {/* 3. 완수 시 좋은 점 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              완수하면 어떤 좋은 점이 있을까?
            </label>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>예시: {aiSuggestions?.positiveExample}</span>
            </div>
            <textarea
              value={positiveOutcome}
              onChange={(e) => setPositiveOutcome(e.target.value)}
              placeholder="이 일을 끝내면 어떤 기분이 들까요? 어떤 이득이 있을까요?"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none h-20"
            />
          </div>

          {/* 4. 만약-그렇다면 계획 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              만약-그렇다면 계획
            </label>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>예시: 만약 {aiSuggestions?.ifThenExample?.if}, {aiSuggestions?.ifThenExample?.then}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-12">만약</span>
                <input
                  type="text"
                  value={ifThenPlan.if}
                  onChange={(e) => setIfThenPlan(prev => ({ ...prev, if: e.target.value }))}
                  placeholder="방해가 생기면..."
                  className="flex-1 p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-12">그러면</span>
                <input
                  type="text"
                  value={ifThenPlan.then}
                  onChange={(e) => setIfThenPlan(prev => ({ ...prev, then: e.target.value }))}
                  placeholder="나는 ~할 것이다"
                  className="flex-1 p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* 5. 불편함 점수 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className="w-5 h-5 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">5</span>
              불편함 점수 (0~100)
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={discomfortScore}
                onChange={(e) => setDiscomfortScore(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>편안함</span>
                <span className="font-medium text-rose-600">{discomfortScore}점</span>
                <span>매우 불편</span>
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {getDiscomfortMessage(discomfortScore)}
              </p>
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          {/* 타이머 */}
          {timerActive ? (
            <div className="flex items-center justify-center gap-4 p-4 bg-violet-50 rounded-xl">
              <div className="text-center">
                <p className="text-3xl font-bold text-violet-600">{formatTime(timeLeft)}</p>
                <p className="text-xs text-gray-500">10분 타이머</p>
              </div>
              <button
                onClick={() => setTimerActive(false)}
                className="p-3 bg-violet-100 text-violet-600 rounded-full hover:bg-violet-200"
              >
                <Pause className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Button
              onClick={handleStartTimer}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              <Timer className="w-4 h-4 mr-2" />
              10분 타이머로 시작하기
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              나중에 하기
            </Button>
            <Button
              onClick={onComplete}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="w-4 h-4 mr-2" />
              완료했어요!
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskExecutionModal
