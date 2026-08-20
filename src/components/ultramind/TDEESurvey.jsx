/**
 * TDEE (Total Daily Energy Expenditure) 간단 설문
 * 키/체중/나이/성별/활동량으로 일일 필요 칼로리 계산
 */

import { useState } from 'react'
import { Card, CardContent } from '../common/Card'
import {
  Scale, Ruler, Calendar, User, Activity,
  ChevronRight, Calculator, Utensils, Check
} from 'lucide-react'

// 활동량 레벨
const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: '좌식생활', desc: '운동 거의 안함, 사무직', factor: 1.2 },
  { id: 'light', label: '가벼운 활동', desc: '주 1-3회 가벼운 운동', factor: 1.375 },
  { id: 'moderate', label: '보통 활동', desc: '주 3-5회 중간 강도 운동', factor: 1.55 },
  { id: 'active', label: '활발한 활동', desc: '주 6-7회 운동 또는 육체노동', factor: 1.725 },
  { id: 'veryActive', label: '매우 활발', desc: '하루 2회 운동 또는 강도 높은 육체노동', factor: 1.9 }
]

/**
 * Mifflin-St Jeor 공식으로 BMR 계산
 */
function calculateBMR(weight, height, age, gender) {
  // 체중(kg), 키(cm), 나이(세)
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161
  }
}

/**
 * TDEE 계산 (BMR × 활동계수)
 */
function calculateTDEE(bmr, activityLevel) {
  const level = ACTIVITY_LEVELS.find(l => l.id === activityLevel)
  return Math.round(bmr * (level?.factor || 1.2))
}

/**
 * 칼로리에 따른 식사 분량 계산
 */
export function calculateMealPortions(tdee, goal = 'maintain') {
  // 목표에 따른 칼로리 조정
  let targetCalories = tdee
  if (goal === 'lose') targetCalories = tdee - 500
  if (goal === 'gain') targetCalories = tdee + 300

  // 식사별 칼로리 배분 (아침 25%, 점심 35%, 저녁 30%, 간식 10%)
  const mealCalories = {
    breakfast: Math.round(targetCalories * 0.25),
    lunch: Math.round(targetCalories * 0.35),
    dinner: Math.round(targetCalories * 0.30),
    snacks: Math.round(targetCalories * 0.10)
  }

  // 음식별 대략적인 분량 계산 (칼로리 기준)
  const portions = {
    // 단백질 (100g당 약 200kcal 기준)
    protein: {
      breakfast: `${Math.round(mealCalories.breakfast * 0.3 / 2)}g`,
      lunch: `${Math.round(mealCalories.lunch * 0.3 / 2)}g`,
      dinner: `${Math.round(mealCalories.dinner * 0.3 / 2)}g`
    },
    // 탄수화물 - 밥 (1공기 약 300kcal)
    rice: {
      breakfast: mealCalories.breakfast * 0.4 > 200 ? '1공기' : '1/2공기',
      lunch: mealCalories.lunch * 0.4 > 250 ? '1공기' : '2/3공기',
      dinner: mealCalories.dinner * 0.4 > 200 ? '2/3공기' : '1/2공기'
    },
    // 채소 (무제한이지만 최소 권장량)
    vegetables: {
      breakfast: '1컵',
      lunch: '2컵',
      dinner: '2컵'
    },
    // 간식 칼로리
    snackCalories: mealCalories.snacks
  }

  return {
    targetCalories,
    mealCalories,
    portions,
    summary: {
      level: targetCalories < 1500 ? 'low' : targetCalories < 2000 ? 'moderate' : 'high',
      description: targetCalories < 1500
        ? '소식 기준 (체중 감량에 적합)'
        : targetCalories < 2000
          ? '보통 식사량'
          : '넉넉한 식사량 (활동량 많음)'
    }
  }
}

export default function TDEESurvey({ onComplete, initialData = null }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    height: initialData?.height || '',
    weight: initialData?.weight || '',
    age: initialData?.age || '',
    gender: initialData?.gender || '',
    activityLevel: initialData?.activityLevel || ''
  })
  const [result, setResult] = useState(null)

  const steps = [
    { key: 'gender', label: '성별', icon: User },
    { key: 'age', label: '나이', icon: Calendar },
    { key: 'height', label: '키', icon: Ruler },
    { key: 'weight', label: '체중', icon: Scale },
    { key: 'activityLevel', label: '활동량', icon: Activity }
  ]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      // 계산 수행
      const bmr = calculateBMR(
        parseFloat(data.weight),
        parseFloat(data.height),
        parseInt(data.age),
        data.gender
      )
      const tdee = calculateTDEE(bmr, data.activityLevel)
      const portions = calculateMealPortions(tdee)

      const resultData = {
        ...data,
        bmr: Math.round(bmr),
        tdee,
        portions
      }

      setResult(resultData)
    }
  }

  const handleComplete = () => {
    if (onComplete && result) {
      onComplete(result)
    }
  }

  const isStepValid = () => {
    const key = steps[step].key
    return data[key] !== ''
  }

  // 결과 화면
  if (result) {
    return (
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardContent className="p-5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calculator className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">맞춤 칼로리 분석 완료</h3>
          </div>

          <div className="space-y-4">
            {/* 일일 필요 칼로리 */}
            <div className="p-4 bg-white rounded-xl border border-emerald-100">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">일일 필요 칼로리 (TDEE)</p>
                <p className="text-3xl font-bold text-emerald-600">{result.tdee.toLocaleString()} kcal</p>
                <p className="text-xs text-gray-400 mt-1">기초대사량: {result.bmr.toLocaleString()} kcal</p>
              </div>
            </div>

            {/* 식사별 권장 칼로리 */}
            <div className="p-4 bg-white rounded-xl border border-emerald-100">
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-500" />
                식사별 권장 칼로리
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <p className="text-xs text-gray-500">아침</p>
                  <p className="text-sm font-semibold text-amber-700">{result.portions.mealCalories.breakfast}</p>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-gray-500">점심</p>
                  <p className="text-sm font-semibold text-yellow-700">{result.portions.mealCalories.lunch}</p>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <p className="text-xs text-gray-500">저녁</p>
                  <p className="text-sm font-semibold text-indigo-700">{result.portions.mealCalories.dinner}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-500">간식</p>
                  <p className="text-sm font-semibold text-green-700">{result.portions.mealCalories.snacks}</p>
                </div>
              </div>
            </div>

            {/* 권장 분량 요약 */}
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-sm text-emerald-700">
                <span className="font-medium">{result.portions.summary.description}</span>
                <br />
                <span className="text-xs text-emerald-600">
                  단백질 1회 약 {result.portions.portions.protein.lunch}, 밥 {result.portions.portions.rice.lunch} 기준
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="w-full mt-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            맞춤 식단 적용하기
          </button>
        </CardContent>
      </Card>
    )
  }

  // 설문 화면
  return (
    <Card className="border-violet-200">
      <CardContent className="p-5">
        {/* 프로그레스 */}
        <div className="flex gap-1 mb-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                idx <= step ? 'bg-violet-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* 현재 단계 */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
            {(() => {
              const Icon = steps[step].icon
              return <Icon className="w-6 h-6 text-violet-600" />
            })()}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{steps[step].label}</h3>
          <p className="text-sm text-gray-500 mt-1">맞춤 식단을 위해 입력해주세요</p>
        </div>

        {/* 입력 필드 */}
        <div className="mb-6">
          {/* 성별 */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'male', label: '남성' },
                { id: 'female', label: '여성' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => setData({ ...data, gender: option.id })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    data.gender === option.id
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`font-medium ${
                    data.gender === option.id ? 'text-violet-700' : 'text-gray-700'
                  }`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 나이 */}
          {step === 1 && (
            <div className="flex items-center justify-center gap-3">
              <input
                type="number"
                value={data.age}
                onChange={(e) => setData({ ...data, age: e.target.value })}
                placeholder="30"
                className="w-24 text-center text-2xl font-bold p-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:outline-none"
                min="10"
                max="100"
              />
              <span className="text-lg text-gray-500">세</span>
            </div>
          )}

          {/* 키 */}
          {step === 2 && (
            <div className="flex items-center justify-center gap-3">
              <input
                type="number"
                value={data.height}
                onChange={(e) => setData({ ...data, height: e.target.value })}
                placeholder="170"
                className="w-24 text-center text-2xl font-bold p-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:outline-none"
                min="100"
                max="250"
              />
              <span className="text-lg text-gray-500">cm</span>
            </div>
          )}

          {/* 체중 */}
          {step === 3 && (
            <div className="flex items-center justify-center gap-3">
              <input
                type="number"
                value={data.weight}
                onChange={(e) => setData({ ...data, weight: e.target.value })}
                placeholder="65"
                className="w-24 text-center text-2xl font-bold p-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:outline-none"
                min="30"
                max="200"
              />
              <span className="text-lg text-gray-500">kg</span>
            </div>
          )}

          {/* 활동량 */}
          {step === 4 && (
            <div className="space-y-2">
              {ACTIVITY_LEVELS.map(level => (
                <button
                  key={level.id}
                  onClick={() => setData({ ...data, activityLevel: level.id })}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    data.activityLevel === level.id
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`font-medium ${
                    data.activityLevel === level.id ? 'text-violet-700' : 'text-gray-700'
                  }`}>
                    {level.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">{level.desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 다음 버튼 */}
        <button
          onClick={handleNext}
          disabled={!isStepValid()}
          className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
            isStepValid()
              ? 'bg-violet-500 hover:bg-violet-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {step < steps.length - 1 ? (
            <>
              다음
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5" />
              계산하기
            </>
          )}
        </button>
      </CardContent>
    </Card>
  )
}
