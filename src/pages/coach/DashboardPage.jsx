import { CoachDashboard } from '../../components/coach/CoachDashboard'
import { PageHeader } from '../../components/common/PageHeader'

export function CoachDashboardPage() {
  return (
    <div>
      <PageHeader
        title="대시보드"
        description="담당 피코치 현황과 오늘의 상담 일정을 확인하세요."
      />
      <CoachDashboard />
    </div>
  )
}
