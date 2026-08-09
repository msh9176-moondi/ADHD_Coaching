import { useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import {
  CheckSquare, Calendar, Clock, Target,
  Save, X, Trash2
} from 'lucide-react'

export function TaskModal({ isOpen, onClose, coachee, task, onSave, onDelete }) {
  const isEdit = !!task
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    dueDate: task?.dueDate || '',
    priority: task?.priority || 'medium',
    sessionNumber: task?.sessionNumber || (coachee?.currentSession || 1)
  })
  const [isSaving, setIsSaving] = useState(false)

  const priorityOptions = [
    { value: 'high', label: '높음', color: 'bg-red-100 text-red-700' },
    { value: 'medium', label: '보통', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'low', label: '낮음', color: 'bg-green-100 text-green-700' }
  ]

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert('과제 제목을 입력해주세요.')
      return
    }

    setIsSaving(true)
    // TODO: 실제 저장 로직
    setTimeout(() => {
      setIsSaving(false)
      if (onSave) {
        onSave({
          ...formData,
          id: task?.id || `task-${Date.now()}`,
          status: task?.status || 'not_started',
          createdAt: task?.createdAt || new Date().toISOString()
        })
      }
      onClose()
      alert(isEdit ? '과제가 수정되었습니다.' : '과제가 추가되었습니다.')
    }, 500)
  }

  const handleDelete = () => {
    if (confirm('이 과제를 삭제하시겠습니까?')) {
      if (onDelete) onDelete(task.id)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isEdit ? '과제 수정' : '과제 추가'}
              </h2>
              <p className="text-sm text-gray-500">
                {coachee?.name} · {formData.sessionNumber}회기 과제
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 폼 */}
        <div className="space-y-5">
          {/* 과제 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="w-4 h-4 inline mr-1" />
              과제 제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 아침 기상 후 물 한 잔 마시기"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 상세 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상세 설명 (선택)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="과제에 대한 추가 설명이나 팁..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* 마감일 & 우선순위 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                마감일
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                우선순위
              </label>
              <div className="flex gap-2">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: opt.value })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.priority === opt.value
                        ? opt.color + ' ring-2 ring-offset-1 ring-emerald-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 회기 번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              연결 회기
            </label>
            <select
              value={formData.sessionNumber}
              onChange={(e) => setFormData({ ...formData, sessionNumber: Number(e.target.value) })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {Array.from({ length: coachee?.totalSessions || 10 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>{num}회기</option>
              ))}
            </select>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          <div>
            {isEdit && (
              <Button variant="ghost" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                삭제
              </Button>
            )}
          </div>
          <div className="flex gap-3">
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
                  {isEdit ? '수정' : '추가'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
