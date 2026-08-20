/**
 * Ultra Mind 오늘의 플랜
 * AI가 분석한 결과를 바탕으로 구체적인 식단과 보충제를 한눈에 보여줌
 */

import { useEffect, useState, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import {
  Utensils, Pill, Sun, Sunrise, Moon, Coffee,
  Check, ChevronDown, ChevronUp, Sparkles, Scale,
  Apple, Salad, Fish, ShoppingCart, Clock, AlertCircle,
  Ban, Lightbulb, ListChecks, RefreshCw
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
  const [expandedSection, setExpandedSection] = useState('meals')
  const [loading, setLoading] = useState(true)

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

        {/* 오늘의 식단 */}
        <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'meals' ? null : 'meals')}
            className="w-full flex items-center justify-between p-3 hover:bg-emerald-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Utensils className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900 text-sm">오늘의 식단</h4>
                <p className="text-xs text-gray-500">
                  {mealPlan.tdeeInfo ? `총 ${mealPlan.tdeeInfo.tdee}kcal 기준` : 'AI 맞춤 메뉴'}
                </p>
              </div>
            </div>
            {expandedSection === 'meals' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSection === 'meals' && (
            <div className="px-3 pb-3 space-y-3">
              {/* 아침 */}
              {meals.breakfast && (
                <MealCard
                  meal={meals.breakfast}
                  icon={<Sunrise className="w-4 h-4 text-amber-600" />}
                  color="amber"
                  itemKey="meal-breakfast"
                  isChecked={completedItems.includes('meal-breakfast')}
                  onToggle={handleToggle}
                />
              )}

              {/* 오전 간식 */}
              {meals.morningSnack && (
                <SnackCard
                  snack={meals.morningSnack}
                  icon={<Coffee className="w-4 h-4 text-orange-600" />}
                  color="orange"
                  itemKey="meal-morningsnack"
                  isChecked={completedItems.includes('meal-morningsnack')}
                  onToggle={handleToggle}
                />
              )}

              {/* 점심 */}
              {meals.lunch && (
                <MealCard
                  meal={meals.lunch}
                  icon={<Sun className="w-4 h-4 text-yellow-600" />}
                  color="yellow"
                  itemKey="meal-lunch"
                  isChecked={completedItems.includes('meal-lunch')}
                  onToggle={handleToggle}
                />
              )}

              {/* 오후 간식 */}
              {meals.afternoonSnack && (
                <SnackCard
                  snack={meals.afternoonSnack}
                  icon={<Apple className="w-4 h-4 text-green-600" />}
                  color="green"
                  itemKey="meal-afternoonsnack"
                  isChecked={completedItems.includes('meal-afternoonsnack')}
                  onToggle={handleToggle}
                />
              )}

              {/* 저녁 */}
              {meals.dinner && (
                <MealCard
                  meal={meals.dinner}
                  icon={<Moon className="w-4 h-4 text-indigo-600" />}
                  color="indigo"
                  itemKey="meal-dinner"
                  isChecked={completedItems.includes('meal-dinner')}
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
                    <Lightbulb className="w-3 h-3" /> 나만의 식단 포인트
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

        {/* 오늘의 보충제 */}
        <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'supplements' ? null : 'supplements')}
            className="w-full flex items-center justify-between p-3 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Pill className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900 text-sm">오늘의 보충제</h4>
                <p className="text-xs text-gray-500">시간대별 복용 안내</p>
              </div>
            </div>
            {expandedSection === 'supplements' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSection === 'supplements' && (
            <div className="px-3 pb-3 space-y-3">
              {/* 기상 직후 */}
              {supplementSchedule.wakeUp?.items?.length > 0 && (
                <SupplementTimeSlot
                  slot={supplementSchedule.wakeUp}
                  icon={<Sunrise className="w-3 h-3" />}
                  color="amber"
                  timeKey="supp-wakeup"
                  completedItems={completedItems}
                  onToggle={handleToggle}
                />
              )}

              {/* 아침 식후 */}
              {supplementSchedule.breakfast?.items?.length > 0 && (
                <SupplementTimeSlot
                  slot={supplementSchedule.breakfast}
                  icon={<Coffee className="w-3 h-3" />}
                  color="orange"
                  timeKey="supp-breakfast"
                  completedItems={completedItems}
                  onToggle={handleToggle}
                />
              )}

              {/* 점심 식후 */}
              {supplementSchedule.lunch?.items?.length > 0 && (
                <SupplementTimeSlot
                  slot={supplementSchedule.lunch}
                  icon={<Sun className="w-3 h-3" />}
                  color="yellow"
                  timeKey="supp-lunch"
                  completedItems={completedItems}
                  onToggle={handleToggle}
                />
              )}

              {/* 저녁 식후 */}
              {supplementSchedule.dinner?.items?.length > 0 && (
                <SupplementTimeSlot
                  slot={supplementSchedule.dinner}
                  icon={<Moon className="w-3 h-3" />}
                  color="indigo"
                  timeKey="supp-dinner"
                  completedItems={completedItems}
                  onToggle={handleToggle}
                />
              )}

              {/* 취침 전 */}
              {supplementSchedule.bedtime?.items?.length > 0 && (
                <SupplementTimeSlot
                  slot={supplementSchedule.bedtime}
                  icon={<Moon className="w-3 h-3" />}
                  color="purple"
                  timeKey="supp-bedtime"
                  completedItems={completedItems}
                  onToggle={handleToggle}
                />
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
    </Card>
  )
}

// 식사 카드 컴포넌트
function MealCard({ meal, icon, color, itemKey, isChecked, onToggle }) {
  return (
    <div className={`p-3 bg-${color}-50 rounded-lg border border-${color}-100`}
      style={{
        backgroundColor: color === 'amber' ? '#fffbeb' : color === 'yellow' ? '#fefce8' : color === 'indigo' ? '#eef2ff' : '#f0fdf4'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-800">{meal.title}</span>
          {meal.calories && (
            <span className="px-1.5 py-0.5 bg-white/70 rounded text-xs text-gray-500 font-medium">
              {meal.calories}kcal
            </span>
          )}
        </div>
        <button
          onClick={() => onToggle(itemKey)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isChecked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {isChecked && <Check className="w-4 h-4 text-white" />}
        </button>
      </div>
      <div className="space-y-1 text-xs">
        <p className="text-gray-700"><span className="font-medium">메인:</span> {meal.mainDish}</p>
        {meal.sideDish && <p className="text-gray-600"><span className="font-medium">사이드:</span> {meal.sideDish}</p>}
        {meal.rice && <p className="text-gray-600"><span className="font-medium">밥:</span> {meal.rice}</p>}
        {meal.drink && <p className="text-gray-600"><span className="font-medium">음료:</span> {meal.drink}</p>}
        {meal.tip && <p className="text-gray-500 italic mt-1">Tip: {meal.tip}</p>}
      </div>
    </div>
  )
}

// 간식 카드 컴포넌트
function SnackCard({ snack, icon, color, itemKey, isChecked, onToggle }) {
  return (
    <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-gray-700">{snack.title}</span>
        </div>
        <button
          onClick={() => onToggle(itemKey)}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            isChecked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
          }`}
        >
          {isChecked && <Check className="w-3 h-3 text-white" />}
        </button>
      </div>
      <div className="mt-1 text-xs text-gray-600">
        {snack.options?.slice(0, 2).join(' 또는 ')}
      </div>
    </div>
  )
}

// 보충제 시간대 컴포넌트
function SupplementTimeSlot({ slot, icon, color, timeKey, completedItems, onToggle }) {
  const colorStyles = {
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    orange: 'bg-orange-50 border-orange-100 text-orange-700',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-700',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700'
  }

  return (
    <div className={`p-3 rounded-lg border ${colorStyles[color] || 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium">{slot.time}</span>
      </div>
      <div className="space-y-2">
        {slot.items?.map((item, idx) => {
          const key = `${timeKey}-${idx}`
          const isChecked = completedItems.includes(key)

          return (
            <button
              key={idx}
              onClick={() => onToggle(key)}
              className={`w-full flex items-start gap-2 p-2 rounded-lg transition-all text-left ${
                isChecked ? 'bg-white/80' : 'bg-white hover:bg-white/80'
              }`}
            >
              <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isChecked ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {isChecked && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isChecked ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                  {item.name}
                </div>
                <div className="text-xs text-gray-500">
                  {item.dosage}
                  {item.note && <span className="text-gray-400 ml-1">· {item.note}</span>}
                </div>
              </div>
            </button>
          )
        })}
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
