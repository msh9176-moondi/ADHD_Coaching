import { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { useStore } from '../../store/useStore'
import { coacheeService } from '../../lib'
import { bookSlot } from '../../lib/availabilityService'
import { SlotPickerCalendar } from './SlotPickerCalendar'
import { Clock, MessageSquare, User, Loader2, CalendarCheck } from 'lucide-react'

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
    matchedCoach,
    coacheeProfile,
  } = useStore()

  // 역할 판단 및 코치 ID 결정
  const isCoachee = user?.role === 'coachee'
  // 피코치인 경우: 담당 코치의 슬롯을 보여줌
  // 코치인 경우: 자신의 슬롯을 보여줌
  const targetCoachId = isCoachee
    ? (coacheeProfile?.coach_id || matchedCoach?.id || matchedCoach?.user_id)
    : user?.id

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
  const [selectedSlot, setSelectedSlot] = useState(null)
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
      setSelectedSlot(null)
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
    // 코치가 예약하는 경우에만 피코치 선택 필요
    if (!isCoachee && !formData.coacheeId) {
      setError('피코치를 선택해주세요.')
      return
    }
    if (!selectedSlot) {
      setError('상담 시간을 선택해주세요.')
      return
    }
    // 코치만 주제 필수
    if (!isCoachee && !formData.topic) {
      setError('상담 주제를 선택해주세요.')
      return
    }

    setIsLoading(true)

    try {
      // 피코치가 예약하는 경우: 자신이 coachee, 담당 코치가 coach
      // 코치가 예약하는 경우: 선택한 피코치가 coachee, 자신이 coach
      const finalCoacheeId = isCoachee ? user?.id : formData.coacheeId
      const finalCoacheeName = isCoachee ? user?.name : formData.coacheeName
      const finalCoachId = isCoachee ? targetCoachId : user?.id

      const sessionData = {
        coach_id: finalCoachId || 'demo-coach',
        coachee_id: finalCoacheeId,
        coachee_name: finalCoacheeName,
        date: selectedSlot.date,
        time: selectedSlot.start_time.slice(0, 5),
        duration: selectedSlot.duration,
        type: formData.type,
        session_number: isCoachee ? 1 : formData.sessionNumber, // 피코치는 기본값
        topic: isCoachee ? '상담 예약' : (formData.topic === '기타' ? formData.customTopic : formData.topic),
        status: 'scheduled',
      }

      // 슬롯 예약 (슬롯 상태 업데이트 + 세션 생성)
      try {
        console.log('[세션 예약] 슬롯 예약 시도:', selectedSlot.id, sessionData)
        const result = await bookSlot(selectedSlot.id, finalCoacheeId, sessionData)
        console.log('[세션 예약] 슬롯 예약 성공:', result)

        if (result.session) {
          // store의 sessions를 업데이트 (중복 방지를 위해 ID 체크)
          const currentSessions = useStore.getState().sessions
          const isDuplicate = currentSessions.some(s => s.id === result.session.id)
          if (!isDuplicate) {
            addSession(result.session)
          }
        }
      } catch (bookError) {
        // 슬롯 예약 실패 (이미 예약된 경우 등)
        console.error('[세션 예약] 슬롯 예약 실패:', bookError)
        setError(bookError.message || '예약에 실패했습니다. 다른 시간을 선택해주세요.')
        setIsLoading(false)
        return
      }

      closeBookingModal()
    } catch (err) {
      setError('예약 중 오류가 발생했습니다. 다시 시도해주세요.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

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

        {/* 피코치 정보 - 피코치 본인이 예약할 때는 숨김 */}
        {!isCoachee && (
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
        )}

        {/* 상담 시간 선택 (코치 가용 시간에서 선택) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CalendarCheck className="w-4 h-4 inline mr-1" />
            상담 시간 선택
          </label>
          {targetCoachId ? (
            <div className="p-3 border border-gray-200 rounded-xl bg-gray-50">
              <SlotPickerCalendar
                coachId={targetCoachId}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
              />
            </div>
          ) : isCoachee ? (
            <div className="p-4 text-center text-yellow-700 text-sm bg-yellow-50 border border-yellow-200 rounded-xl">
              담당 코치가 아직 배정되지 않았습니다. 코치 매칭 후 이용해주세요.
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm bg-gray-50 rounded-xl">
              코치 정보를 불러오는 중...
            </div>
          )}
          {selectedSlot && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                {selectedSlot.date} {selectedSlot.start_time?.slice(0, 5)} - {selectedSlot.end_time?.slice(0, 5)} ({selectedSlot.duration}분)
              </span>
            </div>
          )}
        </div>

        {/* 상담 유형 - 코치만 표시 */}
        {!isCoachee && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              상담 유형
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600">
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">메시지 상담</span>
            </div>
          </div>
        )}

        {/* 회기 번호 - 코치만 표시 */}
        {!isCoachee && (
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
        )}

        {/* 상담 주제 - 코치만 표시 */}
        {!isCoachee && (
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
        )}

        {/* 기타 주제 입력 - 코치만 표시 */}
        {!isCoachee && formData.topic === '기타' && (
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
