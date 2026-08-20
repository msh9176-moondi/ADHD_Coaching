/**
 * 코치용 피코치 울트라마인드 상세 보기
 * 검사 결과, 처방, 진행 현황을 확인할 수 있음
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import {
  Brain, Target, Utensils, Pill, TrendingUp, Calendar,
  AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp,
  Sparkles, Scale, Activity, Heart, Zap, Shield, Flame,
  Bug, Frown, Skull
} from 'lucide-react'

// 카테고리 아이콘 매핑
const CATEGORY_ICONS = {
  neurotransmitter: Brain,
  energy: Zap,
  gut: Bug,
  detox: Shield,
  inflammation: Flame,
  mood: Heart,
  stress: Frown,
  hormone: Activity,
  nutrition: Utensils,
  lifestyle: Target
}

const CATEGORY_LABELS = {
  neurotransmitter: '신경전달물질',
  energy: '에너지/미토콘드리아',
  gut: '장 건강',
  detox: '해독',
  inflammation: '염증',
  mood: '기분/감정',
  stress: '스트레스',
  hormone: '호르몬',
  nutrition: '영양',
  lifestyle: '생활습관'
}

export function CoacheeUltramindView({ coacheeId, coacheeName }) {
  const [loading, setLoading] = useState(true)
  const [program, setProgram] = useState(null)
  const [expandedSection, setExpandedSection] = useState('results')

  useEffect(() => {
    if (coacheeId) {
      loadUltramindData()
    }
  }, [coacheeId])

  const loadUltramindData = async () => {
    try {
      let programData = null

      // localStorage 확인
      const localProgram = localStorage.getItem(`ultramind_program_${coacheeId}`)
      if (localProgram) {
        try {
          programData = JSON.parse(localProgram)
        } catch (e) {}
      }

      // Supabase 확인
      if (!programData && isSupabaseConfigured()) {
        const { data } = await supabase
          .from('ultramind_programs')
          .select('*')
          .eq('user_id', coacheeId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data) {
          programData = data
        }
      }

      setProgram(programData)
    } catch (err) {
      console.error('울트라마인드 데이터 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-100 rounded w-1/3" />
            <div className="h-32 bg-gray-100 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!program) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-700 mb-1">울트라마인드 미시작</h3>
          <p className="text-sm text-gray-500">
            {coacheeName}님이 아직 울트라마인드 프로그램을 시작하지 않았습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  const programData = program.program_data || {}
  const prescriptions = program.prescriptions || []
  const tdeeData = programData.tdeeData
  const mealPlan = programData.mealPlan || {}

  // 현재 주차 계산
  const startDate = new Date(program.start_date)
  const now = new Date()
  const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24))
  const currentWeek = Math.min(Math.floor(daysSinceStart / 7) + 1, 6)

  // 진행률 계산
  const endDate = new Date(program.end_date)
  const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24)
  const progress = Math.min(Math.round((daysSinceStart / totalDays) * 100), 100)

  // 처방을 카테고리별로 그룹화
  const groupedPrescriptions = prescriptions.reduce((acc, rx) => {
    const category = rx.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(rx)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* 진행 현황 요약 */}
      <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-600" />
              <span className="font-semibold text-gray-800">Ultra Mind 프로그램</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              program.status === 'active'
                ? 'bg-violet-100 text-violet-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {program.status === 'active' ? '진행 중' : '완료'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-violet-600">{currentWeek}</p>
              <p className="text-xs text-gray-500">현재 주차</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{prescriptions.length}</p>
              <p className="text-xs text-gray-500">처방 항목</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{progress}%</p>
              <p className="text-xs text-gray-500">진행률</p>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{startDate.toLocaleDateString('ko-KR')}</span>
            <span>{endDate.toLocaleDateString('ko-KR')}</span>
          </div>
        </CardContent>
      </Card>

      {/* TDEE 정보 */}
      {tdeeData && (
        <Card className="border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-500" />
              신체 정보 & 칼로리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InfoItem label="키" value={`${tdeeData.height}cm`} />
              <InfoItem label="체중" value={`${tdeeData.weight}kg`} />
              <InfoItem label="나이" value={`${tdeeData.age}세`} />
              <InfoItem label="일일 칼로리" value={`${tdeeData.tdee}kcal`} highlight />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 검사 결과 (처방) */}
      <Card>
        <button
          onClick={() => setExpandedSection(expandedSection === 'results' ? null : 'results')}
          className="w-full"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" />
                검사 결과 & AI 처방 ({prescriptions.length}개)
              </CardTitle>
              {expandedSection === 'results' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </CardHeader>
        </button>

        {expandedSection === 'results' && (
          <CardContent className="pt-0 space-y-3">
            {Object.entries(groupedPrescriptions).map(([category, items]) => {
              const Icon = CATEGORY_ICONS[category] || Brain
              const label = CATEGORY_LABELS[category] || category

              return (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <div className="p-3 bg-gray-50 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className="text-xs text-gray-500">({items.length})</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {items.map((rx, idx) => (
                      <PrescriptionItem key={idx} prescription={rx} />
                    ))}
                  </div>
                </div>
              )
            })}
          </CardContent>
        )}
      </Card>

      {/* 식단 계획 */}
      {mealPlan.meals && (
        <Card>
          <button
            onClick={() => setExpandedSection(expandedSection === 'meals' ? null : 'meals')}
            className="w-full"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-500" />
                  맞춤 식단
                </CardTitle>
                {expandedSection === 'meals' ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </CardHeader>
          </button>

          {expandedSection === 'meals' && (
            <CardContent className="pt-0 space-y-2">
              {Object.entries(mealPlan.meals).map(([key, meal]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{meal.title}</span>
                    {meal.calories && (
                      <span className="text-xs text-emerald-600">{meal.calories}kcal</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{meal.mainDish}</p>
                  {meal.sideDish && (
                    <p className="text-xs text-gray-500">{meal.sideDish}</p>
                  )}
                </div>
              ))}

              {/* 피해야 할 음식 */}
              {mealPlan.avoidFoods?.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs font-medium text-red-700 mb-1">피해야 할 음식</p>
                  <p className="text-xs text-red-600">{mealPlan.avoidFoods.join(', ')}</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* 보충제 계획 */}
      {programData.supplementSchedule && (
        <Card>
          <button
            onClick={() => setExpandedSection(expandedSection === 'supplements' ? null : 'supplements')}
            className="w-full"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Pill className="w-4 h-4 text-blue-500" />
                  보충제 스케줄
                </CardTitle>
                {expandedSection === 'supplements' ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </CardHeader>
          </button>

          {expandedSection === 'supplements' && (
            <CardContent className="pt-0 space-y-2">
              {Object.entries(programData.supplementSchedule).map(([time, schedule]) => (
                schedule.items?.length > 0 && (
                  <div key={time} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 mb-1">{schedule.time}</p>
                    <div className="space-y-1">
                      {schedule.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="text-blue-600">{item.dosage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}

// 정보 항목 컴포넌트
function InfoItem({ label, value, highlight = false }) {
  return (
    <div className={`p-2 rounded-lg ${highlight ? 'bg-emerald-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-emerald-600' : 'text-gray-700'}`}>
        {value}
      </p>
    </div>
  )
}

// 처방 항목 컴포넌트
function PrescriptionItem({ prescription }) {
  const severityColors = {
    high: 'border-l-red-500 bg-red-50',
    moderate: 'border-l-amber-500 bg-amber-50',
    low: 'border-l-green-500 bg-green-50'
  }

  const severityLabels = {
    high: '심각',
    moderate: '주의',
    low: '양호'
  }

  return (
    <div className={`p-2 border-l-4 rounded-r-lg ${severityColors[prescription.severity] || 'border-l-gray-300 bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">
          {prescription.checklistName || prescription.checklistId}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${
          prescription.severity === 'high' ? 'bg-red-100 text-red-700' :
          prescription.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
          'bg-green-100 text-green-700'
        }`}>
          {severityLabels[prescription.severity] || prescription.severity}
        </span>
      </div>
      <p className="text-xs text-gray-600">
        점수: {prescription.score}/{prescription.maxScore} ({prescription.percentage}%)
      </p>
      {prescription.recommendations?.diet && (
        <p className="text-xs text-gray-500 mt-1">
          권장: {prescription.recommendations.diet.slice(0, 3).join(', ')}
        </p>
      )}
    </div>
  )
}

export default CoacheeUltramindView
