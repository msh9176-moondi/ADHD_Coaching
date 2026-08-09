import { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { useStore } from '../../store/useStore'
import { createSession } from '../../lib/sessionService'
import { coacheeService } from '../../lib'
import { Calendar, Clock, MessageSquare, User, Loader2 } from 'lucide-react'

// 세션 주제 옵션
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

export function SessionBookingModal() {
  const {
    isBookingModalOpen,
    bookingCoachee,
    closeBookingModal,
    user,
    addSession,
  } = useStore()

  const [formData, setFormData] = useState({
    coacheeId: '',
    coacheeName: '',
    date: '',
    time: '',
    duration: 60,
    type: 'message',
    sessionNumber: 1,
    topic: '',
    customTopic: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [coachees, setCoachees] = useState([])
  const [coacheesLoading, setCoacheesLoading] = useState(false)

  // 모달 열릴 때 피코치 목록 로드
  useEffect(() => {
    async function loadCoachees() {
      if (!isBookingModalOpen || !user?.id || bookingCoachee) return

      setCoacheesLoading(true)
      try {
        const data = await coacheeService.getCoachCoachees(user.id)
        setCoachees(data || [])
      } catch (err) {
        console.warn('피코치 목록 로드 실패:', err)
        setCoachees([])
      } finally {
        setCoacheesLoading(false)
      }
    }
    loadCoachees()
  }, [isBookingModalOpen, user?.id, bookingCoachee])

  // 모달 열릴 때 피코치가 미리 선택되어 있으면 설정
  useEffect(() => {
    if (bookingCoachee) {
      setFormData((prev) => ({
        ...prev,
        coacheeId: bookingCoachee.id,
        coacheeName: bookingCoachee.name,
      }))
    }
  }, [bookingCoachee])

  // 모달 닫힐 때 폼 초기화
  useEffect(() => {
    if (!isBookingModalOpen) {
      setFormData({
        coacheeId: '',
        coacheeName: '',
        date: '',
        time: '',
        duration: 60,
        type: 'message',
        sessionNumber: 1,
        topic: '',
        customTopic: '',
      })
      setError('')
      setCoachees([])
    }
  }, [isBookingModalOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 유효성 검사
    if (!formData.coacheeId) {
      setError('피코치를 선택해주세요.')
      return
    }
    if (!formData.date) {
      setError('날짜를 선택해주세요.')
      return
    }
    if (!formData.time) {
      setError('시간을 선택해주세요.')
      return
    }
    if (!formData.topic) {
      setError('상담 주제를 선택해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const sessionData = {
        coach_id: user?.id || 'demo-coach',
        coachee_id: formData.coacheeId,
        coachee_name: formData.coacheeName,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        type: formData.type,
        session_number: formData.sessionNumber,
        topic: formData.topic === '기타' ? formData.customTopic : formData.topic,
        status: 'scheduled',
      }

      // Supabase에 저장 시도
      try {
        const newSession = await createSession(sessionData)
        // store의 sessions를 업데이트 (중복 방지를 위해 ID 체크)
        const currentSessions = useStore.getState().sessions
        const isDuplicate = currentSessions.some(s => s.id === newSession.id)
        if (!isDuplicate) {
          addSession(newSession)
        }
      } catch (supabaseError) {
        // Supabase 연동이 안 되어 있으면 로컬 상태에만 추가
        console.warn('Supabase 연동 실패, 로컬 상태에 추가:', supabaseError)
        const localSession = {
          ...sessionData,
          id: `local-${Date.now()}`,
          created_at: new Date().toISOString(),
        }
        addSession(localSession)
      }

      closeBookingModal()
    } catch (err) {
      setError('예약 중 오류가 발생했습니다. 다시 시도해주세요.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // 오늘 날짜 (최소 선택 가능 날짜)
  const today = new Date().toISOString().split('T')[0]

  return (
    <Modal
      isOpen={isBookingModalOpen}
      onClose={closeBookingModal}
      title="새 상담 예약"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* 피코치 정보 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <User className="w-4 h-4 inline mr-1" />
            피코치
          </label>
          {bookingCoachee ? (
            <div className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              {bookingCoachee.name} {bookingCoachee.email ? `(${bookingCoachee.email})` : ''}
            </div>
          ) : coacheesLoading ? (
            <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              피코치 목록 불러오는 중...
            </div>
          ) : coachees.length === 0 ? (
            <div className="w-full px-3 py-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              매칭된 피코치가 없습니다. 먼저 피코치를 매칭해주세요.
            </div>
          ) : (
            <select
              name="coacheeId"
              value={formData.coacheeId}
              onChange={(e) => {
                const selected = coachees.find(c => (c.user_id || c.id) === e.target.value)
                setFormData(prev => ({
                  ...prev,
                  coacheeId: e.target.value,
                  coacheeName: selected?.name || ''
                }))
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">피코치를 선택하세요</option>
              {coachees.map((coachee) => (
                <option key={coachee.user_id || coachee.id} value={coachee.user_id || coachee.id}>
                  {coachee.name} {coachee.email ? `(${coachee.email})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 날짜 & 시간 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1" />
              날짜
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={today}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Clock className="w-4 h-4 inline mr-1" />
              시간
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* 상담 시간 & 유형 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              상담 시간
            </label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={30}>30분</option>
              <option value={60}>60분</option>
              <option value={90}>90분</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              상담 유형
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600">
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">메시지 상담</span>
            </div>
          </div>
        </div>

        {/* 회기 번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            회기 번호
          </label>
          <input
            type="number"
            name="sessionNumber"
            value={formData.sessionNumber}
            onChange={handleChange}
            min={1}
            max={20}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* 상담 주제 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            상담 주제
          </label>
          <select
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">주제를 선택하세요</option>
            {SESSION_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        {/* 기타 주제 입력 */}
        {formData.topic === '기타' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              직접 입력
            </label>
            <input
              type="text"
              name="customTopic"
              value={formData.customTopic}
              onChange={handleChange}
              placeholder="상담 주제를 입력하세요"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={closeBookingModal}
            className="flex-1"
          >
            취소
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? '예약 중...' : '예약하기'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
