import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Button } from '../common/Button'
import { FileText, Target, Play, Pause, RotateCcw, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function CurrentAction() {
  const { coachingStatus, coachingAction, setCoachingAction } = useStore()
  const navigate = useNavigate()

  // 타이머 상태 (10분 = 600초)
  const [timeLeft, setTimeLeft] = useState(600)
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const intervalRef = useRef(null)

  // 타이머 로직
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            setIsCompleted(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  // coachingAction이 변경되면 타이머 리셋
  useEffect(() => {
    setTimeLeft(600)
    setIsRunning(false)
    setIsCompleted(false)
  }, [coachingAction?.id])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsRunning(true)
    setCoachingAction({ ...coachingAction, status: 'in_progress' })
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setTimeLeft(600)
    setIsRunning(false)
    setIsCompleted(false)
  }

  const handleComplete = () => {
    setCoachingAction({ ...coachingAction, status: 'completed' })
    setIsCompleted(false)
    setTimeLeft(600)
  }

  // 진행 상태에 따라 다른 CTA 표시
  if (!coachingStatus.declarationCompleted) {
    return (
      <div id="current-action" className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 rounded-xl">
            <FileText className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-amber-600 font-medium mb-1">코칭을 시작하기 전에</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              선언서를 확인해 주세요
            </h2>
            <p className="text-gray-600 mb-4">
              코치와 함께 지킬 약속을 확인하고 동의해 주세요.
            </p>
            <Button onClick={() => navigate('/coachee/messages')}>
              <FileText className="w-4 h-4 mr-2" />
              선언서 확인하기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!coachingStatus.goalAgreementCompleted) {
    return (
      <div id="current-action" className="bg-gradient-to-r from-amber-50 to-orange-50 border border-emerald-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Target className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-emerald-600 font-medium mb-1">다음 단계</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              목표합의서가 도착했습니다
            </h2>
            <p className="text-gray-600 mb-4">
              코치님이 작성한 목표합의서를 확인하고 의견을 남겨주세요.
            </p>
            <Button onClick={() => navigate('/coachee/messages')}>
              <Target className="w-4 h-4 mr-2" />
              목표합의서 확인하기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // coachingAction이 없는 경우
  if (!coachingAction) {
    return (
      <div id="current-action" className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-2xl p-6">
        <div className="text-center py-4">
          <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">아직 설정된 행동이 없습니다.</p>
          <p className="text-sm text-gray-400 mt-1">코치님과 상담 후 행동이 설정됩니다.</p>
        </div>
      </div>
    )
  }

  // 선언서, 목표합의서 완료 → 오늘의 다음 행동
  return (
    <div id="current-action" className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
      <p className="text-sm text-emerald-600 font-medium mb-2">지금 할 일</p>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {coachingAction.title}
      </h2>

      {coachingAction.minAction && (
        <p className="text-gray-600 mb-4">
          가장 작은 시작: <span className="font-medium">{coachingAction.minAction}</span>
        </p>
      )}

      {/* 타이머 UI */}
      {(isRunning || timeLeft < 600 || isCompleted) ? (
        <div className="space-y-4">
          {/* 타이머 표시 */}
          <div className="flex items-center justify-center">
            <div className={`text-5xl font-bold tabular-nums ${
              isCompleted ? 'text-emerald-600' : timeLeft <= 60 ? 'text-red-500' : 'text-gray-900'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* 진행 바 */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isCompleted ? 'bg-emerald-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${((600 - timeLeft) / 600) * 100}%` }}
            />
          </div>

          {/* 컨트롤 버튼 */}
          <div className="flex justify-center gap-3">
            {isCompleted ? (
              <Button
                size="lg"
                onClick={handleComplete}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                완료!
              </Button>
            ) : isRunning ? (
              <Button
                size="lg"
                variant="outline"
                onClick={handlePause}
              >
                <Pause className="w-4 h-4 mr-2" />
                일시정지
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleStart}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Play className="w-4 h-4 mr-2" />
                계속하기
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              리셋
            </Button>
          </div>

          {isCompleted && (
            <p className="text-center text-emerald-600 font-medium">
              🎉 10분 완료! 잘하셨어요!
            </p>
          )}
        </div>
      ) : (
        <Button
          size="lg"
          onClick={handleStart}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Play className="w-4 h-4 mr-2" />
          10분 시작하기
        </Button>
      )}
    </div>
  )
}
