import { useState, useMemo } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import {
  Calendar, Clock, MessageSquare, ChevronLeft, ChevronRight,
  Loader2, CheckCircle, AlertCircle
} from 'lucide-react'

// 시간대 옵션
const TIME_SLOTS = [
  { id: 'morning', label: '오전', times: ['09:00', '10:00', '11:00'] },
  { id: 'afternoon', label: '오후', times: ['14:00', '15:00', '16:00', '17:00'] },
  { id: 'evening', label: '저녁', times: ['19:00', '20:00'] }
]

// 요일 이름
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function SubscriberSessionBookingModal({
  isOpen,
  onClose,
  subscription,
  coachName,
  onBook
}) {
  const [step, setStep] = useState(1) // 1: 날짜, 2: 시간, 3: 주제
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [topic, setTopic] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const sessionsRemaining = subscription
    ? subscription.sessions_per_month - subscription.sessions_used_this_month
    : 0

  // 캘린더 날짜 생성
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startWeekday = firstDay.getDay()

    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 이전 달 빈 칸
    for (let i = 0; i < startWeekday; i++) {
      days.push({ date: null, isDisabled: true })
    }

    // 현재 달
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const isPast = date < today
      const isTooFar = date > new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

      days.push({
        date,
        day: d,
        weekday: date.getDay(),
        isDisabled: isWeekend || isPast || isTooFar,
        isToday: date.toDateString() === today.toDateString()
      })
    }

    return days
  }, [currentMonth])

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleDateSelect = (day) => {
    if (day.isDisabled || !day.date) return
    setSelectedDate(day.date)
    setStep(2)
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time)
    setStep(3)
  }

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return

    setIsSubmitting(true)
    try {
      const bookingData = {
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        topic: topic.trim() || '사후관리 세션'
      }

      await onBook?.(bookingData)
      onClose()
      resetForm()
    } catch (error) {
      console.error('예약 실패:', error)
      alert('예약에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedDate(null)
    setSelectedTime(null)
    setTopic('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const formatSelectedDate = (date) => {
    if (!date) return ''
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="세션 예약">
      <div className="space-y-6">
        {/* 남은 세션 표시 */}
        <div className={`p-3 rounded-xl flex items-center gap-3 ${
          sessionsRemaining > 0 ? 'bg-emerald-50' : 'bg-red-50'
        }`}>
          {sessionsRemaining > 0 ? (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  이번 달 {sessionsRemaining}회 예약 가능
                </p>
                <p className="text-xs text-emerald-600">
                  {coachName} 코치님과 세션을 예약하세요
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  이번 달 세션을 모두 사용했습니다
                </p>
                <p className="text-xs text-red-600">
                  다음 달에 다시 예약해주세요
                </p>
              </div>
            </>
          )}
        </div>

        {sessionsRemaining > 0 && (
          <>
            {/* 스텝 표시 */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? 'bg-emerald-600 text-white'
                      : step > s
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`w-8 h-0.5 ${step > s ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: 날짜 선택 */}
            {step === 1 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h3 className="font-semibold text-gray-900">
                    {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                  </h3>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {WEEKDAYS.map((day, idx) => (
                    <div
                      key={day}
                      className={`text-center text-xs font-medium py-2 ${
                        idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-gray-500'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* 날짜 그리드 */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleDateSelect(day)}
                      disabled={day.isDisabled}
                      className={`aspect-square p-2 rounded-lg text-sm font-medium transition-colors ${
                        !day.date
                          ? ''
                          : day.isDisabled
                            ? 'text-gray-300 cursor-not-allowed'
                            : selectedDate?.toDateString() === day.date.toDateString()
                              ? 'bg-emerald-600 text-white'
                              : day.isToday
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  주말 및 30일 이후는 선택할 수 없습니다
                </p>
              </div>
            )}

            {/* Step 2: 시간 선택 */}
            {step === 2 && (
              <div>
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-emerald-600 text-sm mb-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  날짜 다시 선택
                </button>

                <div className="p-3 bg-gray-50 rounded-lg mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {formatSelectedDate(selectedDate)}
                  </span>
                </div>

                <h4 className="text-sm font-medium text-gray-700 mb-3">시간을 선택하세요</h4>

                <div className="space-y-4">
                  {TIME_SLOTS.map((slot) => (
                    <div key={slot.id}>
                      <p className="text-xs text-gray-500 mb-2">{slot.label}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {slot.times.map((time) => (
                          <button
                            key={time}
                            onClick={() => handleTimeSelect(time)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                              selectedTime === time
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: 주제 입력 */}
            {step === 3 && (
              <div>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-emerald-600 text-sm mb-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  시간 다시 선택
                </button>

                <div className="p-3 bg-gray-50 rounded-lg mb-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {formatSelectedDate(selectedDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{selectedTime}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    이번 세션에서 다루고 싶은 주제 (선택)
                  </label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="예: 최근 실행력이 떨어진 것 같아요, 새로운 목표 설정이 필요해요..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    rows={3}
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                  >
                    취소
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        예약 중...
                      </>
                    ) : (
                      '예약 완료'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {sessionsRemaining <= 0 && (
          <div className="text-center py-4">
            <Button variant="outline" onClick={handleClose}>
              닫기
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
