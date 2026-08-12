import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { Textarea } from '../common/Input'
import { getSessionReflectionHelper, isAIConfigured } from '../../lib/aiService'
import { BookOpen, Lightbulb, Rocket, Star, ChevronDown, Target, Sparkles, Loader2, Calendar, TrendingUp } from 'lucide-react'

// 인라인 AI 제안 컴포넌트 - 입력 필드 바로 위에 표시
function InlineSuggestion({ suggestions = [], onApply, color = 'emerald' }) {
  if (!suggestions || suggestions.length === 0) return null

  const colorClasses = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
    blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
  }

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {suggestions.map((suggestion, idx) => {
        // suggestion이 object인 경우 (액션플랜)
        const text = typeof suggestion === 'string' ? suggestion : suggestion.action
        const extra = typeof suggestion === 'object' ? suggestion : null

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onApply(text)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors text-left ${colorClasses[color]}`}
          >
            <span className="font-medium">{text}</span>
            {extra?.howSmall && (
              <span className="block text-[10px] opacity-75 mt-0.5">🎯 {extra.howSmall}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function ReflectionNote({ session, initialData, onSubmit, onCancel, isEditing = false, coachingTopics = [], chatMessages = [] }) {
  const [reflection, setReflection] = useState({
    topic: initialData?.topic || '',
    previousScore: initialData?.previousScore || 5,
    currentScore: initialData?.currentScore || 5,
    learned: initialData?.learned || '',
    felt: initialData?.felt || '',
    actionPlan: initialData?.actionPlan || '',
    nextExpectation: initialData?.nextExpectation || '',
  })
  const [showTopicDropdown, setShowTopicDropdown] = useState(false)

  // AI 분석 상태
  const [aiData, setAiData] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  const handleChange = (field, value) => {
    setReflection(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onSubmit?.(reflection, session?.sessionNumber || 1)
  }

  // AI 분석 실행
  const handleAIAnalyze = async () => {
    if (chatMessages.length === 0) {
      setAiError('분석할 채팅 내역이 없습니다.')
      return
    }

    setAiLoading(true)
    setAiError(null)
    try {
      const result = await getSessionReflectionHelper(chatMessages, reflection.topic, session?.sessionNumber || 1)
      setAiData(result)
    } catch (err) {
      console.error('AI 분석 실패:', err)
      setAiError('AI 분석에 실패했습니다.')
    } finally {
      setAiLoading(false)
    }
  }

  // 제안 적용 핸들러
  const applyToField = (field, value) => {
    setReflection(prev => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}\n${value}` : value
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          {session?.sessionNumber || 1}회기 성찰일지
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI 분석 버튼 & 회기 요약 */}
        {isAIConfigured() && (
          <div className="space-y-3">
            {!aiData ? (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIAnalyze}
                  disabled={aiLoading || chatMessages.length === 0}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  {aiLoading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1" />
                  )}
                  {aiLoading ? 'AI가 채팅 분석 중...' : 'AI 성찰 도우미'}
                </Button>
                {chatMessages.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">채팅 내역이 있어야 분석할 수 있어요</p>
                )}
                {aiError && <p className="text-xs text-red-500 mt-1">{aiError}</p>}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">이번 회기 요약</span>
                  <button
                    onClick={handleAIAnalyze}
                    disabled={aiLoading}
                    className="ml-auto text-xs text-purple-500 hover:text-purple-700"
                  >
                    {aiLoading ? '분석 중...' : '다시 분석'}
                  </button>
                </div>
                <p className="text-sm text-gray-700">{aiData.sessionSummary}</p>

                {/* 인상 깊었던 순간 */}
                {aiData.keyMoments?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-purple-100">
                    <p className="text-xs text-amber-600 font-medium mb-1">💡 인상 깊었던 순간</p>
                    <ul className="space-y-0.5">
                      {aiData.keyMoments.map((moment, idx) => (
                        <li key={idx} className="text-xs text-gray-600">• {moment}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 점수 힌트 */}
                {aiData.scoreHint && (
                  <div className="mt-3 pt-3 border-t border-purple-100 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <p className="text-xs text-green-700">{aiData.scoreHint}</p>
                  </div>
                )}

                {/* 격려 메시지 */}
                {aiData.encouragement && (
                  <p className="mt-3 text-xs text-center text-pink-600">✨ {aiData.encouragement}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 코칭 주제 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            오늘의 코칭 주제
          </label>

          {coachingTopics.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <span className={reflection.topic ? 'text-gray-900' : 'text-gray-400'}>
                  {reflection.topic || '코칭 주제를 선택하세요'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showTopicDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showTopicDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {coachingTopics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => {
                        handleChange('topic', topic.title)
                        handleChange('previousScore', topic.currentScore || 1)
                        setShowTopicDropdown(false)
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center justify-between ${
                        reflection.topic === topic.title ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{topic.title}</p>
                        <p className="text-xs text-gray-500">
                          현재 {topic.currentScore || 0}점 → 목표 {topic.targetScore || 10}점
                        </p>
                      </div>
                      {reflection.topic === topic.title && (
                        <span className="text-emerald-600 text-sm">선택됨</span>
                      )}
                    </button>
                  ))}
                  <div className="border-t">
                    <button
                      type="button"
                      onClick={() => {
                        handleChange('topic', '')
                        setShowTopicDropdown(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                    >
                      직접 입력하기...
                    </button>
                  </div>
                </div>
              )}

              {!reflection.topic && !showTopicDropdown && (
                <input
                  type="text"
                  value={reflection.topic}
                  onChange={(e) => handleChange('topic', e.target.value)}
                  placeholder="또는 직접 입력..."
                  className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          ) : (
            <input
              type="text"
              value={reflection.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              placeholder="오늘 상담에서 다룬 주제를 적어주세요"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          )}

          {coachingTopics.length > 0 && reflection.topic && coachingTopics.find(t => t.title === reflection.topic) && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <Target className="w-3 h-3" />
              성찰일지 저장 시 목표합의서의 점수도 함께 업데이트됩니다
            </p>
          )}
        </div>

        {/* 점수 변화 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">이전 점수</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="10"
                value={reflection.previousScore}
                onChange={(e) => handleChange('previousScore', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="w-8 text-center font-medium text-gray-900">
                {reflection.previousScore}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">현재 점수</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="10"
                value={reflection.currentScore}
                onChange={(e) => handleChange('currentScore', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="w-8 text-center font-medium text-emerald-600">
                {reflection.currentScore}
              </span>
            </div>
          </div>
        </div>

        {/* 배운 점 - AI 제안이 바로 위에 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            배운 점
          </label>
          <InlineSuggestion
            suggestions={aiData?.learnedSuggestions}
            onApply={(text) => applyToField('learned', text)}
            color="emerald"
          />
          <Textarea
            value={reflection.learned}
            onChange={(e) => handleChange('learned', e.target.value)}
            placeholder="오늘 상담에서 새롭게 알게 된 것, 깨달은 것이 있나요?"
            rows={3}
          />
        </div>

        {/* 느낀 점 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-500" />
            느낀 점
          </label>
          <Textarea
            value={reflection.felt}
            onChange={(e) => handleChange('felt', e.target.value)}
            placeholder="상담 후 어떤 감정이나 생각이 드나요?"
            rows={3}
          />
        </div>

        {/* 액션플랜 - AI 제안이 바로 위에 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-emerald-500" />
            액션플랜
          </label>
          <InlineSuggestion
            suggestions={aiData?.actionPlanSuggestions}
            onApply={(text) => applyToField('actionPlan', text)}
            color="blue"
          />
          <Textarea
            value={reflection.actionPlan}
            onChange={(e) => handleChange('actionPlan', e.target.value)}
            placeholder="다음 상담까지 실천할 작은 행동은 무엇인가요?"
            rows={3}
          />
        </div>

        {/* 다음 회기 기대 - AI 제안이 바로 위에 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            다음 회기 기대사항
          </label>
          <InlineSuggestion
            suggestions={aiData?.nextSessionSuggestions}
            onApply={(text) => applyToField('nextExpectation', text)}
            color="indigo"
          />
          <Textarea
            value={reflection.nextExpectation}
            onChange={(e) => handleChange('nextExpectation', e.target.value)}
            placeholder="다음 상담에서 다루고 싶은 주제나 기대하는 것이 있나요?"
            rows={2}
          />
        </div>

        <div className="flex gap-3">
          {isEditing && onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1" size="lg">
              취소
            </Button>
          )}
          <Button onClick={handleSubmit} className={isEditing ? "flex-1" : "w-full"} size="lg">
            {isEditing ? '수정 완료' : '성찰일지 저장'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
