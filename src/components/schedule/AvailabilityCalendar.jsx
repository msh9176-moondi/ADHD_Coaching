/**
 * 가용 시간 캘린더 컴포넌트 (코치용)
 * 월별 캘린더에서 슬롯이 있는 날짜 표시 및 날짜 선택
 */

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getSlotCountsByMonth } from '../../lib/availabilityService'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function AvailabilityCalendar({ coachId, selectedDate, onSelectDate }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [slotCounts, setSlotCounts] = useState({})
  const [loading, setLoading] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  // 슬롯 개수 로드
  useEffect(() => {
    loadSlotCounts()
  }, [coachId, year, month])

  const loadSlotCounts = async () => {
    if (!coachId) return
    setLoading(true)
    try {
      const counts = await getSlotCountsByMonth(coachId, year, month)
      setSlotCounts(counts)
    } catch (err) {
      console.error('슬롯 개수 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  // 캘린더 날짜 생성
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startWeekday = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []

    // 이전 달 빈 칸
    for (let i = 0; i < startWeekday; i++) {
      days.push({ date: null, isCurrentMonth: false })
    }

    // 현재 달
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        isToday: dateStr === new Date().toISOString().split('T')[0],
        isPast: new Date(dateStr) < new Date(new Date().toDateString()),
        slots: slotCounts[dateStr] || null
      })
    }

    return days
  }, [year, month, slotCounts])

  // 이전/다음 달
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1))
  }

  // 날짜 클릭
  const handleDateClick = (dateStr) => {
    if (!dateStr) return
    onSelectDate(dateStr)
  }

  // 슬롯 개수에 따른 색상
  const getSlotColor = (slots) => {
    if (!slots) return ''
    if (slots.available > 0) {
      if (slots.available >= 3) return 'bg-emerald-500'
      if (slots.available >= 2) return 'bg-emerald-400'
      return 'bg-emerald-300'
    }
    if (slots.booked > 0) return 'bg-purple-400'
    return ''
  }

  return (
    <div className="select-none">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="font-semibold text-gray-900">
          {year}년 {month}월
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-2">
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
        {calendarDays.map((dayInfo, idx) => {
          if (!dayInfo.date) {
            return <div key={idx} className="aspect-square" />
          }

          const isSelected = selectedDate === dayInfo.date
          const hasSlots = dayInfo.slots && (dayInfo.slots.available > 0 || dayInfo.slots.booked > 0)
          const slotColor = getSlotColor(dayInfo.slots)

          return (
            <button
              key={dayInfo.date}
              onClick={() => handleDateClick(dayInfo.date)}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative
                transition-all
                ${dayInfo.isPast ? 'text-gray-300' : 'text-gray-700'}
                ${dayInfo.isToday ? 'font-bold' : ''}
                ${isSelected
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                  : 'hover:bg-gray-100'
                }
              `}
            >
              {/* 날짜 */}
              <span className={dayInfo.isToday && !isSelected ? 'text-emerald-600' : ''}>
                {dayInfo.day}
              </span>

              {/* 슬롯 표시 */}
              {hasSlots && !isSelected && (
                <div className="absolute bottom-1 flex gap-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${slotColor}`} />
                  {dayInfo.slots.booked > 0 && dayInfo.slots.available > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  )}
                </div>
              )}

              {/* 선택된 날짜의 슬롯 개수 */}
              {isSelected && dayInfo.slots && (
                <span className="text-[10px] text-emerald-100">
                  {dayInfo.slots.total}개
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>예약 가능</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-400" />
          <span>예약됨</span>
        </div>
      </div>
    </div>
  )
}
