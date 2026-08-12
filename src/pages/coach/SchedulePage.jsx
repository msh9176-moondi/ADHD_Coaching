import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SessionSchedule } from '../../components/schedule/SessionSchedule'
import { SessionBookingModal } from '../../components/schedule/SessionBookingModal'
import { AvailabilityManager } from '../../components/schedule/AvailabilityManager'
import { Button } from '../../components/common/Button'
import { PageHeader } from '../../components/common/PageHeader'
import { useStore } from '../../store/useStore'
import { coacheeService } from '../../lib'
import { Calendar, Clock, CalendarCheck } from 'lucide-react'

export function CoachSchedulePage() {
  const [searchParams] = useSearchParams()
  const preselectedCoacheeId = searchParams.get('coachee')
  const { user, openBookingModal } = useStore()
  const [coacheesLoaded, setCoacheesLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState('availability') // 'availability' | 'sessions'

  // URL 파라미터로 피코치가 전달되면 자동으로 예약 모달 열기
  useEffect(() => {
    async function loadAndOpenModal() {
      if (preselectedCoacheeId && !coacheesLoaded) {
        try {
          const data = await coacheeService.getCoachCoachees(user?.id)
          const coachee = data.find(c => c.id === preselectedCoacheeId || c.user_id === preselectedCoacheeId)
          if (coachee) {
            openBookingModal({
              id: coachee.user_id || coachee.id,
              name: coachee.name,
              email: coachee.email
            })
            setActiveTab('sessions') // 예약 모달 열면 예약된 상담 탭으로
          }
          setCoacheesLoaded(true)
        } catch (err) {
          console.warn('피코치 로드 실패:', err)
        }
      }
    }
    loadAndOpenModal()
  }, [preselectedCoacheeId, user?.id, coacheesLoaded, openBookingModal])

  const tabs = [
    { id: 'availability', label: '가용 시간 설정', icon: Clock },
    { id: 'sessions', label: '예약된 상담', icon: CalendarCheck }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="일정 관리"
        description="상담 가능 시간을 설정하고 예약된 상담을 관리하세요."
      >
        {activeTab === 'sessions' && (
          <Button onClick={() => openBookingModal()}>
            <Calendar className="w-4 h-4 mr-2" />
            새 상담 예약
          </Button>
        )}
      </PageHeader>

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'availability' ? (
        <AvailabilityManager coachId={user?.id} />
      ) : (
        <div className="max-w-4xl">
          <SessionSchedule userRole="coach" />
        </div>
      )}

      <SessionBookingModal />
    </div>
  )
}
