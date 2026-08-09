import { useState } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import {
  X, Sparkles, MessageSquare, Heart, Lightbulb,
  HelpCircle, AlertTriangle, TrendingUp, TrendingDown,
  Minus, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react'
import { analyzeConversation, isAIConfigured } from '../../lib/aiService'

export function AIInsightsPanel({ coachee, messages, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    emotions: true,
    patterns: true,
    suggestions: true
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleAnalyze = async () => {
    if (!isAIConfigured()) {
      setError('OpenAI API 키가 설정되지 않았습니다.')
      return
    }

    if (!messages || messages.length === 0) {
      setError('분석할 대화 내용이 없습니다.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await analyzeConversation(messages, coachee)
      setAnalysis(result)
    } catch (err) {
      console.error('AI 분석 실패:', err)
      setError(err.message || 'AI 분석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 감정 트렌드 아이콘
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  // 감정 트렌드 텍스트
  const getTrendText = (trend) => {
    switch (trend) {
      case 'improving':
        return '호전 중'
      case 'declining':
        return '주의 필요'
      default:
        return '안정적'
    }
  }

  return (
    <Card className="w-80 flex-shrink-0 flex flex-col max-h-full">
      {/* 헤더 */}
      <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-sm text-gray-900">AI 인사이트</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 내용 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* API 키 미설정 경고 */}
        {!isAIConfigured() && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-yellow-800">API 키 필요</p>
                <p className="text-yellow-600 mt-1">
                  .env.local 파일에 VITE_OPENAI_API_KEY를 설정해주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 분석 시작 버튼 */}
        {!analysis && !loading && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">AI 분석 시작</h4>
            <p className="text-sm text-gray-500 mb-4">
              {coachee?.name}님과의 대화를 분석하여<br />
              코칭 인사이트를 제공합니다.
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={!isAIConfigured() || loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              분석 시작
            </Button>
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">AI가 대화를 분석하고 있습니다...</p>
            <p className="text-xs text-gray-400 mt-1">최대 30초 소요</p>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-red-800">분석 실패</p>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              className="w-full mt-3"
            >
              다시 시도
            </Button>
          </div>
        )}

        {/* 분석 결과 */}
        {analysis && !loading && (
          <>
            {/* 대화 요약 */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('summary')}
                className={`w-full px-3 py-2 flex items-center justify-between text-left ${
                  expandedSections.summary ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm text-gray-800">대화 요약</span>
                </div>
                {expandedSections.summary ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.summary && (
                <div className="px-3 py-2">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>
              )}
            </div>

            {/* 감정 분석 */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('emotions')}
                className={`w-full px-3 py-2 flex items-center justify-between text-left ${
                  expandedSections.emotions ? 'bg-pink-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-600" />
                  <span className="font-medium text-sm text-gray-800">감정 분석</span>
                </div>
                {expandedSections.emotions ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.emotions && analysis.emotions && (
                <div className="px-3 py-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">주요 감정</span>
                    <span className="text-xs font-medium text-pink-700 bg-pink-100 px-2 py-0.5 rounded">
                      {analysis.emotions.primary}
                    </span>
                  </div>
                  {analysis.emotions.secondary && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">부차적 감정</span>
                      <span className="text-xs text-gray-600">
                        {analysis.emotions.secondary}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">변화 추세</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(analysis.emotions.trend)}
                      <span className="text-xs text-gray-600">
                        {getTrendText(analysis.emotions.trend)}
                      </span>
                    </div>
                  </div>
                  {analysis.emotions.note && (
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2">
                      {analysis.emotions.note}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 패턴 인사이트 */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('patterns')}
                className={`w-full px-3 py-2 flex items-center justify-between text-left ${
                  expandedSections.patterns ? 'bg-amber-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-sm text-gray-800">패턴 인사이트</span>
                </div>
                {expandedSections.patterns ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.patterns && analysis.patterns && (
                <div className="px-3 py-2 space-y-3">
                  {analysis.patterns.concerns?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">반복되는 고민</p>
                      <div className="space-y-1">
                        {analysis.patterns.concerns.map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.patterns.avoidance?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">회피 패턴</p>
                      <div className="space-y-1">
                        {analysis.patterns.avoidance.map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.patterns.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">강점</p>
                      <div className="space-y-1">
                        {analysis.patterns.strengths.map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 코칭 제안 */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('suggestions')}
                className={`w-full px-3 py-2 flex items-center justify-between text-left ${
                  expandedSections.suggestions ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-sm text-gray-800">코칭 제안</span>
                </div>
                {expandedSections.suggestions ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.suggestions && analysis.suggestions && (
                <div className="px-3 py-2 space-y-3">
                  {analysis.suggestions.questions?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">추천 질문</p>
                      <div className="space-y-1">
                        {analysis.suggestions.questions.map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-700 bg-green-50 p-2 rounded">
                            "{item}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.suggestions.topics?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">다룰 주제</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.suggestions.topics.map((item, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.suggestions.cautions?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">주의사항</p>
                      <div className="space-y-1">
                        {analysis.suggestions.cautions.map((item, idx) => (
                          <div key={idx} className="text-xs text-amber-700 bg-amber-50 p-2 rounded flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 다시 분석 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              다시 분석
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
