import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { Button } from '../../components/common/Button'
import { Card, CardContent } from '../../components/common/Card'
import { SURVEY_CATEGORIES, POST_SURVEY_EXTRA, calcCategoryScores } from '../../data/surveyData'
import { saveSurveyResult } from '../../lib/surveyService'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  Zap, RefreshCw, Clock, Star, Compass, Check, ArrowRight,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react'

const ICONS = {
  Zap, RefreshCw, Clock, Star, Compass
}

const SCALE_OPTIONS = [
  { value: 1, label: '1', desc: '전혀 그렇지 않다' },
  { value: 2, label: '2', desc: '그렇지 않다' },
  { value: 3, label: '3', desc: '보통이다' },
  { value: 4, label: '4', desc: '그렇다' },
  { value: 5, label: '5', desc: '매우 그렇다' },
]

export function SurveyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const surveyType = searchParams.get('type') || 'pre' // pre 또는 post

  const { user, setSurveyResult, preSurvey } = useStore()

  const [answers, setAnswers] = useState({})
  const [extraAnswers, setExtraAnswers] = useState({})
  const [openText, setOpenText] = useState({ bestPart: '', regret: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const allQuestions = useMemo(() =>
    SURVEY_CATEGORIES.flatMap(c => c.questions), []
  )
  const totalQuestions = allQuestions.length + (surveyType === 'post' ? POST_SURVEY_EXTRA.length : 0)
  const answeredCount = Object.keys(answers).length + (surveyType === 'post' ? Object.keys(extraAnswers).length : 0)
  const progress = (answeredCount / totalQuestions) * 100
  const canSubmit = answeredCount >= totalQuestions

  const handleSelect = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleExtraSelect = (questionId, value) => {
    setExtraAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    if (!canSubmit) return

    setIsSubmitting(true)

    const categoryScores = calcCategoryScores(answers)
    const result = {
      type: surveyType,
      answers,
      categoryScores,
      totalScore: categoryScores.total || 0,
      completedAt: new Date().toISOString()
    }

    if (surveyType === 'post') {
      result.extraAnswers = extraAnswers
      result.bestPart = openText.bestPart
      result.regret = openText.regret
    }

    // 로컬 스토어에 저장
    setSurveyResult(surveyType, result)

    // Supabase에 저장
    if (isSupabaseConfigured() && user?.id) {
      try {
        await saveSurveyResult(user.id, surveyType, result)
        console.log(`${surveyType} 설문 결과 Supabase 저장 성공`)
      } catch (err) {
        console.error('설문 결과 저장 실패:', err)
        // 저장 실패해도 계속 진행 (로컬에는 저장됨)
      }
    }

    setIsSubmitting(false)
    setIsComplete(true)
  }

  // 완료 화면
  if (isComplete) {
    const scores = calcCategoryScores(answers)

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {surveyType === 'pre' ? '사전 설문 완료!' : '사후 설문 완료!'}
          </h1>
          <p className="text-gray-600">
            {surveyType === 'pre'
              ? '설문이 저장되었습니다. 코칭이 끝나면 변화를 확인할 수 있어요.'
              : '코칭 전후 변화가 기록되었습니다.'}
          </p>
        </div>

        {/* 결과 요약 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">영역별 점수</h3>
            <div className="space-y-3">
              {SURVEY_CATEGORIES.map(cat => {
                const Icon = ICONS[cat.icon]
                const score = scores[cat.id]?.average || 0
                const preScore = surveyType === 'post' && preSurvey?.categoryScores?.[cat.id]?.average
                const diff = preScore ? score - preScore : null

                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-${cat.color}-100 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${cat.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{score.toFixed(1)}</span>
                          {diff !== null && (
                            <span className={`text-xs flex items-center gap-0.5 ${
                              diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'
                            }`}>
                              {diff > 0 ? <TrendingUp className="w-3 h-3" /> :
                               diff < 0 ? <TrendingDown className="w-3 h-3" /> :
                               <Minus className="w-3 h-3" />}
                              {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-${cat.color}-500 rounded-full transition-all`}
                          style={{ width: `${(score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="font-medium text-gray-700">전체 평균</span>
              <span className="text-xl font-bold text-blue-600">
                {scores.total?.toFixed(1) || '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => navigate('/coachee')} className="w-full" size="lg">
          대시보드로 돌아가기
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {surveyType === 'pre' ? '사전 설문' : '사후 설문'}
        </h1>
        <p className="text-gray-600">
          {surveyType === 'pre'
            ? '지금 나의 상태를 솔직하게 기록해주세요. 코칭 후 변화를 측정하는 데 사용됩니다.'
            : '코칭을 마친 지금, 나의 상태를 기록해주세요.'}
        </p>
      </div>

      {/* 진행률 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">진행률</span>
            <span className="text-sm font-bold text-blue-600">{answeredCount} / {totalQuestions}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            각 문항을 1점(전혀 그렇지 않다)~5점(매우 그렇다)으로 평가해주세요.
          </p>
        </CardContent>
      </Card>

      {/* 안내 */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-sm text-blue-700">
          <strong>설문 안내</strong><br />
          이 설문 결과는 자기보고식 참고 자료이며 의학적 판단 근거가 아닙니다.
          코칭 효과를 측정하기 위한 기초 데이터로만 활용됩니다.
        </p>
      </div>

      {/* 카테고리별 질문 */}
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
                {category.questions.map((q, idx) => (
                  <div key={q.id} className="space-y-3">
                    <p className="text-gray-700">
                      <span className="text-sm font-medium text-gray-400 mr-2">
                        {allQuestions.findIndex(aq => aq.id === q.id) + 1}.
                      </span>
                      {q.text}
                    </p>

                    <div className="flex gap-2">
                      {SCALE_OPTIONS.map(option => {
                        const isSelected = answers[q.id] === option.value
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleSelect(q.id, option.value)}
                            className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
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

      {/* 사후 설문 추가 질문 */}
      {surveyType === 'post' && (
        <>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">코칭 만족도</h2>

              <div className="space-y-6">
                {POST_SURVEY_EXTRA.map((q, idx) => (
                  <div key={q.id} className="space-y-3">
                    <p className="text-gray-700">
                      <span className="text-sm font-medium text-gray-400 mr-2">
                        {allQuestions.length + idx + 1}.
                      </span>
                      {q.text}
                    </p>

                    <div className="flex gap-2">
                      {SCALE_OPTIONS.map(option => {
                        const isSelected = extraAnswers[q.id] === option.value
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleExtraSelect(q.id, option.value)}
                            className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
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

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">추가 피드백 (선택)</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이번 코칭에서 가장 좋았던 점은 무엇인가요?
                </label>
                <textarea
                  value={openText.bestPart}
                  onChange={(e) => setOpenText(prev => ({ ...prev, bestPart: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="자유롭게 작성해주세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  아쉬웠던 점이나 개선 의견이 있다면 알려주세요.
                </label>
                <textarea
                  value={openText.regret}
                  onChange={(e) => setOpenText(prev => ({ ...prev, regret: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="자유롭게 작성해주세요"
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* 제출 버튼 */}
      <div className="space-y-3 pb-6">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              저장 중...
            </>
          ) : (
            <>
              설문 완료하기
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
        <p className="text-center text-sm text-gray-500">
          {canSubmit ? '모든 문항에 응답하셨습니다.' : `${totalQuestions - answeredCount}개 문항이 남았습니다.`}
        </p>
      </div>
    </div>
  )
}
