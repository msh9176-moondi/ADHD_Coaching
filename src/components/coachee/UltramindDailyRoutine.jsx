/**
 * Ultra Mind 오늘의 루틴 카드
 * 시간대별 할 일 목록과 체크 기능
 */

import { useEffect, useState } from 'react'
import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import {
  Sun, Sunrise, Coffee, Utensils, Clock, Sunset, Moon, BedDouble,
  Check, Circle, ChevronDown, ChevronUp, Sparkles, Pill, Footprints
} from 'lucide-react'
import {
  getActiveUltramindProgram,
  getTodayProgress,
  updateDailyProgress,
  getTodayRoutine
} from '../../lib/ultramindProgramService'

// 시간대별 아이콘 매핑
const slotIcons = {
  wakeUp: Sunrise,
  morning: Sun,
  midMorning: Coffee,
  lunch: Utensils,
  afternoon: Clock,
  preDinner: Footprints,
  dinner: Utensils,
  evening: Sunset,
  bedtime: Moon
}

// 시간대별 색상
const slotColors = {
  wakeUp: 'amber',
  morning: 'yellow',
  midMorning: 'orange',
  lunch: 'emerald',
  afternoon: 'blue',
  preDinner: 'cyan',
  dinner: 'teal',
  evening: 'purple',
  bedtime: 'indigo'
}

// 시간대 한글 이름
const slotNames = {
  wakeUp: '기상',
  morning: '오전',
  midMorning: '오전 간식',
  lunch: '점심',
  afternoon: '오후',
  preDinner: '저녁 전',
  dinner: '저녁',
  evening: '저녁 이완',
  bedtime: '취침'
}

export function UltramindDailyRoutine() {
  const { user } = useStore()
  const [program, setProgram] = useState(null)
  const [routineSlots, setRoutineSlots] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [expandedSlot, setExpandedSlot] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRoutine() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const programData = await getActiveUltramindProgram(user.id)
        if (!programData) {
          setLoading(false)
          return
        }

        setProgram(programData)

        // 오늘의 루틴 가져오기
        const slots = getTodayRoutine(programData.program_data)
        if (slots) {
          setRoutineSlots(slots)
          // 현재 시간대 자동 확장
          const currentSlot = slots.find(s => s.isCurrentSlot)
          if (currentSlot) {
            setExpandedSlot(currentSlot.id)
          }
        }

        // 오늘의 완료된 태스크 가져오기
        const todayLog = await getTodayProgress(programData.id)
        if (todayLog?.completed_tasks) {
          setCompletedTasks(todayLog.completed_tasks)
        }
      } catch (err) {
        console.error('루틴 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRoutine()
  }, [user?.id])

  // 태스크 완료 토글
  const handleToggleTask = async (slotId, taskIndex) => {
    const taskKey = `${slotId}-${taskIndex}`
    const isCompleted = completedTasks.includes(taskKey)

    const newCompletedTasks = isCompleted
      ? completedTasks.filter(t => t !== taskKey)
      : [...completedTasks, taskKey]

    setCompletedTasks(newCompletedTasks)

    // DB 업데이트
    if (program) {
      await updateDailyProgress(program.id, user.id, newCompletedTasks, null, null, null)
    }
  }

  // 전체 진행률 계산
  const totalTasks = routineSlots.reduce((sum, slot) => sum + (slot.tasks?.length || 0), 0)
  const completedCount = completedTasks.length
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 프로그램이나 루틴이 없으면 표시 안 함
  if (!program || routineSlots.length === 0) {
    return null
  }

  return (
    <Card className="border-violet-100">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            오늘의 루틴
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              {completedCount}/{totalTasks} 완료
            </div>
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {routineSlots.map((slot) => {
            const Icon = slotIcons[slot.id] || Clock
            const color = slotColors[slot.id] || 'gray'
            const isExpanded = expandedSlot === slot.id
            const slotTasks = slot.tasks || []
            const slotCompletedCount = slotTasks.filter((_, idx) =>
              completedTasks.includes(`${slot.id}-${idx}`)
            ).length
            const isSlotComplete = slotCompletedCount === slotTasks.length && slotTasks.length > 0

            return (
              <div
                key={slot.id}
                className={`rounded-xl border transition-all ${
                  slot.isCurrentSlot
                    ? 'border-violet-300 bg-violet-50'
                    : isSlotComplete
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-gray-100 bg-gray-50'
                }`}
              >
                {/* 슬롯 헤더 */}
                <button
                  onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}
                  className="w-full flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSlotComplete
                        ? 'bg-emerald-100'
                        : slot.isCurrentSlot
                          ? 'bg-violet-100'
                          : 'bg-white'
                    }`}>
                      {isSlotComplete ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Icon className={`w-4 h-4 ${
                          slot.isCurrentSlot ? 'text-violet-600' : 'text-gray-500'
                        }`} />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          slot.isCurrentSlot ? 'text-violet-700' : 'text-gray-700'
                        }`}>
                          {slotNames[slot.id] || slot.id}
                        </span>
                        {slot.isCurrentSlot && (
                          <span className="px-1.5 py-0.5 bg-violet-200 text-violet-700 text-xs font-medium rounded">
                            지금
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{slot.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {slotCompletedCount}/{slotTasks.length}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* 태스크 목록 */}
                {isExpanded && slotTasks.length > 0 && (
                  <div className="px-3 pb-3 space-y-1.5">
                    {slotTasks.map((task, idx) => {
                      const taskKey = `${slot.id}-${idx}`
                      const isCompleted = completedTasks.includes(taskKey)

                      return (
                        <button
                          key={idx}
                          onClick={() => handleToggleTask(slot.id, idx)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                            isCompleted
                              ? 'bg-emerald-100'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isCompleted
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-gray-300'
                          }`}>
                            {isCompleted && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className={`text-sm text-left ${
                            isCompleted
                              ? 'text-emerald-700 line-through'
                              : 'text-gray-700'
                          }`}>
                            {task}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default UltramindDailyRoutine
