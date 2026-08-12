import { useState } from 'react'
import { Button } from '../common/Button'
import { getSessionReflectionHelper, isAIConfigured } from '../../lib/aiService'
import { Sparkles, Lightbulb, Loader2, ChevronDown, ChevronUp, BookOpen, Rocket, Calendar, MessageSquare, TrendingUp } from 'lucide-react'

/**
 * 채팅 내역 기반 AI 성찰 도우미 컴포넌트
 */
export function AIQuestionSuggester({
  sessionNumber,
  topicTitle = '',
  messages = [],
  onApplySuggestion
}) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState(null)

  if (!isAIConfigured()) return null

  const handleAnalyze = async () => {
    if (messages.length === 0) {
      setError('분석할 채팅 내역이 없습니다.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await getSessionReflectionHelper(messages, topicTitle, sessionNumber)
      setData(result)
      setIsOpen(true)
    } catch (err) {
      console.error('AI 분석 실패:', err)
      setError('AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      {!data ? (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={loading || messages.length === 0}
            className="text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1" />
            )}
            {loading ? 'AI가 분석 중...' : 'AI 성찰 도우미'}
          </Button>
          {messages.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">채팅 내역이 있어야 분석할 수 있어요</p>
          )}
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-purple-100/50"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <span className="text-sm font-medium text-purple-800">AI 성찰 도우미</span>
                <p className="text-xs text-purple-600">채팅 내역 기반 분석 완료</p>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-purple-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-purple-600" />
            )}
          </button>

          {isOpen && (
            <div className="px-4 pb-4 space-y-4">
              {/* 회기 요약 */}
              {data.sessionSummary && (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-medium text-gray-800">이번 회기 요약</h4>
                  </div>
                  <p className="text-sm text-gray-700">{data.sessionSummary}</p>
                </div>
              )}

              {/* 인상 깊었던 순간 */}
              {data.keyMoments?.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-medium text-amber-800">인상 깊었던 순간</h4>
                  </div>
                  <ul className="space-y-1">
                    {data.keyMoments.map((moment, idx) => (
                      <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        {moment}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 배운 점 제안 */}
              {data.learnedSuggestions?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-medium text-gray-800">배운 점 제안</h4>
                  </div>
                  {data.learnedSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => onApplySuggestion?.('learned', suggestion)}
                      className="w-full text-left px-3 py-2 text-sm bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <span className="text-emerald-700">{suggestion}</span>
                      <span className="text-xs text-emerald-500 block mt-0.5">탭하여 적용</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 액션플랜 제안 */}
              {data.actionPlanSuggestions?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-medium text-gray-800">액션플랜 제안</h4>
                  </div>
                  {data.actionPlanSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => onApplySuggestion?.('actionPlan', item.action)}
                      className="w-full text-left px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <p className="text-sm font-medium text-blue-800">{item.action}</p>
                      {item.why && <p className="text-xs text-blue-600 mt-1">💡 {item.why}</p>}
                      {item.howSmall && <p className="text-xs text-blue-500 mt-0.5">🎯 작게 시작: {item.howSmall}</p>}
                      <span className="text-xs text-blue-400 block mt-1">탭하여 적용</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 다음 회기 제안 */}
              {data.nextSessionSuggestions?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-medium text-gray-800">다음 회기 기대사항 제안</h4>
                  </div>
                  {data.nextSessionSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => onApplySuggestion?.('nextExpectation', suggestion)}
                      className="w-full text-left px-3 py-2 text-sm bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <span className="text-indigo-700">{suggestion}</span>
                      <span className="text-xs text-indigo-500 block mt-0.5">탭하여 적용</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 점수 힌트 */}
              {data.scoreHint && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700">{data.scoreHint}</p>
                  </div>
                </div>
              )}

              {/* 격려 메시지 */}
              {data.encouragement && (
                <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-lg p-3 border border-pink-100">
                  <p className="text-sm text-pink-700 text-center">✨ {data.encouragement}</p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '다시 분석하기'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * AI 인사이트 컴포넌트
 */
export function AIReflectionInsight({ reflection }) {
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState(null)

  if (!isAIConfigured()) return null

  const handleGetInsight = async () => {
    setLoading(true)
    try {
      const result = await getReflectionInsight(reflection)
      setInsight(result)
    } catch (err) {
      console.error('AI 인사이트 생성 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!insight) {
    return (
      <div className="mt-4 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGetInsight}
          disabled={loading}
          className="w-full text-purple-600 border-purple-300 hover:bg-purple-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Lightbulb className="w-4 h-4 mr-1" />
          )}
          AI 인사이트 받기
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h4 className="font-medium text-purple-800 text-sm">AI 인사이트</h4>
        </div>

        {insight.summary && (
          <div>
            <p className="text-xs text-gray-500 mb-1">요약</p>
            <p className="text-sm text-gray-700">{insight.summary}</p>
          </div>
        )}

        {insight.strength && (
          <div className="bg-green-50 rounded-lg p-2">
            <p className="text-xs text-green-600 mb-1">발견한 강점 💪</p>
            <p className="text-sm text-green-800">{insight.strength}</p>
          </div>
        )}

        {insight.growth && (
          <div className="bg-emerald-50 rounded-lg p-2">
            <p className="text-xs text-emerald-600 mb-1">성장 포인트 🌱</p>
            <p className="text-sm text-blue-800">{insight.growth}</p>
          </div>
        )}

        {insight.tip && (
          <div className="bg-amber-50 rounded-lg p-2">
            <p className="text-xs text-amber-600 mb-1">ADHD 팁 💡</p>
            <p className="text-sm text-amber-800">{insight.tip}</p>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleGetInsight}
          disabled={loading}
          className="w-full mt-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '다시 분석'}
        </Button>
      </div>
    </div>
  )
}
