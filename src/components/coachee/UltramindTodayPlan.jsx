/**
 * Ultra Mind 오늘의 플랜
 * AI가 분석한 결과를 바탕으로 구체적인 식단과 보충제를 한눈에 보여줌
 */

import { useEffect, useState, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { TaskExecutionModal } from './TaskExecutionModal'
import { classifyTasks } from '../../lib/taskClassificationService'
import {
  Utensils, Pill, Sun, Sunrise, Moon, Coffee,
  Check, ChevronDown, ChevronUp, Sparkles, Scale,
  Apple, Salad, Fish, ShoppingCart, Clock, AlertCircle,
  Ban, Lightbulb, ListChecks, RefreshCw,
  Brain, ListTodo, FolderOpen, Loader2, Trash2, ArrowRight,
  CheckCircle, GripVertical
} from 'lucide-react'
import {
  getActiveUltramindProgram,
  getTodayProgress,
  updateDailyProgress
} from '../../lib/ultramindProgramService'
import {
  generatePrescription,
  generate6WeekProgram
} from '../../lib/ultramindAnalysisService'

export function UltramindTodayPlan() {
  const { user } = useStore()
  const [program, setProgram] = useState(null)
  const [completedItems, setCompletedItems] = useState([])
  const [expandedSection, setExpandedSection] = useState('tasks') // 기본값을 tasks로 변경
  const [loading, setLoading] = useState(true)

  // 브레인 덤프 관련 상태
  const [dumpText, setDumpText] = useState('')
  const [isClassifying, setIsClassifying] = useState(false)
  const [dailyTasks, setDailyTasks] = useState([])
  const [comprehensiveTasks, setComprehensiveTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [showExecutionModal, setShowExecutionModal] = useState(false)

  // useMemo를 먼저 선언 (Hooks 순서 보장)
  const { mealPlan, supplementSchedule } = useMemo(() => {
    if (!program) {
      return { mealPlan: {}, supplementSchedule: {} }
    }

    const programData = program.program_data || {}
    const prescriptions = program.prescriptions || []

    const existingMealPlan = programData.mealPlan
    const existingSupplementSchedule = programData.supplementSchedule

    // 기존 데이터가 있으면 그대로 사용
    if (existingMealPlan?.meals && Object.keys(existingMealPlan.meals).length > 0) {
      return {
        mealPlan: existingMealPlan,
        supplementSchedule: existingSupplementSchedule || {}
      }
    }

    // 없으면 prescriptions로부터 새로 생성
    if (prescriptions && prescriptions.length > 0) {
      console.log('[UltramindTodayPlan] prescriptions로부터 식단/보충제 생성:', prescriptions.length)
      try {
        const newProgram = generate6WeekProgram(prescriptions, { hasCoachAccess: true })
        return {
          mealPlan: newProgram.mealPlan || {},
          supplementSchedule: newProgram.supplementSchedule || {}
        }
      } catch (err) {
        console.error('[UltramindTodayPlan] 프로그램 생성 실패:', err)
      }
    }

    return { mealPlan: {}, supplementSchedule: {} }
  }, [program])

  useEffect(() => {
    async function loadProgram() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const data = await getActiveUltramindProgram(user.id)
        if (data) {
          setProgram(data)
          const todayLog = await getTodayProgress(data.id)
          if (todayLog?.completed_tasks) {
            setCompletedItems(todayLog.completed_tasks)
          }
        }
      } catch (err) {
        console.error('프로그램 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProgram()
  }, [user?.id])

  // 브레인 덤프 데이터 로드
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`brain_dump_${user.id}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setDailyTasks(parsed.dailyTasks || [])
          setComprehensiveTasks(parsed.comprehensiveTasks || [])
        } catch (e) {}
      }
    }
  }, [user?.id])

  // 브레인 덤프 데이터 저장
  const saveBrainDumpData = (daily, comprehensive) => {
    if (user?.id) {
      localStorage.setItem(`brain_dump_${user.id}`, JSON.stringify({
        dailyTasks: daily,
        comprehensiveTasks: comprehensive,
        updatedAt: new Date().toISOString()
      }))
    }
  }

  // AI 분류 실행
  const handleClassify = async () => {
    if (!dumpText.trim()) return

    setIsClassifying(true)
    try {
      const result = await classifyTasks(dumpText)

      const newDailyTasks = result.daily.map((task, idx) => ({
        id: `daily-${Date.now()}-${idx}`,
        text: task,
        completed: false,
        createdAt: new Date().toISOString()
      }))

      const newComprehensiveTasks = result.comprehensive.map((task, idx) => ({
        id: `comp-${Date.now()}-${idx}`,
        text: task,
        completed: false,
        createdAt: new Date().toISOString()
      }))

      const updatedDaily = [...dailyTasks, ...newDailyTasks]
      const updatedComp = [...comprehensiveTasks, ...newComprehensiveTasks]

      setDailyTasks(updatedDaily)
      setComprehensiveTasks(updatedComp)
      saveBrainDumpData(updatedDaily, updatedComp)
      setDumpText('')
    } catch (err) {
      console.error('분류 실패:', err)
      alert('분류 중 오류가 발생했습니다.')
    } finally {
      setIsClassifying(false)
    }
  }

  // 태스크 이동
  const moveTask = (task, from) => {
    if (from === 'daily') {
      const newDaily = dailyTasks.filter(t => t.id !== task.id)
      const newComp = [...comprehensiveTasks, { ...task, id: `comp-${Date.now()}` }]
      setDailyTasks(newDaily)
      setComprehensiveTasks(newComp)
      saveBrainDumpData(newDaily, newComp)
    } else {
      const newComp = comprehensiveTasks.filter(t => t.id !== task.id)
      const newDaily = [...dailyTasks, { ...task, id: `daily-${Date.now()}` }]
      setDailyTasks(newDaily)
      setComprehensiveTasks(newComp)
      saveBrainDumpData(newDaily, newComp)
    }
  }

  // 태스크 삭제
  const deleteTask = (taskId, from) => {
    if (from === 'daily') {
      const updated = dailyTasks.filter(t => t.id !== taskId)
      setDailyTasks(updated)
      saveBrainDumpData(updated, comprehensiveTasks)
    } else {
      const updated = comprehensiveTasks.filter(t => t.id !== taskId)
      setComprehensiveTasks(updated)
      saveBrainDumpData(dailyTasks, updated)
    }
  }

  // 태스크 완료 토글
  const toggleTaskComplete = (taskId, from) => {
    if (from === 'daily') {
      const updated = dailyTasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
      setDailyTasks(updated)
      saveBrainDumpData(updated, comprehensiveTasks)
    } else {
      const updated = comprehensiveTasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
      setComprehensiveTasks(updated)
      saveBrainDumpData(dailyTasks, updated)
    }
  }

  // 태스크 실행 시작
  const startExecution = (task) => {
    setSelectedTask(task)
    setShowExecutionModal(true)
  }

  const handleToggle = async (itemKey) => {
    const newCompleted = completedItems.includes(itemKey)
      ? completedItems.filter(k => k !== itemKey)
      : [...completedItems, itemKey]

    setCompletedItems(newCompleted)

    if (program) {
      await updateDailyProgress(program.id, user.id, newCompleted, null, null, null)
    }
  }

  // 로딩 중
  if (loading) {
    return (
      <Card className="border-violet-100">
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-100 rounded w-1/3" />
            <div className="h-20 bg-gray-100 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // 프로그램 없음
  if (!program) return null

  const meals = mealPlan.meals || {}

  // 진행률 계산
  const mealKeys = Object.keys(meals)
  const suppKeys = Object.keys(supplementSchedule).filter(k => supplementSchedule[k]?.items?.length > 0)
  const totalItems = mealKeys.length + suppKeys.length
  const completedCount = completedItems.length
  const progress = totalItems > 0 ? Math.round((completedCount / (totalItems * 2)) * 100) : 0

  // 데이터가 없는 경우 (prescriptions도 없음)
  const hasNoData = mealKeys.length === 0 && suppKeys.length === 0

  if (hasNoData) {
    return (
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <CardContent className="p-5 text-center">
          <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-violet-500" />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">맞춤 플랜 준비 중</h4>
          <p className="text-sm text-gray-500 mb-3">
            검사 결과를 기반으로 맞춤 식단과 보충제를 생성합니다.
          </p>
          <button
            onClick={() => window.location.href = '/coachee/ultramind'}
            className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            프로그램 설정하기
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            오늘의 맞춤 플랜
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{Math.min(progress, 100)}%</span>
            <div className="w-12 h-1.5 bg-violet-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 space-y-3">
        {/* 오늘의 할 일 (브레인 덤프 통합) */}
        <div className="bg-white rounded-xl border border-violet-100 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'tasks' ? null : 'tasks')}
            className="w-full flex items-center justify-between p-3 hover:bg-violet-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-violet-600" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900 text-sm">오늘의 할 일</h4>
                <p className="text-xs text-gray-500">
                  {dailyTasks.filter(t => !t.completed).length}개 남음
                </p>
              </div>
            </div>
            {expandedSection === 'tasks' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSection === 'tasks' && (
            <div className="px-3 pb-3 space-y-3">
              {/* 브레인 덤프 입력 */}
              <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                <p className="text-xs text-gray-600 mb-2">
                  해야 하는 일, 미루고 있는 일들을 생각나는 대로 적어주세요.
                </p>
                <textarea
                  value={dumpText}
                  onChange={(e) => setDumpText(e.target.value)}
                  placeholder="예: 세금 신고하기, 엄마한테 전화, 프로젝트 보고서..."
                  className="w-full h-16 p-2 border border-violet-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm bg-white"
                />
                <button
                  onClick={handleClassify}
                  disabled={!dumpText.trim() || isClassifying}
                  className="w-full mt-2 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isClassifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI가 분류하는 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI로 분류하기
                    </>
                  )}
                </button>
              </div>

              {/* 포괄 실행목록 */}
              {comprehensiveTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-gray-700">포괄 실행목록</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                      {comprehensiveTasks.filter(t => !t.completed).length}
                    </span>
                  </div>
                  {comprehensiveTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      type="comprehensive"
                      onToggleComplete={() => toggleTaskComplete(task.id, 'comprehensive')}
                      onMove={() => moveTask(task, 'comprehensive')}
                      onDelete={() => deleteTask(task.id, 'comprehensive')}
                      onStart={() => startExecution(task)}
                    />
                  ))}
                </div>
              )}

              {/* 일일 실행목록 */}
              {dailyTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <ListTodo className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-gray-700">일일 실행목록</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                      {dailyTasks.filter(t => !t.completed).length}
                    </span>
                  </div>
                  {dailyTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      type="daily"
                      onToggleComplete={() => toggleTaskComplete(task.id, 'daily')}
                      onMove={() => moveTask(task, 'daily')}
                      onDelete={() => deleteTask(task.id, 'daily')}
                      onStart={() => startExecution(task)}
                    />
                  ))}
                </div>
              )}

              {dailyTasks.length === 0 && comprehensiveTasks.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">
                  브레인 덤프를 하면 AI가 할 일을 분류해드려요
                </p>
              )}
            </div>
          )}
        </div>

        {/* TDEE 정보 표시 */}
        {mealPlan.tdeeInfo && (
          <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">일일 권장 칼로리</span>
              </div>
              <span className="text-lg font-bold text-emerald-600">
                {mealPlan.tdeeInfo.tdee.toLocaleString()} kcal
              </span>
            </div>
            <div className="flex gap-2 mt-2 text-xs text-gray-500">
              <span className="px-2 py-0.5 bg-white rounded">아침 {mealPlan.tdeeInfo.mealCalories?.breakfast}</span>
              <span className="px-2 py-0.5 bg-white rounded">점심 {mealPlan.tdeeInfo.mealCalories?.lunch}</span>
              <span className="px-2 py-0.5 bg-white rounded">저녁 {mealPlan.tdeeInfo.mealCalories?.dinner}</span>
            </div>
          </div>
        )}

        {/* 식단 & 보충제 (시간대별 통합) */}
        <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'nutrition' ? null : 'nutrition')}
            className="w-full flex items-center justify-between p-3 hover:bg-emerald-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-lg flex items-center justify-center">
                <Utensils className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900 text-sm">식단 & 보충제</h4>
                <p className="text-xs text-gray-500">
                  {mealPlan.tdeeInfo ? `${mealPlan.tdeeInfo.tdee}kcal · 시간대별 안내` : '시간대별 안내'}
                </p>
              </div>
            </div>
            {expandedSection === 'nutrition' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSection === 'nutrition' && (
            <div className="px-3 pb-3 space-y-3">
              {/* 기상 직후 보충제 */}
              {supplementSchedule.wakeUp?.items?.length > 0 && (
                <TimeSlotCard
                  title="기상 직후"
                  time={supplementSchedule.wakeUp.time}
                  icon={<Sunrise className="w-4 h-4 text-amber-600" />}
                  color="amber"
                  supplements={supplementSchedule.wakeUp.items}
                  timeKey="supp-wakeup"
                  completedItems={completedItems}
                  onToggle={handleToggle}
                />
              )}

              {/* 아침 */}
              <TimeSlotCard
                title="아침"
                icon={<Sunrise className="w-4 h-4 text-amber-600" />}
                color="amber"
                meal={meals.breakfast}
                mealKey="meal-breakfast"
                supplements={supplementSchedule.breakfast?.items}
                timeKey="supp-breakfast"
                completedItems={completedItems}
                onToggle={handleToggle}
              />

              {/* 오전 간식 */}
              {meals.morningSnack && (
                <TimeSlotCard
                  title="오전 간식"
                  icon={<Coffee className="w-4 h-4 text-orange-600" />}
                  color="orange"
                  snack={meals.morningSnack}
                  mealKey="meal-morningsnack"
                  completedItems={completedItems}
                  onToggle={handleToggle}
                />
              )}

              {/* 점심 */}
              <TimeSlotCard
                title="점심"
                icon={<Sun className="w-4 h-4 text-yellow-600" />}
                color="yellow"
                meal={meals.lunch}
                mealKey="meal-lunch"
                supplements={supplementSchedule.lunch?.items}
                timeKey="supp-lunch"
                completedItems={completedItems}
                onToggle={handleToggle}
              />

              {/* 오후 간식 */}
              {meals.afternoonSnack && (
                <TimeSlotCard
                  title="오후 간식"
                  icon={<Apple className="w-4 h-4 text-green-600" />}
                  color="green"
                  snack={meals.afternoonSnack}
                  mealKey="meal-afternoonsnack"
                  completedItems={completedItems}
                  onToggle={handleToggle}
                />
              )}

              {/* 저녁 */}
              <TimeSlotCard
                title="저녁"
                icon={<Moon className="w-4 h-4 text-indigo-600" />}
                color="indigo"
                meal={meals.dinner}
                mealKey="meal-dinner"
                supplements={supplementSchedule.dinner?.items}
                timeKey="supp-dinner"
                completedItems={completedItems}
                onToggle={handleToggle}
              />

              {/* 취침 전 보충제 */}
              {supplementSchedule.bedtime?.items?.length > 0 && (
                <TimeSlotCard
                  title="취침 전"
                  time={supplementSchedule.bedtime.time}
                  icon={<Moon className="w-4 h-4 text-purple-600" />}
                  color="purple"
                  supplements={supplementSchedule.bedtime.items}
                  timeKey="supp-bedtime"
                  completedItems={completedItems}
                  onToggle={handleToggle}
                />
              )}

              {/* 피해야 할 음식 */}
              {mealPlan.avoidFoods?.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                    <Ban className="w-3 h-3" /> 오늘 피해야 할 음식
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {mealPlan.avoidFoods.slice(0, 6).map((food, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 맞춤 포인트 */}
              {mealPlan.personalNotes?.length > 0 && (
                <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                  <p className="text-xs font-medium text-violet-700 mb-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> 나만의 맞춤 포인트
                  </p>
                  <ul className="space-y-1">
                    {mealPlan.personalNotes.map((note, idx) => (
                      <li key={idx} className="text-xs text-violet-600 flex items-start gap-1">
                        <span className="text-violet-400 mt-0.5">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 장보기 리스트 */}
        {mealPlan.shoppingList && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'shopping' ? null : 'shopping')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 text-sm">이번 주 장보기</h4>
                  <p className="text-xs text-gray-500">맞춤 식재료 리스트</p>
                </div>
              </div>
              {expandedSection === 'shopping' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSection === 'shopping' && (
              <div className="px-3 pb-3 space-y-2">
                <ShoppingCategory title="단백질" items={mealPlan.shoppingList.proteins} color="red" />
                <ShoppingCategory title="채소" items={mealPlan.shoppingList.vegetables} color="green" />
                <ShoppingCategory title="과일" items={mealPlan.shoppingList.fruits} color="orange" />
                <ShoppingCategory title="견과류/씨앗" items={mealPlan.shoppingList.nuts} color="amber" />
                <ShoppingCategory title="발효식품" items={mealPlan.shoppingList.fermented} color="purple" />
                <ShoppingCategory title="곡물" items={mealPlan.shoppingList.grains} color="yellow" />
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* 실행 준비 모달 */}
      {showExecutionModal && selectedTask && (
        <TaskExecutionModal
          task={selectedTask}
          onClose={() => {
            setShowExecutionModal(false)
            setSelectedTask(null)
          }}
          onComplete={() => {
            toggleTaskComplete(selectedTask.id, selectedTask.id.startsWith('daily') ? 'daily' : 'comprehensive')
            setShowExecutionModal(false)
            setSelectedTask(null)
          }}
        />
      )}
    </Card>
  )
}

// 태스크 아이템 컴포넌트
function TaskItem({ task, type, onToggleComplete, onMove, onDelete, onStart }) {
  return (
    <div className={`p-2.5 rounded-lg border ${
      task.completed
        ? 'bg-gray-50 border-gray-200'
        : type === 'daily'
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start gap-2">
        <button
          onClick={onToggleComplete}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            task.completed
              ? 'bg-gray-400 border-gray-400'
              : type === 'daily'
                ? 'border-emerald-400 hover:bg-emerald-100'
                : 'border-blue-400 hover:bg-blue-100'
          }`}
        >
          {task.completed && <CheckCircle className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
            {task.text}
          </p>
        </div>

        <div className="flex items-center gap-0.5">
          {!task.completed && type === 'daily' && (
            <button
              onClick={onStart}
              className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
              title="실행 시작"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onMove}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
            title={type === 'daily' ? '포괄목록으로' : '일일목록으로'}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 rounded"
            title="삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// 시간대별 통합 카드 컴포넌트 (식사 + 보충제)
function TimeSlotCard({ title, time, icon, color, meal, snack, mealKey, supplements, timeKey, completedItems, onToggle }) {
  const colorStyles = {
    amber: { bg: '#fffbeb', border: '#fef3c7' },
    orange: { bg: '#fff7ed', border: '#fed7aa' },
    yellow: { bg: '#fefce8', border: '#fef08a' },
    green: { bg: '#f0fdf4', border: '#bbf7d0' },
    indigo: { bg: '#eef2ff', border: '#c7d2fe' },
    purple: { bg: '#faf5ff', border: '#e9d5ff' }
  }
  const styles = colorStyles[color] || colorStyles.amber

  const hasMeal = meal && meal.mainDish
  const hasSnack = snack
  const hasSupplements = supplements && supplements.length > 0
  const mealChecked = completedItems.includes(mealKey)

  // 아무 내용도 없으면 렌더링 안 함
  if (!hasMeal && !hasSnack && !hasSupplements) return null

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: styles.bg, borderColor: styles.border }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: styles.border }}>
        {icon}
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        {time && <span className="text-xs text-gray-500">({time})</span>}
        {meal?.calories && (
          <span className="ml-auto px-2 py-0.5 bg-white/70 rounded text-xs text-gray-500 font-medium">
            {meal.calories}kcal
          </span>
        )}
      </div>

      <div className="p-3 space-y-2">
        {/* 식사 */}
        {hasMeal && (
          <div className="flex items-start gap-2">
            <button
              onClick={() => onToggle(mealKey)}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                mealChecked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {mealChecked && <Check className="w-3 h-3 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Utensils className="w-3 h-3 text-gray-400" />
                <span className={`text-xs font-medium ${mealChecked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  식사
                </span>
              </div>
              <div className={`text-xs space-y-0.5 ${mealChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                <p><span className="font-medium">메인:</span> {meal.mainDish}</p>
                {meal.sideDish && <p><span className="font-medium">사이드:</span> {meal.sideDish}</p>}
                {meal.rice && <p><span className="font-medium">밥:</span> {meal.rice}</p>}
                {meal.drink && <p><span className="font-medium">음료:</span> {meal.drink}</p>}
                {meal.tip && <p className="text-gray-400 italic">Tip: {meal.tip}</p>}
              </div>
            </div>
          </div>
        )}

        {/* 간식 */}
        {hasSnack && (
          <div className="flex items-start gap-2">
            <button
              onClick={() => onToggle(mealKey)}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                mealChecked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {mealChecked && <Check className="w-3 h-3 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className={`text-xs ${mealChecked ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                {snack.options?.slice(0, 2).join(' 또는 ') || snack.title}
              </div>
            </div>
          </div>
        )}

        {/* 보충제 */}
        {hasSupplements && (
          <div className="space-y-1.5">
            {(hasMeal || hasSnack) && <div className="border-t my-2" style={{ borderColor: styles.border }} />}
            <div className="flex items-center gap-1 mb-1">
              <Pill className="w-3 h-3 text-blue-500" />
              <span className="text-xs font-medium text-gray-500">보충제</span>
            </div>
            {supplements.map((item, idx) => {
              const key = `${timeKey}-${idx}`
              const isChecked = completedItems.includes(key)

              return (
                <button
                  key={idx}
                  onClick={() => onToggle(key)}
                  className="w-full flex items-start gap-2 text-left"
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isChecked ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs ${isChecked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {item.name}
                      <span className="text-gray-400 ml-1">{item.dosage}</span>
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// 장보기 카테고리 컴포넌트
function ShoppingCategory({ title, items, color }) {
  if (!items?.length) return null

  return (
    <div className="flex items-start gap-2">
      <span className="text-xs font-medium text-gray-500 w-20 flex-shrink-0">{title}</span>
      <div className="flex flex-wrap gap-1">
        {items.map((item, idx) => (
          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export default UltramindTodayPlan
