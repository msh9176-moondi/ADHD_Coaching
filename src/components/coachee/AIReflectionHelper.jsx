import { useState } from 'react'
import { Button } from '../common/Button'
import { getReflectionQuestions, getReflectionInsight, isAIConfigured } from '../../lib/aiService'
import { Sparkles, HelpCircle, Lightbulb, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

/**
 * AI 질문 제안 컴포넌트
 */
export function AIQuestionSuggester({ sessionNumber, mood, content, onSelectQuestion }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  if (!isAIConfigured()) return null

  const handleGetQuestions = async () => {
    setLoading(true)
    try {
      const result = await getReflectionQuestions({ sessionNumber, mood, content })
      setData(result)
      setIsOpen(true)
    } catch (err) {
      console.error('AI 질문 생성 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      {!data ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleGetQuestions}
          disabled={loading}
          className="text-purple-600 border-purple-300 hover:bg-purple-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-1" />
          )}
          AI 질문 도우미
        </Button>
      ) : (
        <div className="bg-purple-50 border border-purple-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-purple-100"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">AI 질문 제안</span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-purple-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-purple-600" />
            )}
          </button>

          {isOpen && (
            <div className="px-3 pb-3 space-y-2">
              {data.encouragement && (
                <p className="text-xs text-purple-600 italic">{data.encouragement}</p>
              )}
              {data.questions?.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectQuestion?.(question)}
                  className="w-full text-left px-3 py-2 text-sm bg-white border border-purple-100 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <HelpCircle className="w-3 h-3 inline mr-2 text-purple-500" />
                  {question}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetQuestions}
                disabled={loading}
                className="w-full mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '다른 질문 보기'}
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
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 space-y-3">
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
          <div className="bg-blue-50 rounded-lg p-2">
            <p className="text-xs text-blue-600 mb-1">성장 포인트 🌱</p>
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
