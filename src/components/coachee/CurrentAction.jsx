import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Button } from '../common/Button'
import { FileText, Target, Play, Pause, RotateCcw, CheckCircle, Clock, ListTodo } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getBrainDump, saveBrainDump } from '../../lib/brainDumpService'

export function CurrentAction() {
  const { user, coachingStatus, coachingAction, setCoachingAction } = useStore()
  const navigate = useNavigate()

  // 타이머 상태 (10분 = 600초)
  const [timeLeft, setTimeLeft] = useState(600)
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const intervalRef = useRef(null)

  // 브레인 덤프에서 현재 시간 태스크
  const [currentDailyTask, setCurrentDailyTask] = useState(null)
  const [nextDailyTask, setNextDailyTask] = useState(null)

  // 시간에 분 추가하는 헬퍼
  const addMinutes = (time, minutes) => {
    const [h, m] = time.split(':').map(Number)
    const totalMinutes = h * 60 + m + minutes
    const newH = Math.floor(totalMinutes / 60) % 24
    const newM = totalMinutes % 60
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`
  }

  // 브레인 덤프 일일 목록에서 현재 시간에 해당하는 태스크 찾기
  useEffect(() => {
    if (!user?.id) return

    const loadDailyTasks = async () => {
      try {
        const data = await getBrainDump(user.id)
        const dailyTasks = (data.dailyTasks || []).filter(t => !t.completed && t.scheduledTime)

        if (dailyTasks.length === 0) {
          setCurrentDailyTask(null)
          setNextDailyTask(null)
          return
        }

        // 현재 시간
        const now = new Date()
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

        // 시간순 정렬
        const sortedTasks = dailyTasks.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))

        // 현재 시간에 해당하는 태스크 찾기 (시작시간이 현재 이전이고 아직 끝나지 않은 것)
        let current = null
        let next = null

        for (let i = 0; i < sortedTasks.length; i++) {
          const task = sortedTasks[i]
          const taskEndTime = addMinutes(task.scheduledTime, task.estimatedMinutes || 30)

          if (task.scheduledTime <= currentTime && currentTime < taskEndTime) {
            current = task
            next = sortedTasks[i + 1] || null
            break
          } else if (task.scheduledTime > currentTime) {
            next = task
            break
          }
        }

        // 현재 진행 중인 태스크가 없으면 가장 가까운 다음 태스크를 현재로
        if (!current && next) {
          current = next
          next = sortedTasks[sortedTasks.indexOf(next) + 1] || null
        }

        setCurrentDailyTask(current)
        setNextDailyTask(next)
      } catch (e) {
        console.error('브레인 덤프 로드 실패:', e)
      }
    }

    loadDailyTasks()

    // 1분마다 갱신
    const interval = setInterval(loadDailyTasks, 60000)

    // brain-dump-updated 이벤트 리스너
    const handleUpdate = () => loadDailyTasks()
    window.addEventListener('brain-dump-updated', handleUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('brain-dump-updated', handleUpdate)
    }
  }, [user?.id])

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

  // coachingAction 또는 currentDailyTask가 변경되면 타이머 리셋
  useEffect(() => {
    setTimeLeft(600)
    setIsRunning(false)
    setIsCompleted(false)
  }, [coachingAction?.id, currentDailyTask?.id])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsRunning(true)
    // 코칭 액션이 있는 경우에만 상태 업데이트
    if (coachingAction && !currentDailyTask) {
      setCoachingAction({ ...coachingAction, status: 'in_progress' })
    }
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

  // 브레인 덤프 태스크 완료 처리
  const handleDailyTaskComplete = async (taskId) => {
    if (!user?.id) return

    try {
      const data = await getBrainDump(user.id)
      const updatedDaily = (data.dailyTasks || []).map(t =>
        t.id === taskId ? { ...t, completed: true } : t
      )

      await saveBrainDump(user.id, updatedDaily, data.comprehensiveTasks || [])

      // 다음 태스크로 이동
      setCurrentDailyTask(nextDailyTask)
      setNextDailyTask(null)
      setIsCompleted(false)
      setTimeLeft(600)
    } catch (e) {
      console.error('태스크 완료 처리 실패:', e)
    }
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

  // 브레인 덤프에서 현재 태스크가 있는 경우 우선 표시
  if (currentDailyTask) {
    return (
      <div id="current-action" className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
            <ListTodo className="w-4 h-4" />
            지금 할 일
          </p>
          <div className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">{currentDailyTask.scheduledTime}</span>
            <span className="text-xs text-emerald-600">({currentDailyTask.estimatedMinutes || 30}분)</span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {currentDailyTask.text}
        </h2>

        {/* 다음 일정 미리보기 */}
        {nextDailyTask && (
          <div className="mb-4 p-2 bg-white/60 rounded-lg border border-emerald-100">
            <p className="text-xs text-gray-500">다음 일정</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium text-emerald-600">{nextDailyTask.scheduledTime}</span>
              {' '}{nextDailyTask.text}
            </p>
          </div>
        )}

        {/* 타이머 UI */}
        {(isRunning || timeLeft < 600 || isCompleted) ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className={`text-5xl font-bold tabular-nums ${
                isCompleted ? 'text-emerald-600' : timeLeft <= 60 ? 'text-red-500' : 'text-gray-900'
              }`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isCompleted ? 'bg-emerald-500' : 'bg-emerald-400'
                }`}
                style={{ width: `${((600 - timeLeft) / 600) * 100}%` }}
              />
            </div>

            <div className="flex justify-center gap-3">
              {isCompleted ? (
                <Button
                  size="lg"
                  onClick={() => handleDailyTaskComplete(currentDailyTask.id)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  완료!
                </Button>
              ) : isRunning ? (
                <Button size="lg" variant="outline" onClick={handlePause}>
                  <Pause className="w-4 h-4 mr-2" />
                  일시정지
                </Button>
              ) : (
                <Button size="lg" onClick={handleStart} className="bg-emerald-600 hover:bg-emerald-700">
                  <Play className="w-4 h-4 mr-2" />
                  계속하기
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                리셋
              </Button>
            </div>

            {isCompleted && (
              <p className="text-center text-emerald-600 font-medium">
                잘하셨어요! 다음 일정으로 넘어갈까요?
              </p>
            )}
          </div>
        ) : (
          <Button size="lg" onClick={handleStart} className="bg-emerald-600 hover:bg-emerald-700">
            <Play className="w-4 h-4 mr-2" />
            10분 시작하기
          </Button>
        )}
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
          <p className="text-sm text-gray-400 mt-1">브레인 덤프에서 오늘 할 일을 추가하세요.</p>
        </div>
      </div>
    )
  }

  // 선언서, 목표합의서 완료 → 오늘의 다음 행동 (코칭 과제)
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
