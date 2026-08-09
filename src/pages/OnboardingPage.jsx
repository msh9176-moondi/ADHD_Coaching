import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Button } from '../components/common/Button'
import { Card, CardContent } from '../components/common/Card'
import {
  SURVEY_CATEGORIES,
  ASRS_QUESTIONS,
  ASRS_OPTIONS,
  calcCategoryScores,
  calcASRSScores
} from '../data/surveyData'
import { saveASRSResult, saveSurveyResult } from '../lib/surveyService'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  ArrowRight, ArrowLeft, Check, Brain, ClipboardList,
  Zap, RefreshCw, Clock, Star, Compass, Sparkles
} from 'lucide-react'

const ICONS = { Zap, RefreshCw, Clock, Star, Compass }

const SCALE_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, setSurveyResult, setASRSResult, setOnboardingStatus } = useStore()

  // 단계: intro -> survey -> asrs -> complete
  const [phase, setPhase] = useState('intro')
  const [surveyAnswers, setSurveyAnswers] = useState({})
  const [asrsAnswers, setAsrsAnswers] = useState({})
  const [currentAsrsQuestion, setCurrentAsrsQuestion] = useState(0)

  const allSurveyQuestions = useMemo(() =>
    SURVEY_CATEGORIES.flatMap(c => c.questions), []
  )
  const totalSurveyQuestions = allSurveyQuestions.length
  const surveyAnsweredCount = Object.keys(surveyAnswers).length
  const surveyProgress = (surveyAnsweredCount / totalSurveyQuestions) * 100
  const canSubmitSurvey = surveyAnsweredCount >= totalSurveyQuestions

  const totalAsrsQuestions = ASRS_QUESTIONS.length
  const asrsProgress = ((currentAsrsQuestion + 1) / totalAsrsQuestions) * 100
  const currentAsrsQ = ASRS_QUESTIONS[currentAsrsQuestion]

  // 설문 응답
  const handleSurveySelect = (questionId, value) => {
    setSurveyAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  // ASRS 응답
  const handleAsrsSelect = (value) => {
    setAsrsAnswers(prev => ({ ...prev, [currentAsrsQ.id]: value }))
  }

  const handleAsrsNext = () => {
    if (currentAsrsQuestion < totalAsrsQuestions - 1) {
      setCurrentAsrsQuestion(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleAsrsBack = () => {
    if (currentAsrsQuestion > 0) {
      setCurrentAsrsQuestion(prev => prev - 1)
    }
  }

  const handleSurveyComplete = async () => {
    const categoryScores = calcCategoryScores(surveyAnswers)
    const surveyData = {
      type: 'pre',
      answers: surveyAnswers,
      categoryScores,
      totalScore: categoryScores.total,
      completedAt: new Date().toISOString()
    }

    // 로컬 스토어에 저장
    setSurveyResult('pre', surveyData)

    // Supabase에 저장
    if (isSupabaseConfigured() && user?.id) {
      try {
        await saveSurveyResult(user.id, 'pre', surveyData)
        console.log('사전설문 Supabase 저장 완료')
      } catch (err) {
        console.error('사전설문 저장 실패:', err)
      }
    }

    setPhase('asrs')
  }

  const handleComplete = async () => {
    const asrsScores = calcASRSScores(asrsAnswers, 'full')
    const asrsData = {
      ...asrsScores,
      testMode: 'full',
      answers: asrsAnswers,
      completedAt: new Date().toISOString()
    }

    // 로컬 스토어에 저장
    setASRSResult(asrsData)

    // Supabase에 저장
    if (isSupabaseConfigured() && user?.id) {
      try {
        await saveASRSResult(user.id, asrsData)
        console.log('ASRS 결과 Supabase 저장 완료')
      } catch (err) {
        console.error('ASRS 결과 저장 실패:', err)
      }
    }

    setOnboardingStatus({
      step: 'result',
      completed: false  // 코치 선택 후 완료 처리
    })

    setPhase('complete')
  }

  const goToAnalysis = () => {
    navigate('/analysis')
  }

  // ===== 인트로 화면 =====
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="mb-6 md:mb-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">
              {user?.name || '회원'}님, 환영합니다!
            </h1>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              코칭을 시작하기 전에<br />
              지금의 상태를 파악하는 시간을 가질게요.
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">코칭 설문</h3>
                    <p className="text-sm text-gray-500">5개 영역, 15문항</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Brain className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">ADHD 자가진단</h3>
                    <p className="text-sm text-gray-500">WHO ASRS 기반, 18문항</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  약 5~10분 정도 소요되며,<br />
                  솔직하게 응답해주시면 됩니다.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => setPhase('survey')} className="w-full" size="lg">
            시작하기
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // ===== 설문 화면 =====
  if (phase === 'survey') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">코칭 설문</h1>
                <p className="text-sm text-gray-500">지금 나의 상태를 솔직하게 기록해주세요</p>
              </div>
            </div>

            {/* 진행률 */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">진행률</span>
                <span className="text-sm font-bold text-purple-600">
                  {surveyAnsweredCount} / {totalSurveyQuestions}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${surveyProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* 카테고리별 질문 */}
          <div className="space-y-6">
            {SURVEY_CATEGORIES.map(category => {
              const Icon = ICONS[category.icon]
              return (
                <Card key={category.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-10 h-10 rounded-lg bg-${category.color}-100 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 text-${category.color}-600`} />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                    </div>

                    <div className="space-y-6">
                      {category.questions.map((q) => (
                        <div key={q.id} className="space-y-3">
                          <p className="text-gray-700">
                            <span className="text-sm font-medium text-gray-400 mr-2">
                              {allSurveyQuestions.findIndex(aq => aq.id === q.id) + 1}.
                            </span>
                            {q.text}
                          </p>

                          <div className="flex gap-1.5 md:gap-2">
                            {SCALE_OPTIONS.map(option => {
                              const isSelected = surveyAnswers[q.id] === option.value
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => handleSurveySelect(q.id, option.value)}
                                  className={`flex-1 py-2.5 md:py-3 rounded-lg border-2 text-sm md:text-base font-medium transition-all ${
                                    isSelected
                                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                  }`}
                                >
                                  {option.value}
                                </button>
                              )
                            })}
                          </div>

                          <div className="flex justify-between text-xs text-gray-400">
                            <span>전혀 그렇지 않다</span>
                            <span>매우 그렇다</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 다음 버튼 */}
          <div className="mt-8 pb-8">
            <Button
              onClick={handleSurveyComplete}
              disabled={!canSubmitSurvey}
              className="w-full"
              size="lg"
            >
              {canSubmitSurvey ? (
                <>
                  다음: ADHD 자가진단
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                `${totalSurveyQuestions - surveyAnsweredCount}개 문항 남음`
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ===== ASRS 진단 화면 =====
  if (phase === 'asrs') {
    const canProceed = asrsAnswers[currentAsrsQ?.id] !== undefined

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-xl mx-auto">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ADHD 자가진단</h1>
                <p className="text-sm text-gray-500">WHO ASRS 기반</p>
              </div>
            </div>

            {/* 진행률 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>{currentAsrsQuestion + 1} / {totalAsrsQuestions}</span>
                <span>{Math.round(asrsProgress)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${asrsProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* 뒤로가기 */}
          {currentAsrsQuestion > 0 && (
            <button
              onClick={handleAsrsBack}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </button>
          )}

          <Card>
            <CardContent className="p-6 space-y-6">
              {/* 질문 번호 */}
              <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-sm font-medium rounded-lg">
                Q{currentAsrsQuestion + 1}
              </span>

              {/* 질문 */}
              <h2 className="text-lg font-semibold text-gray-900 leading-relaxed">
                {currentAsrsQ.text}
              </h2>

              <p className="text-sm text-gray-500">
                지난 6개월 동안을 기준으로 답해주세요
              </p>

              {/* 선택지 */}
              <div className="space-y-3">
                {ASRS_OPTIONS.map((option) => {
                  const isSelected = asrsAnswers[currentAsrsQ.id] === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAsrsSelect(option.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <span className="w-2 h-2 bg-white rounded-full" />}
                      </span>
                      <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* 다음 버튼 */}
              <Button onClick={handleAsrsNext} disabled={!canProceed} className="w-full">
                {currentAsrsQuestion === totalAsrsQuestions - 1 ? (
                  <>결과 확인하기</>
                ) : (
                  <>다음 <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ===== 완료 화면 =====
  if (phase === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            설문이 완료되었습니다!
          </h1>
          <p className="text-gray-600 mb-8">
            이제 결과를 분석하고<br />
            {user?.name || '회원'}님에게 맞는 코칭 방향을 제안해드릴게요.
          </p>

          <Button onClick={goToAnalysis} className="w-full" size="lg">
            결과 확인하기
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return null
}
