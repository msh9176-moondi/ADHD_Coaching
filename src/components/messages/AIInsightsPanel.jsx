import { useState } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import {
  X, Sparkles, MessageSquare, Heart, Lightbulb,
  HelpCircle, AlertTriangle, TrendingUp, TrendingDown,
  Minus, RefreshCw, ChevronDown, ChevronUp, Brain,
  Target, Beaker, ClipboardList, Zap
} from 'lucide-react'
import { analyzeConversation, getQuickSessionBriefing, isAIConfigured } from '../../lib/aiService'

export function AIInsightsPanel({ coachee, messages, onClose }) {
  const [activeTab, setActiveTab] = useState('analysis') // 'analysis' | 'briefing'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [briefing, setBriefing] = useState(null)
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

  const handleBriefing = async () => {
    if (!isAIConfigured()) {
      setError('OpenAI API 키가 설정되지 않았습니다.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getQuickSessionBriefing(coachee, messages)
      setBriefing(result)
    } catch (err) {
      console.error('브리핑 생성 실패:', err)
      setError(err.message || '브리핑 생성 중 오류가 발생했습니다.')
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
    <>
      {/* 모바일 오버레이 */}
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      <Card className={`
        w-full lg:w-80 flex-shrink-0 flex flex-col
        fixed lg:relative inset-x-0 bottom-0 lg:inset-auto
        z-50 lg:z-auto rounded-t-2xl lg:rounded-xl
        max-h-[85vh] lg:max-h-full
      `}>
        {/* 헤더 */}
        <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-emerald-50 rounded-t-2xl lg:rounded-t-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-sm text-gray-900">AI 코칭 보조</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 inline mr-1" />
            빠른 분석
          </button>
          <button
            onClick={() => setActiveTab('briefing')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === 'briefing'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Brain className="w-3.5 h-3.5 inline mr-1" />
            세션 브리핑
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

        {/* 빠른 분석 탭 */}
        {activeTab === 'analysis' && (
          <>
            {/* 분석 시작 버튼 */}
            {!analysis && !loading && (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-7 h-7 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">대화 분석</h4>
                <p className="text-xs text-gray-500 mb-4">
                  {coachee?.name}님과의 대화를 분석합니다
                </p>
                <Button
                  onClick={handleAnalyze}
                  disabled={!isAIConfigured() || loading}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  분석 시작
                </Button>
              </div>
            )}

            {/* 로딩 */}
            {loading && activeTab === 'analysis' && (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600">분석 중...</p>
              </div>
            )}

            {/* 에러 */}
            {error && activeTab === 'analysis' && (
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
                      expandedSections.summary ? 'bg-emerald-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
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
                              <span key={idx} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
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
          </>
        )}

        {/* 세션 브리핑 탭 */}
        {activeTab === 'briefing' && (
          <>
            {/* 브리핑 시작 버튼 */}
            {!briefing && !loading && (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-7 h-7 text-emerald-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">세션 브리핑</h4>
                <p className="text-xs text-gray-500 mb-4">
                  세션 준비를 위한 핵심 정보를 제공합니다
                </p>
                <Button
                  onClick={handleBriefing}
                  disabled={!isAIConfigured() || loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  브리핑 생성
                </Button>
              </div>
            )}

            {/* 로딩 */}
            {loading && activeTab === 'briefing' && (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600">브리핑 생성 중...</p>
              </div>
            )}

            {/* 에러 */}
            {error && activeTab === 'briefing' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-red-800">브리핑 생성 실패</p>
                    <p className="text-red-600 mt-1">{error}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBriefing}
                  className="w-full mt-3"
                >
                  다시 시도
                </Button>
              </div>
            )}

            {/* 브리핑 결과 */}
            {briefing && !loading && (
              <div className="space-y-3">
                {/* 핵심 포인트 */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">오늘의 핵심</span>
                  </div>
                  <p className="text-sm text-emerald-800 font-medium">
                    {briefing.headline}
                  </p>
                </div>

                {/* 피코치 상태 */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs font-medium text-blue-600 mb-1">피코치 상태</p>
                  <p className="text-sm text-blue-800">{briefing.coacheeState}</p>
                </div>

                {/* 최우선 포인트 */}
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardList className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-600">최우선 포인트</span>
                  </div>
                  <p className="text-sm text-amber-800">{briefing.topPriority}</p>
                </div>

                {/* 시작 질문 */}
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">세션 시작 질문</span>
                  </div>
                  <p className="text-sm text-purple-800 font-medium">
                    "{briefing.openingQuestion}"
                  </p>
                </div>

                {/* 주의사항 */}
                {briefing.caution && (
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-red-600">주의</span>
                        <p className="text-sm text-red-800 mt-0.5">{briefing.caution}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 다시 생성 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBriefing}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  다시 생성
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
    </>
  )
}
