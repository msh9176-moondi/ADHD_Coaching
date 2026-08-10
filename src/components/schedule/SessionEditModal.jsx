import { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Calendar, Clock, Edit3, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { updateSession, deleteSession } from '../../lib/sessionService'

const SESSION_TOPICS = [
  '코칭 목표 설정',
  '실행 환경 설계',
  '감정·자기비난·재시작 훈련',
  '장애물 분석과 대응',
  '루틴 점검 및 조정',
  '중간 점검',
  '최종 점검 및 마무리',
  '기타',
]

export function SessionEditModal({ isOpen, onClose, session, onUpdate, onDelete }) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    topic: '',
    customTopic: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')

  // 세션 데이터로 폼 초기화
  useEffect(() => {
    if (session && isOpen) {
      const topic = session.topic || ''
      const isCustomTopic = !SESSION_TOPICS.includes(topic) && topic !== ''

      setFormData({
        date: session.date || '',
        time: session.time || '',
        topic: isCustomTopic ? '기타' : topic,
        customTopic: isCustomTopic ? topic : '',
      })
      setError('')
      setShowDeleteConfirm(false)
    }
  }, [session, isOpen])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.date || !formData.time) {
      setError('날짜와 시간을 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const updates = {
        date: formData.date,
        time: formData.time,
        topic: formData.topic === '기타' ? formData.customTopic : formData.topic,
      }

      const updatedSession = await updateSession(session.id, updates)
      console.log('[세션 수정] 성공:', updatedSession)

      if (onUpdate) {
        onUpdate({ ...session, ...updates })
      }
      onClose()
    } catch (err) {
      console.error('[세션 수정] 실패:', err)
      setError(`수정 실패: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError('')

    try {
      await deleteSession(session.id)
      console.log('[세션 삭제] 성공')

      if (onDelete) {
        onDelete(session.id)
      }
      onClose()
    } catch (err) {
      console.error('[세션 삭제] 실패:', err)
      setError(`삭제 실패: ${err.message}`)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!isOpen || !session) return null

  const sessionNumber = session.session_number || session.sessionNumber
  const coacheeName = session.coachee_name || session.coacheeName

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Edit3 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">세션 수정</h2>
            <p className="text-sm text-gray-500">
              {coacheeName} · {sessionNumber}회기
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              날짜
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              시간
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* 주제 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              주제
            </label>
            <select
              value={formData.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">주제 선택</option>
              {SESSION_TOPICS.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          {/* 기타 주제 입력 */}
          {formData.topic === '기타' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                직접 입력
              </label>
              <input
                type="text"
                value={formData.customTopic}
                onChange={(e) => handleChange('customTopic', e.target.value)}
                placeholder="주제를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* 버튼 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {/* 삭제 버튼 */}
            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                삭제
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  정말 삭제하시겠습니까?
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : '확인'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  취소
                </Button>
              </div>
            )}

            {/* 저장/취소 버튼 */}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
