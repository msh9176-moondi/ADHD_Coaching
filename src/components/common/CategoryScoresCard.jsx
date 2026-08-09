import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { SURVEY_CATEGORIES } from '../../data/surveyData'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

const CATEGORY_COLORS = {
  execution: { bg: 'bg-blue-500', light: 'bg-blue-100' },
  routine: { bg: 'bg-green-500', light: 'bg-green-100' },
  time: { bg: 'bg-amber-500', light: 'bg-amber-100' },
  efficacy: { bg: 'bg-purple-500', light: 'bg-purple-100' },
  career: { bg: 'bg-rose-500', light: 'bg-rose-100' }
}

export function CategoryScoresCard({ preSurvey, postSurvey, title = '영역별 점수' }) {
  if (!preSurvey?.categoryScores) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">사전설문 미완료</p>
            <p className="text-sm text-gray-400 mt-1">피코치가 사전설문을 완료하면 결과가 표시됩니다.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          {title}
          {postSurvey && (
            <span className="ml-auto text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              사후 비교 가능
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 레이더 차트 스타일 바 */}
        <div className="space-y-3">
          {SURVEY_CATEGORIES.map(cat => {
            const preScoreData = preSurvey.categoryScores?.[cat.id]
            const preScore = typeof preScoreData === 'object' ? preScoreData.average : preScoreData
            const postScoreData = postSurvey?.categoryScores?.[cat.id]
            const postScore = postScoreData ? (typeof postScoreData === 'object' ? postScoreData.average : postScoreData) : null
            const diff = postScore ? postScore - preScore : null
            const colors = CATEGORY_COLORS[cat.id] || { bg: 'bg-gray-500', light: 'bg-gray-100' }

            return (
              <div key={cat.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600 font-medium">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-900">
                      {preScore?.toFixed(1) || '-'}
                    </span>
                    {diff !== null && (
                      <span className={`text-xs flex items-center gap-0.5 ${
                        diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {diff > 0 ? <TrendingUp className="w-3 h-3" /> :
                         diff < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full ${colors.bg} rounded-full transition-all`}
                    style={{ width: `${((preScore || 0) / 5) * 100}%` }}
                  />
                  {/* 사후 점수 마커 */}
                  {postScore && (
                    <div
                      className="absolute top-0 h-full w-0.5 bg-gray-800"
                      style={{ left: `${(postScore / 5) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 전체 평균 */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">전체 평균</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {(() => {
                const total = preSurvey.categoryScores?.total
                const value = typeof total === 'object' ? total.average : total
                return value?.toFixed(1) || preSurvey.totalScore?.toFixed(1) || '-'
              })()}
            </span>
            <span className="text-sm text-gray-400">/ 5.0</span>
            {postSurvey && (
              <span className={`text-sm font-medium ${
                (() => {
                  const postTotal = postSurvey.categoryScores?.total
                  const preTotal = preSurvey.categoryScores?.total
                  const postValue = typeof postTotal === 'object' ? postTotal.average : postTotal
                  const preValue = typeof preTotal === 'object' ? preTotal.average : preTotal
                  return postValue > preValue ? 'text-green-600' : 'text-gray-400'
                })()
              }`}>
                → {(() => {
                  const total = postSurvey.categoryScores?.total
                  const value = typeof total === 'object' ? total.average : total
                  return value?.toFixed(1) || '-'
                })()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
