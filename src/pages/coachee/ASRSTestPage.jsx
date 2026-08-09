import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { Button } from '../../components/common/Button'
import { Card, CardContent } from '../../components/common/Card'
import { ASRS_QUESTIONS, ASRS_OPTIONS, calcASRSScores } from '../../data/surveyData'
import { saveASRSResult } from '../../lib/surveyService'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  ArrowLeft, ArrowRight, Check, AlertTriangle, CheckCircle,
  Brain, Activity, Zap, FileText, RotateCcw
} from 'lucide-react'

export function ASRSTestPage() {
  const navigate = useNavigate()
  const { user, setASRSResult } = useStore()
  const [isSaving, setIsSaving] = useState(false)

  const [page, setPage] = useState('start') // start, question, analyzing, result
  const [testMode, setTestMode] = useState(null) // quick, full
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})

  const questionsToUse = testMode === 'quick' ? ASRS_QUESTIONS.slice(0, 6) : ASRS_QUESTIONS
  const totalQuestions = questionsToUse.length
  const progress = ((currentQuestion + 1) / totalQuestions) * 100
  const currentQ = questionsToUse[currentQuestion]
  const canProceed = answers[currentQ?.id] !== undefined

  const startTest = (mode) => {
    setTestMode(mode)
    setCurrentQuestion(0)
    setAnswers({})
    setPage('question')
  }

  const handleSelect = (value) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }))
  }

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      setPage('analyzing')
      setTimeout(() => setPage('result'), 2000)
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleReset = () => {
    setPage('start')
    setTestMode(null)
    setCurrentQuestion(0)
    setAnswers({})
  }

  const handleSaveAndClose = async () => {
    console.log('========== handleSaveAndClose 호출됨 ==========')

    const scores = calcASRSScores(answers, testMode)
    const resultData = {
      ...scores,
      testMode,
      answers,
      completedAt: new Date().toISOString()
    }

    // 로컬 스토어에 저장
    setASRSResult(resultData)

    // Supabase에 저장
    console.log('=== ASRS 저장 시도 ===')
    console.log('isSupabaseConfigured:', isSupabaseConfigured())
    console.log('user:', user)
    console.log('user.id:', user?.id)
    console.log('resultData:', resultData)

    if (isSupabaseConfigured() && user?.id) {
      setIsSaving(true)
      try {
        const savedData = await saveASRSResult(user.id, resultData)
        console.log('ASRS 결과 Supabase 저장 성공:', savedData)
      } catch (err) {
        console.error('ASRS 결과 저장 실패:', err)
        // 저장 실패해도 계속 진행 (로컬에는 저장됨)
      } finally {
        setIsSaving(false)
      }
    } else {
      console.log('Supabase 저장 건너뜀 - 설정 안됨 또는 user.id 없음')
    }

    navigate('/coachee')
  }

  // 시작 화면
  if (page === 'start') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
            <Brain className="w-4 h-4" />
            WHO ASRS 기반
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            성인 ADHD 자가진단
          </h1>
          <p className="text-gray-600">
            세계보건기구(WHO)에서 개발한<br />
            성인 ADHD 자가보고 척도입니다.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              검사 안내
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                의학적 진단을 대체하지 않습니다
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                지난 6개월간의 경험을 바탕으로 답해주세요
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                정답이 없으니 솔직하게 응답해주세요
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button onClick={() => startTest('quick')} className="w-full" size="lg">
            <Zap className="w-4 h-4 mr-2" />
            간편 검사 (6문항)
          </Button>
          <Button onClick={() => startTest('full')} variant="outline" className="w-full" size="lg">
            전체 검사 (18문항)
          </Button>
        </div>
      </div>
    )
  }

  // 질문 화면
  if (page === 'question') {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        {/* 진행률 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{currentQuestion + 1} / {totalQuestions}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 뒤로가기 */}
        <button
          onClick={currentQuestion > 0 ? handleBack : () => setPage('start')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentQuestion > 0 ? '이전' : '처음으로'}
        </button>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* 질문 번호 */}
            <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-sm font-medium rounded-lg">
              Q{currentQuestion + 1}
            </span>

            {/* 질문 */}
            <h2 className="text-lg font-semibold text-gray-900 leading-relaxed">
              {currentQ.text}
            </h2>

            <p className="text-sm text-gray-500">
              지난 6개월 동안을 기준으로 답해주세요
            </p>

            {/* 선택지 */}
            <div className="space-y-3">
              {ASRS_OPTIONS.map((option) => {
                const isSelected = answers[currentQ.id] === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
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
            <Button onClick={handleNext} disabled={!canProceed} className="w-full">
              {currentQuestion === totalQuestions - 1 ? (
                <>결과 보기</>
              ) : (
                <>다음 <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 분석 중 화면
  if (page === 'analyzing') {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              응답을 분석하고 있어요
            </h2>
            <p className="text-gray-600">
              이 검사는 진단이 아닌 선별 도구입니다.<br />
              정확한 진단을 위해서는 전문가 상담을 권장드립니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 결과 화면
  if (page === 'result') {
    const scores = calcASRSScores(answers, testMode)

    const levelConfig = {
      high: {
        color: 'red',
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        label: '높은 가능성',
        Icon: AlertTriangle
      },
      medium: {
        color: 'amber',
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: '중간 가능성',
        Icon: Activity
      },
      low: {
        color: 'green',
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        label: '낮은 가능성',
        Icon: CheckCircle
      }
    }

    const config = levelConfig[scores.level]
    const LevelIcon = config.Icon

    const conditionMessage = {
      high: '응답 결과, ADHD 특성이 일상생활에 상당한 영향을 미치고 있을 가능성이 있습니다. 이는 진단이 아니며, 정확한 평가를 위해 전문가 상담을 권장드립니다.',
      medium: '응답 결과, 일부 ADHD 특성이 나타나고 있습니다. 특정 상황에서 어려움을 느끼고 계신다면, 전문가와 상담해보시는 것도 도움이 될 수 있습니다.',
      low: '응답 결과, 현재 ADHD 특성이 크게 나타나지 않는 것으로 보입니다. 다만, 특정 상황에서 어려움을 느끼신다면 다른 원인이 있을 수 있으니 전문가와 상담해보세요.'
    }

    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* 결과 배지 */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} ${config.text}`}>
              <LevelIcon className="w-4 h-4" />
              <span className="font-semibold">{config.label}</span>
            </div>

            {/* 해석 */}
            <h1 className="text-2xl font-bold text-gray-900">
              {scores.interpretation}
            </h1>

            {/* 점수 */}
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <span className="text-5xl font-bold text-emerald-600">{scores.totalScore}</span>
              <span className="text-xl text-gray-400"> / {scores.maxScore}</span>
              <p className="text-sm text-gray-500 mt-2">
                총점 ({testMode === 'quick' ? '간편 검사' : '전체 검사'})
              </p>
            </div>

            {/* 설명 */}
            <div className={`p-4 rounded-xl ${config.bg} ${config.border} border`}>
              <p className={`text-sm ${config.text}`}>
                {conditionMessage[scores.level]}
              </p>
            </div>

            {/* 영역별 점수 (전체 검사인 경우) */}
            {testMode === 'full' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">영역별 점수</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">주의력 결핍</span>
                    <span className="font-semibold">{scores.inattentionScore}점</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">과잉행동</span>
                    <span className="font-semibold">{scores.hyperactivityScore}점</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">충동성</span>
                    <span className="font-semibold">{scores.impulsivityScore}점</span>
                  </div>
                </div>
              </div>
            )}

            {/* 주의사항 */}
            <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
              <h4 className="font-semibold text-amber-800 mb-1">중요 안내</h4>
              <p className="text-sm text-amber-700">
                이 검사는 의학적 진단을 대체하지 않습니다. 정확한 ADHD 진단은
                정신건강의학과 전문의의 종합적인 평가를 통해서만 가능합니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 버튼 */}
        <div className="space-y-3">
          <Button onClick={handleSaveAndClose} disabled={isSaving} className="w-full" size="lg">
            {isSaving ? '저장 중...' : '결과 저장하고 돌아가기'}
          </Button>
          <Button onClick={handleReset} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            다시 검사하기
          </Button>
        </div>

        {/* 하단 문구 */}
        <p className="text-center text-sm text-gray-500">
          이 결과는 당신을 판단하기 위한 것이 아니라,<br />
          더 나은 방법을 찾기 위한 출발점입니다.
        </p>
      </div>
    )
  }

  return null
}
