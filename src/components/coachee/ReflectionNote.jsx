import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { Textarea } from '../common/Input'
import { AIQuestionSuggester } from './AIReflectionHelper'
import { BookOpen, Lightbulb, Rocket, Star } from 'lucide-react'

export function ReflectionNote({ session, initialData, onSubmit, onCancel, isEditing = false }) {
  const [reflection, setReflection] = useState({
    topic: initialData?.topic || '',
    previousScore: initialData?.previousScore || 5,
    currentScore: initialData?.currentScore || 5,
    learned: initialData?.learned || '',
    felt: initialData?.felt || '',
    actionPlan: initialData?.actionPlan || '',
    nextExpectation: initialData?.nextExpectation || '',
  })

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
          <label className="text-sm font-medium text-gray-700">오늘의 코칭 주제</label>
          <input
            type="text"
            value={reflection.topic}
            onChange={(e) => handleChange('topic', e.target.value)}
            placeholder="오늘 상담에서 다룬 주제를 적어주세요"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
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
