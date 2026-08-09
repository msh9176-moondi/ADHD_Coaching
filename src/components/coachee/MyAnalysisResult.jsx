import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { CategoryScoresCard } from '../common/CategoryScoresCard'
import { ADHD_TYPES, analyzeADHDType, analyzeCoachingPriorities } from '../../data/coachData'
import {
  Brain, Zap, AlertTriangle, Layers, Target, TrendingUp,
  Sparkles, PieChart, RefreshCw, ClipboardList
} from 'lucide-react'

const TYPE_ICONS = {
  inattention: Brain,
  hyperactivity: Zap,
  impulsivity: AlertTriangle,
  combined: Layers
}

const TYPE_COLORS = {
  inattention: { bg: 'bg-purple-100', text: 'text-purple-600', accent: 'purple' },
  hyperactivity: { bg: 'bg-orange-100', text: 'text-orange-600', accent: 'orange' },
  impulsivity: { bg: 'bg-red-100', text: 'text-red-600', accent: 'red' },
  combined: { bg: 'bg-emerald-100', text: 'text-emerald-600', accent: 'blue' }
}


export function MyAnalysisResult() {
  const { asrsResult, preSurvey, postSurvey } = useStore()

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

  // 결과가 없으면 안내 메시지
  if (!asrsResult && !preSurvey) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">아직 분석 결과가 없어요</h3>
          <p className="text-sm text-gray-500 mb-4">
            설문과 자가진단을 완료하면 나의 결과를 확인할 수 있어요.
          </p>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            설문 시작하기
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-emerald-600" />
          나의 분석 결과
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ADHD 유형 카드 */}
        {asrsResult && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                나의 ADHD 유형
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 유형 배지 */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl ${typeColors.bg} flex items-center justify-center`}>
                  <TypeIcon className={`w-7 h-7 ${typeColors.text}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{typeInfo?.name || 'ADHD 특성'}</h3>
                  <p className={`text-sm ${typeColors.text} font-medium`}>
                    {asrsResult.interpretation}
                  </p>
                </div>
              </div>

              {/* 3개 영역 점수 바 */}
              <div className="space-y-3">
                {/* 주의력 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">주의력 결핍</span>
                    <span className="text-xs font-medium text-purple-600">
                      {asrsResult.inattentionScore}점
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${(asrsResult.inattentionScore / 36) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 과잉행동 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">과잉행동</span>
                    <span className="text-xs font-medium text-orange-600">
                      {asrsResult.hyperactivityScore}점
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${(asrsResult.hyperactivityScore / 20) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 충동성 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">충동성</span>
                    <span className="text-xs font-medium text-red-600">
                      {asrsResult.impulsivityScore}점
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${(asrsResult.impulsivityScore / 16) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 총점 */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">총점</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">{asrsResult.totalScore}</span>
                  <span className="text-sm text-gray-400">/ {asrsResult.maxScore}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 코칭 설문 결과 카드 */}
        {preSurvey && (
          <CategoryScoresCard
            preSurvey={preSurvey}
            postSurvey={postSurvey}
            title="영역별 점수"
          />
        )}
      </div>

      {/* 코칭 필요 영역 */}
      {coachingPriorities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-red-500" />
              집중이 필요한 영역
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {coachingPriorities.slice(0, 2).map((area, idx) => (
                <div
                  key={area.id}
                  className={`p-4 rounded-xl border ${
                    idx === 0 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      idx === 0 ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700'
                    }`}>
                      {idx === 0 ? '1순위' : '2순위'}
                    </span>
                    <span className={`text-sm font-bold ${
                      idx === 0 ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {area.score.toFixed(1)}점
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{area.name}</h4>
                  <p className="text-xs text-gray-600">{area.lowScoreMessage}</p>

                  {/* 팁 */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {area.tips?.slice(0, 2).map((tip, tipIdx) => (
                      <span
                        key={tipIdx}
                        className="px-2 py-0.5 bg-white/70 rounded text-xs text-gray-600"
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

      {/* 추천 전략 */}
      {typeInfo && (
        <Card className="bg-gradient-to-r from-amber-500 to-emerald-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">나를 위한 코칭 전략</h3>
                <p className="text-sm text-blue-100 leading-relaxed">
                  {typeInfo.coachingDirection}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {typeInfo.recommendedActions.slice(0, 3).map((action, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-white/20 rounded-lg text-xs"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 재검사 버튼 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-gray-600" />
            검사 다시하기
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            상태가 변했거나 더 정확한 결과를 원하시면 다시 검사할 수 있습니다.
          </p>
          <div className="flex gap-3">
            <Link
              to="/coachee/asrs-test"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors border border-purple-200"
            >
              <Brain className="w-4 h-4" />
              ASRS 재검사
            </Link>
            <Link
              to="/coachee/survey?type=pre"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
            >
              <ClipboardList className="w-4 h-4" />
              설문 재검사
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
