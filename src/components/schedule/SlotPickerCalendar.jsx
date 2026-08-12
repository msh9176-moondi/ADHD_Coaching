/**
 * 슬롯 선택 캘린더 (피코치용)
 * 코치의 가용 시간 슬롯을 날짜별로 표시하고 선택
 */

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react'
import { getAvailableDates, getAvailableSlotsByDate } from '../../lib/availabilityService'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function SlotPickerCalendar({ coachId, selectedSlot, onSelectSlot }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [availableDates, setAvailableDates] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  // 가용 날짜 로드
  useEffect(() => {
    loadAvailableDates()
  }, [coachId, year, month])

  const loadAvailableDates = async () => {
    if (!coachId) return
    setLoading(true)
    try {
      const dates = await getAvailableDates(coachId, year, month)
      setAvailableDates(dates)
    } catch (err) {
      console.error('가용 날짜 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  // 날짜 선택 시 슬롯 로드
  const handleDateSelect = async (dateStr) => {
    setSelectedDate(dateStr)
    onSelectSlot(null) // 슬롯 선택 초기화

    if (!dateStr) return

    setSlotsLoading(true)
    try {
      const dateSlots = await getAvailableSlotsByDate(coachId, dateStr)
      setSlots(dateSlots)
    } catch (err) {
      console.error('슬롯 로드 실패:', err)
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  // 슬롯 선택
  const handleSlotSelect = (slot) => {
    onSelectSlot(slot)
  }

  // 캘린더 날짜 생성
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startWeekday = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    const today = new Date().toISOString().split('T')[0]

    const days = []

    // 이전 달 빈 칸
    for (let i = 0; i < startWeekday; i++) {
      days.push({ date: null, isCurrentMonth: false })
    }

    // 현재 달
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const hasSlots = availableDates.includes(dateStr)
      const isPast = dateStr < today

      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        isToday: dateStr === today,
        isPast,
        hasSlots: hasSlots && !isPast
      })
    }

    return days
  }, [year, month, availableDates])

  // 이전/다음 달
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1))
    setSelectedDate(null)
    setSlots([])
    onSelectSlot(null)
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1))
    setSelectedDate(null)
    setSlots([])
    onSelectSlot(null)
  }

  // 시간 포맷
  const formatTime = (time) => {
    if (!time) return ''
    return time.slice(0, 5)
  }

  return (
    <div className="space-y-4">
      {/* 캘린더 */}
      <div className="select-none">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <h3 className="font-medium text-gray-900 text-sm">
            {year}년 {month}월
          </h3>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className={`text-center text-xs py-1 ${
                idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((dayInfo, idx) => {
            if (!dayInfo.date) {
              return <div key={idx} className="aspect-square" />
            }

            const isSelected = selectedDate === dayInfo.date

            return (
              <button
                type="button"
                key={dayInfo.date}
                onClick={() => dayInfo.hasSlots && handleDateSelect(dayInfo.date)}
                disabled={!dayInfo.hasSlots}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-md text-xs relative
                  transition-all
                  ${dayInfo.isPast || !dayInfo.hasSlots ? 'text-gray-300 cursor-default' : 'text-gray-700'}
                  ${dayInfo.hasSlots && !isSelected ? 'hover:bg-emerald-50 cursor-pointer' : ''}
                  ${dayInfo.isToday && !isSelected ? 'font-bold text-emerald-600' : ''}
                  ${isSelected ? 'bg-emerald-500 text-white' : ''}
                `}
              >
                <span>{dayInfo.day}</span>
                {dayInfo.hasSlots && !isSelected && (
                  <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </button>
            )
          })}
        </div>

        {/* 범례 */}
        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>예약 가능</span>
        </div>
      </div>

      {/* 슬롯 목록 */}
      {selectedDate && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {new Date(selectedDate).getMonth() + 1}월 {new Date(selectedDate).getDate()}일 가능한 시간
          </h4>

          {slotsLoading ? (
            <div className="py-4 text-center text-gray-400">
              <Loader2 className="w-4 h-4 mx-auto animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <div className="py-4 text-center text-gray-400 text-sm">
              선택 가능한 시간이 없습니다
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {slots.map(slot => {
                const isSelected = selectedSlot?.id === slot.id
                return (
                  <button
                    type="button"
                    key={slot.id}
                    onClick={() => handleSlotSelect(slot)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all
                      ${isSelected
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                      }
                    `}
                  >
                    <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                    <span>
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
