import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function TopicScoreInput({ topic, onChange }) {
  const [score, setScore] = useState(topic.currentScore || 0)

  const handleChange = (newScore) => {
    setScore(newScore)
    onChange?.(topic.id, newScore)
  }

  const change = score - (topic.currentScore || 0)
  const changeFromStart = score - (topic.startScore || 0)

  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{topic.title}</h4>
        <div className="flex items-center gap-2">
          {change > 0 && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              +{change}
            </span>
          )}
          {change < 0 && (
            <span className="flex items-center gap-1 text-sm text-red-600">
              <TrendingDown className="w-4 h-4" />
              {change}
            </span>
          )}
          {change === 0 && (
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <Minus className="w-4 h-4" />
              유지
            </span>
          )}
        </div>
      </div>

      {/* 점수 표시 */}
      <div className="flex items-center gap-4 mb-3">
        <div className="text-center">
          <p className="text-xs text-gray-500">시작</p>
          <span className="text-lg font-semibold text-gray-400">{topic.startScore || 0}</span>
        </div>
        <div className="text-gray-300">→</div>
        <div className="text-center">
          <p className="text-xs text-gray-500">현재</p>
          <span className="text-lg font-semibold text-emerald-600">{topic.currentScore || 0}</span>
        </div>
        <div className="text-gray-300">→</div>
        <div className="text-center">
          <p className="text-xs text-gray-500">이번 회기</p>
          <span className={`text-lg font-bold ${
            score > topic.currentScore ? 'text-green-600' :
            score < topic.currentScore ? 'text-red-600' : 'text-emerald-600'
          }`}>{score}</span>
        </div>
        <div className="text-gray-300">/</div>
        <div className="text-center">
          <p className="text-xs text-gray-500">목표</p>
          <span className="text-lg font-semibold text-gray-600">{topic.targetScore || 10}</span>
        </div>
      </div>

      {/* 슬라이더 */}
      <div className="relative">
        <input
          type="range"
          min="0"
          max="10"
          value={score}
          onChange={(e) => handleChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>전체 진행률</span>
          <span>{Math.round((score / (topic.targetScore || 10)) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              score >= (topic.targetScore || 10) ? 'bg-green-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min((score / (topic.targetScore || 10)) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function TopicScoreList({ topics, onChange }) {
  const [scores, setScores] = useState(
    topics.reduce((acc, t) => {
      acc[t.id] = t.currentScore || 0
      return acc
    }, {})
  )

  const handleScoreChange = (topicId, newScore) => {
    const updated = { ...scores, [topicId]: newScore }
    setScores(updated)
    onChange?.(
      Object.entries(updated).map(([id, score]) => ({
        topicId: id,
        currentScore: score
      }))
    )
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        설정된 코칭 주제가 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <TopicScoreInput
          key={topic.id}
          topic={{ ...topic, currentScore: scores[topic.id] ?? topic.currentScore }}
          onChange={handleScoreChange}
        />
      ))}
    </div>
  )
}
