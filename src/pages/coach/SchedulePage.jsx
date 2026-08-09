import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SessionSchedule } from '../../components/schedule/SessionSchedule'
import { SessionBookingModal } from '../../components/schedule/SessionBookingModal'
import { Button } from '../../components/common/Button'
import { PageHeader } from '../../components/common/PageHeader'
import { useStore } from '../../store/useStore'
import { coacheeService } from '../../lib'
import { Calendar } from 'lucide-react'

export function CoachSchedulePage() {
  const [searchParams] = useSearchParams()
  const preselectedCoacheeId = searchParams.get('coachee')
  const { user, openBookingModal } = useStore()
  const [coacheesLoaded, setCoacheesLoaded] = useState(false)

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
          }
          setCoacheesLoaded(true)
        } catch (err) {
          console.warn('피코치 로드 실패:', err)
        }
      }
    }
    loadAndOpenModal()
  }, [preselectedCoacheeId, user?.id, coacheesLoaded, openBookingModal])

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="일정 관리"
        description="상담 일정을 관리하고 가능한 시간을 설정하세요."
      >
        <Button onClick={() => openBookingModal()}>
          <Calendar className="w-4 h-4 mr-2" />
          새 상담 예약
        </Button>
      </PageHeader>

      <SessionSchedule userRole="coach" />
      <SessionBookingModal />
    </div>
  )
}
