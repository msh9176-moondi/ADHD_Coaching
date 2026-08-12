/**
 * 시간 슬롯 관리 컴포넌트 (코치용)
 * 특정 날짜의 가용 시간 슬롯을 추가/삭제
 */

import { useState, useEffect } from 'react'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import {
  Plus, Trash2, Clock, User, Loader2, AlertCircle, Check
} from 'lucide-react'
import {
  addAvailableSlot,
  deleteSlot,
  getCoachSlotsByDate
} from '../../lib/availabilityService'

// 시간 옵션 (30분 단위)
const TIME_OPTIONS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
]

// 상담 시간 옵션
const DURATION_OPTIONS = [
  { value: 30, label: '30분' },
  { value: 60, label: '60분' },
  { value: 90, label: '90분' }
]

// 빠른 추가 프리셋
const QUICK_PRESETS = [
  { label: '오전 (9-12시)', slots: [
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' }
  ]},
  { label: '오후 (14-18시)', slots: [
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' }
  ]},
  { label: '저녁 (19-21시)', slots: [
    { start: '19:00', end: '20:00' },
    { start: '20:00', end: '21:00' }
  ]}
]

export function TimeSlotManager({ coachId, date, onSlotsChange }) {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 새 슬롯 폼 상태
  const [startTime, setStartTime] = useState('14:00')
  const [duration, setDuration] = useState(60)

  // 날짜가 바뀌면 슬롯 로드
  useEffect(() => {
    loadSlots()
  }, [coachId, date])

  const loadSlots = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getCoachSlotsByDate(coachId, date)
      setSlots(data)
      onSlotsChange?.(data)
    } catch (err) {
      setError('슬롯을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 종료 시간 계산
  const calculateEndTime = (start, dur) => {
    const [h, m] = start.split(':').map(Number)
    const totalMinutes = h * 60 + m + dur
    const endH = Math.floor(totalMinutes / 60)
    const endM = totalMinutes % 60
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  }

  // 슬롯 추가
  const handleAddSlot = async () => {
    setAdding(true)
    setError('')
    setSuccess('')

    try {
      const endTime = calculateEndTime(startTime, duration)
      await addAvailableSlot(coachId, {
        date,
        startTime,
        endTime,
        duration
      })
      setSuccess('슬롯이 추가되었습니다.')
      await loadSlots()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  // 빠른 추가 (프리셋)
  const handleQuickAdd = async (preset) => {
    setAdding(true)
    setError('')
    setSuccess('')

    try {
      for (const slot of preset.slots) {
        // 이미 있는 시간은 스킵
        const exists = slots.some(s => s.start_time === slot.start + ':00')
        if (!exists) {
          await addAvailableSlot(coachId, {
            date,
            startTime: slot.start,
            endTime: slot.end,
            duration: 60
          })
        }
      }
      setSuccess('슬롯이 추가되었습니다.')
      await loadSlots()
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  // 슬롯 삭제
  const handleDeleteSlot = async (slotId) => {
    setDeletingId(slotId)
    setError('')

    try {
      await deleteSlot(slotId, coachId)
      await loadSlots()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  // 시간 포맷
  const formatTime = (time) => {
    if (!time) return ''
    return time.slice(0, 5)
  }

  // 날짜 포맷
  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
  }

  const isPastDate = new Date(date) < new Date(new Date().toDateString())

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          {formatDate(date)}
        </h3>
        <Badge variant={isPastDate ? 'secondary' : 'success'}>
          {isPastDate ? '지난 날짜' : `${slots.length}개 슬롯`}
        </Badge>
      </div>

      {/* 에러/성공 메시지 */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* 슬롯 추가 폼 */}
      {!isPastDate && (
        <div className="p-4 bg-gray-50 rounded-xl space-y-4">
          <h4 className="text-sm font-medium text-gray-700">새 슬롯 추가</h4>

          {/* 시간 선택 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">시작 시간</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {TIME_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">상담 시간</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {DURATION_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 추가 버튼 */}
          <Button
            onClick={handleAddSlot}
            disabled={adding}
            className="w-full"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {startTime} - {calculateEndTime(startTime, duration)} 슬롯 추가
          </Button>

          {/* 빠른 추가 */}
          <div>
            <p className="text-xs text-gray-500 mb-2">빠른 추가</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAdd(preset)}
                  disabled={adding}
                  className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors disabled:opacity-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 슬롯 목록 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          등록된 슬롯
        </h4>

        {loading ? (
          <div className="py-8 text-center text-gray-400">
            <Loader2 className="w-5 h-5 mx-auto animate-spin" />
          </div>
        ) : slots.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            등록된 슬롯이 없습니다
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map(slot => (
              <div
                key={slot.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  slot.is_booked
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className={`w-4 h-4 ${slot.is_booked ? 'text-purple-500' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {slot.duration}분 상담
                    </p>
                  </div>
                </div>

                {slot.is_booked ? (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-xs text-purple-600 font-medium">
                      {slot.booked_user?.name || '예약됨'}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    disabled={deletingId === slot.id || isPastDate}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === slot.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
