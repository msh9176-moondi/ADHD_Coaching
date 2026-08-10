import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { Textarea } from '../common/Input'
import { AIQuestionSuggester } from './AIReflectionHelper'
import { BookOpen, Lightbulb, Rocket, Star, ChevronDown, Target } from 'lucide-react'

export function ReflectionNote({ session, initialData, onSubmit, onCancel, isEditing = false, coachingTopics = [] }) {
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

  const handleChange = (field, value) => {
    setReflection(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onSubmit?.(reflection)
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
        {/* AI 질문 도우미 */}
        <AIQuestionSuggester
          sessionNumber={session?.sessionNumber || 1}
          mood=""
          content={reflection.topic || reflection.learned}
          onSelectQuestion={(q) => {
            // 질문을 '배운 점' 필드에 힌트로 추가
            if (!reflection.learned) {
              handleChange('learned', `[질문] ${q}\n\n`)
            }
          }}
        />

        {/* 코칭 주제 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-500" />
            오늘의 코칭 주제
          </label>

          {/* 목표합의서 주제가 있으면 드롭다운 표시 */}
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
                        // 이전 점수를 해당 주제의 현재 점수로 자동 설정
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

              {/* 직접 입력 모드 */}
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

          {/* 선택된 주제의 점수 변화 안내 */}
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

        {/* 배운 점 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            배운 점
          </label>
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

        {/* 액션플랜 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-emerald-500" />
            액션플랜
          </label>
          <Textarea
            value={reflection.actionPlan}
            onChange={(e) => handleChange('actionPlan', e.target.value)}
            placeholder="다음 상담까지 실천할 작은 행동은 무엇인가요?"
            rows={3}
          />
        </div>

        {/* 다음 회기 기대 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">다음 회기 기대사항</label>
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
