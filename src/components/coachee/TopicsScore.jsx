import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B']

export function TopicsScore() {
  const { coachingTopics } = useStore()

  if (!coachingTopics || coachingTopics.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          주제별 점수
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {coachingTopics.map((topic, idx) => {
          const { startScore, currentScore, targetScore, title } = topic
          const change = currentScore - startScore
          const currentPercent = (currentScore / 10) * 100
          const targetPercent = (targetScore / 10) * 100
          const color = COLORS[idx % COLORS.length]

          return (
            <div key={topic.id} className="space-y-2">
              {/* 헤더 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  {idx + 1}. {title}
                </span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {change > 0 ? (
                    <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                      <TrendingUp className="w-3 h-3" />+{change}
                    </span>
                  ) : change < 0 ? (
                    <span className="flex items-center gap-0.5 text-red-500 font-semibold">
                      <TrendingDown className="w-3 h-3" />{change}
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-gray-400">
                      <Minus className="w-3 h-3" />-
                    </span>
                  )}
                  <span>
                    현재 <span className="font-bold text-blue-600">{currentScore}</span>점 / 목표 {targetScore}점
                  </span>
                </div>
              </div>

              {/* 진행바 */}
              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${currentPercent}%`, backgroundColor: color }}
                />
                {/* 목표 마커 */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-gray-800/30"
                  style={{ left: `${targetPercent}%` }}
                />
              </div>

              {/* 범례 */}
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>시작 {startScore}점</span>
                <span>목표 {targetScore}점</span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
