import { useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import {
  FileText, Target, CheckCircle, MessageCircle,
  TrendingUp, AlertTriangle, Save, X
} from 'lucide-react'

export function SessionNoteModal({ isOpen, onClose, coachee, sessionNumber, existingNote }) {
  const [note, setNote] = useState(existingNote || {
    topic: '',
    summary: '',
    progress: '',
    nextActions: '',
    coacheeCondition: 'good',
    scoreChange: 0,
    warnings: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  const conditionOptions = [
    { value: 'excellent', label: '매우 좋음', color: 'bg-green-100 text-green-700' },
    { value: 'good', label: '좋음', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'normal', label: '보통', color: 'bg-gray-100 text-gray-700' },
    { value: 'tired', label: '지침', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'difficult', label: '어려움', color: 'bg-red-100 text-red-700' }
  ]

  const handleSave = () => {
    setIsSaving(true)
    // TODO: 실제 저장 로직
    setTimeout(() => {
      setIsSaving(false)
      onClose()
      alert('세션 일지가 저장되었습니다.')
    }, 500)
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">세션 일지 작성</h2>
              <p className="text-sm text-gray-500">
                {coachee?.name} · {sessionNumber}회기
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 폼 */}
        <div className="space-y-5">
          {/* 세션 주제 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="w-4 h-4 inline mr-1" />
              세션 주제
            </label>
            <input
              type="text"
              value={note.topic}
              onChange={(e) => setNote({ ...note, topic: e.target.value })}
              placeholder="예: 아침 루틴 점검, 실행 전략 수정"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 세션 요약 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageCircle className="w-4 h-4 inline mr-1" />
              세션 요약
            </label>
            <textarea
              value={note.summary}
              onChange={(e) => setNote({ ...note, summary: e.target.value })}
              placeholder="이번 세션에서 나눈 주요 내용을 요약해주세요..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* 진전 사항 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              진전 사항
            </label>
            <textarea
              value={note.progress}
              onChange={(e) => setNote({ ...note, progress: e.target.value })}
              placeholder="지난 세션 이후 피코치의 변화나 성과..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* 다음 실행 과제 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              다음 회기까지 실행 과제
            </label>
            <textarea
              value={note.nextActions}
              onChange={(e) => setNote({ ...note, nextActions: e.target.value })}
              placeholder="다음 세션까지 피코치가 실행할 과제들..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* 피코치 상태 & 점수 변화 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                피코치 컨디션
              </label>
              <div className="flex flex-wrap gap-2">
                {conditionOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNote({ ...note, coacheeCondition: opt.value })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      note.coacheeCondition === opt.value
                        ? opt.color + ' ring-2 ring-offset-1 ring-emerald-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                점수 변화
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="-5"
                  max="5"
                  value={note.scoreChange}
                  onChange={(e) => setNote({ ...note, scoreChange: Number(e.target.value) })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-500">점</span>
                {note.scoreChange > 0 && (
                  <Badge variant="success">+{note.scoreChange} 상승</Badge>
                )}
                {note.scoreChange < 0 && (
                  <Badge variant="warning">{note.scoreChange} 하락</Badge>
                )}
              </div>
            </div>
          </div>

          {/* 주의 사항 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-500" />
              주의 사항 (선택)
            </label>
            <textarea
              value={note.warnings}
              onChange={(e) => setNote({ ...note, warnings: e.target.value })}
              placeholder="관찰된 위험 신호나 주의가 필요한 점..."
              rows={2}
              className="w-full px-4 py-2.5 border border-amber-200 bg-amber-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                일지 저장
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
