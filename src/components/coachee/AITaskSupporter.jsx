import { useState } from 'react'
import { Button } from '../common/Button'
import { getTaskSupport, isAIConfigured } from '../../lib/aiService'
import { Sparkles, Lightbulb, Heart, HelpCircle, Loader2, X } from 'lucide-react'

export function AITaskSupporter({ task, onClose }) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(null) // 'hint' | 'encourage' | 'stuck'
  const [result, setResult] = useState(null)

  if (!isAIConfigured()) return null

  const handleGetSupport = async (type) => {
    setActiveTab(type)
    setLoading(true)
    setResult(null)

    try {
      const data = await getTaskSupport(task, type)
      setResult({ type, data })
    } catch (err) {
      console.error('AI 지원 실패:', err)
      setResult({ type, error: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-purple-800 text-sm">AI 서포터</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-purple-100 rounded">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* 버튼 탭 */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => handleGetSupport('hint')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'hint'
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50'
          }`}
        >
          <Lightbulb className="w-3 h-3 inline mr-1" />
          시작 힌트
        </button>
        <button
          onClick={() => handleGetSupport('encourage')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'encourage'
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50'
          }`}
        >
          <Heart className="w-3 h-3 inline mr-1" />
          격려 받기
        </button>
        <button
          onClick={() => handleGetSupport('stuck')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'stuck'
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50'
          }`}
        >
          <HelpCircle className="w-3 h-3 inline mr-1" />
          막혔어요
        </button>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="text-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
          <p className="text-xs text-purple-600 mt-2">AI가 생각하는 중...</p>
        </div>
      )}

      {/* 결과 */}
      {result && !loading && (
        <div className="space-y-2">
          {result.error ? (
            <p className="text-sm text-red-600 text-center py-2">
              잠시 문제가 생겼어요. 다시 시도해주세요.
            </p>
          ) : result.type === 'hint' ? (
            <>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-purple-600 mb-1">🎯 첫 단계</p>
                <p className="text-sm text-gray-800">{result.data.firstStep}</p>
              </div>
              {result.data.tip && (
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-600 mb-1">💡 팁</p>
                  <p className="text-sm text-amber-800">{result.data.tip}</p>
                </div>
              )}
              {result.data.encouragement && (
                <p className="text-sm text-purple-700 text-center italic">
                  {result.data.encouragement}
                </p>
              )}
            </>
          ) : result.type === 'encourage' ? (
            <>
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-800">{result.data.message}</p>
              </div>
              {result.data.celebration && (
                <p className="text-sm text-purple-700 text-center font-medium">
                  {result.data.celebration}
                </p>
              )}
            </>
          ) : result.type === 'stuck' ? (
            <>
              {result.data.validation && (
                <div className="bg-pink-50 rounded-lg p-3">
                  <p className="text-sm text-pink-800">{result.data.validation}</p>
                </div>
              )}
              {result.data.suggestion && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 mb-1">💭 다른 방법</p>
                  <p className="text-sm text-blue-800">{result.data.suggestion}</p>
                </div>
              )}
              {result.data.alternative && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600 mb-1">✂️ 더 작게 나누기</p>
                  <p className="text-sm text-green-800">{result.data.alternative}</p>
                </div>
              )}
              {result.data.reminder && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  {result.data.reminder}
                </p>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* 초기 상태 */}
      {!activeTab && !loading && (
        <p className="text-xs text-purple-600 text-center py-2">
          도움이 필요하면 위 버튼을 눌러주세요!
        </p>
      )}
    </div>
  )
}

/**
 * 작은 버전 - 과제 카드에 붙일 수 있는 버튼
 */
export function AITaskSupportButton({ task }) {
  const [showSupporter, setShowSupporter] = useState(false)

  if (!isAIConfigured()) return null

  return (
    <div className="mt-3">
      {!showSupporter ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSupporter(true)}
          className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          AI 도움 받기
        </Button>
      ) : (
        <AITaskSupporter task={task} onClose={() => setShowSupporter(false)} />
      )}
    </div>
  )
}
