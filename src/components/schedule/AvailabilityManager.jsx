/**
 * 가용 시간 관리 메인 컴포넌트 (코치용)
 * 캘린더 + 시간 슬롯 관리를 조합
 */

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '../common/Card'
import { AvailabilityCalendar } from './AvailabilityCalendar'
import { TimeSlotManager } from './TimeSlotManager'
import { Calendar, Clock, Info } from 'lucide-react'

export function AvailabilityManager({ coachId }) {
  const [selectedDate, setSelectedDate] = useState(null)
  const [slots, setSlots] = useState([])

  // 오늘 날짜를 기본 선택
  const handleDateSelect = (date) => {
    setSelectedDate(date)
  }

  return (
    <div className="space-y-6">
      {/* 안내 메시지 */}
      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-700">
          <p className="font-medium mb-1">상담 가능 시간 설정</p>
          <p className="text-emerald-600">
            캘린더에서 날짜를 선택하고 상담 가능한 시간을 등록하세요.
            피코치가 등록된 시간 중에서 선택하여 예약할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 메인 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: 캘린더 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-gray-900">날짜 선택</h2>
            </div>
          </CardHeader>
          <CardContent>
            <AvailabilityCalendar
              coachId={coachId}
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
            />
          </CardContent>
        </Card>

        {/* 우측: 시간 슬롯 관리 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-gray-900">시간 슬롯</h2>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <TimeSlotManager
                coachId={coachId}
                date={selectedDate}
                onSlotsChange={setSlots}
              />
            ) : (
              <div className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">
                  캘린더에서 날짜를 선택하세요
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  선택한 날짜에 상담 가능 시간을 등록할 수 있습니다
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
