import { SessionSchedule } from '../../components/schedule/SessionSchedule'
import { PageHeader } from '../../components/common/PageHeader'

export function SchedulePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="상담 일정"
        description="예정된 상담 일정을 확인하고 새 상담을 예약하세요."
      />
      <SessionSchedule userRole="coachee" />
    </div>
  )
}
