import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Button } from '../components/common/Button'
import { Card, CardContent } from '../components/common/Card'
import {
  ADHD_TYPES,
  analyzeADHDType,
  analyzeCoachingPriorities
} from '../data/coachData'
import {
  Brain, Zap, AlertTriangle, Layers, Target, TrendingUp,
  ArrowRight, ArrowLeft, CheckCircle, Lightbulb, Sparkles
} from 'lucide-react'

const TYPE_ICONS = {
  inattention: Brain,
  hyperactivity: Zap,
  impulsivity: AlertTriangle,
  combined: Layers
}

const TYPE_COLORS = {
  inattention: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  hyperactivity: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
  impulsivity: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
  combined: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' }
}

const STEPS = [
  { id: 'intro', label: '분석 완료' },
  { id: 'adhd-type', label: 'ADHD 유형' },
  { id: 'weak-areas', label: '코칭 필요 영역' },
  { id: 'strategy', label: '코칭 전략' }
]

export function AnalysisResultPage() {
  const navigate = useNavigate()
  const { user, asrsResult, preSurvey } = useStore()
  const [currentStep, setCurrentStep] = useState(0)

  // 분석 결과 계산
  const adhdTypeResult = useMemo(() => {
    if (!asrsResult) return null
    return analyzeADHDType(asrsResult)
  }, [asrsResult])

  const coachingPriorities = useMemo(() => {
    if (!preSurvey?.categoryScores) return []
    return analyzeCoachingPriorities(preSurvey.categoryScores)
  }, [preSurvey])

  const primaryType = adhdTypeResult?.primaryType
  const typeInfo = primaryType ? ADHD_TYPES[primaryType] : null
  const TypeIcon = primaryType ? TYPE_ICONS[primaryType] : Brain
  const typeColors = primaryType ? TYPE_COLORS[primaryType] : TYPE_COLORS.combined

  // 상위 2개 약점 영역
  const weakAreas = coachingPriorities.slice(0, 2)

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSelectCoach = () => {
    navigate('/select-coach')
  }

  if (!asrsResult || !preSurvey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">분석 결과가 없습니다</h2>
            <p className="text-gray-600 mb-6">설문과 자가진단을 먼저 완료해주세요.</p>
            <Button onClick={() => navigate('/onboarding')} className="w-full">
              설문 시작하기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isLastStep = currentStep === STEPS.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 진행 표시 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-500">
              {currentStep + 1} / {STEPS.length}
            </span>
            <span className="text-sm font-medium text-emerald-600">
              {STEPS[currentStep].label}
            </span>
          </div>
          <div className="flex gap-2">
            {STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  idx <= currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 0: 인트로 */}
        {currentStep === 0 && (
          <div className="text-center py-12 animate-fadeIn">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-green-600" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
              <CheckCircle className="w-4 h-4" />
              분석 완료
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {user?.name || '회원'}님의 분석이 완료되었습니다
            </h1>
            <p className="text-gray-600 leading-relaxed">
              설문과 자가진단 결과를 바탕으로<br />
              맞춤 코칭 방향을 제안해드릴게요.
            </p>
          </div>
        )}

        {/* Step 1: ADHD 유형 카드 */}
        {currentStep === 1 && (
          <Card className="animate-fadeIn">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Brain className="w-4 h-4" />
                ADHD 유형 분석
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className={`w-20 h-20 rounded-2xl ${typeColors.bg} flex items-center justify-center flex-shrink-0`}>
                  <TypeIcon className={`w-10 h-10 ${typeColors.text}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {typeInfo?.name || 'ADHD 특성'}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {typeInfo?.description}
                  </p>
                </div>
              </div>

              {/* 점수 시각화 */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                {[
                  { label: '주의력', value: asrsResult.inattentionScore, max: 36, color: 'purple' },
                  { label: '과잉행동', value: asrsResult.hyperactivityScore, max: 20, color: 'orange' },
                  { label: '충동성', value: asrsResult.impulsivityScore, max: 16, color: 'red' }
                ].map(item => (
                  <div key={item.label} className="text-center p-2 md:p-4 bg-gray-50 rounded-xl">
                    <div className={`text-2xl md:text-3xl font-bold text-${item.color}-600`}>
                      {item.value}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 mt-1">{item.label}</div>
                    <div className="mt-2 md:mt-3 h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${item.color}-500 rounded-full transition-all duration-500`}
                        style={{ width: `${(item.value / item.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 주요 특징 */}
              <div className={`p-5 rounded-xl ${typeColors.bg} ${typeColors.border} border`}>
                <h3 className="font-semibold text-gray-900 mb-3">주요 특징</h3>
                <ul className="space-y-2">
                  {typeInfo?.characteristics.slice(0, 4).map((char, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <CheckCircle className={`w-4 h-4 ${typeColors.text} mt-0.5 flex-shrink-0`} />
                      {char}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: 코칭 필요 영역 */}
        {currentStep === 2 && (
          <Card className="animate-fadeIn">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Target className="w-4 h-4" />
                코칭이 필요한 영역
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  집중해서 개선할 영역
                </h2>
                <p className="text-gray-500 text-sm">
                  설문 결과 중 가장 낮은 점수를 받은 영역입니다
                </p>
              </div>

              <div className="space-y-4">
                {weakAreas.map((area, idx) => (
                  <div
                    key={area.id}
                    className={`p-5 rounded-xl border-2 ${
                      idx === 0 ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700'
                        }`}>
                          {idx + 1}순위
                        </span>
                        <span className="font-bold text-gray-900 text-lg">{area.name}</span>
                      </div>
                      <span className={`text-lg font-bold ${
                        idx === 0 ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {area.score.toFixed(1)} / 5
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{area.lowScoreMessage}</p>
                    <div className="flex flex-wrap gap-2">
                      {area.tips?.map((tip, tipIdx) => (
                        <span
                          key={tipIdx}
                          className="px-3 py-1.5 bg-white rounded-lg text-sm text-gray-700 shadow-sm"
                        >
                          {tip}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: 코칭 방향 제안 */}
        {currentStep === 3 && (
          <Card className="animate-fadeIn">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Lightbulb className="w-4 h-4" />
                추천 코칭 방향
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {user?.name || '회원'}님을 위한 맞춤 코칭 전략
                </h2>
                <p className="text-gray-500 text-sm">
                  분석 결과를 바탕으로 제안드리는 코칭 방향입니다
                </p>
              </div>

              <div className="space-y-4">
                {/* 전략 1 */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{typeInfo?.name} 대처 전략</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{typeInfo?.coachingDirection}</p>
                    </div>
                  </div>
                </div>

                {/* 전략 2 */}
                {weakAreas[0] && (
                  <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{weakAreas[0].name} 강화</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{weakAreas[0].direction}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 전략 3 */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">추천 실행 과제</h4>
                      <ul className="space-y-1.5 mt-2">
                        {typeInfo?.recommendedActions.slice(0, 3).map((action, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 코치 선택 안내 */}
              <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <p className="text-gray-600 mb-1">
                  이제 코칭을 시작해볼까요?
                </p>
                <p className="text-sm text-gray-500">
                  분석 결과를 바탕으로 맞춤 코칭을 준비해드릴게요.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 네비게이션 버튼 */}
        <div className="mt-8 flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전
            </Button>
          )}

          {isLastStep ? (
            <Button onClick={handleSelectCoach} className="flex-1" size="lg">
              코칭 시작하기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleNext} className="flex-1" size="lg">
              다음
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}
