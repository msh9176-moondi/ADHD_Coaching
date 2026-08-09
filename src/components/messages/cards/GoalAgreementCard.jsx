import { Badge } from '../../common/Badge'
import { FileText, CheckCircle, ChevronRight } from 'lucide-react'

export function GoalAgreementCard({ message, userRole, isOwn, onView, onAgree }) {
  const { goalData } = message

  // goalData가 없으면 렌더링하지 않음
  if (!goalData) {
    return null
  }

  const { version = 1, status, goals = [], agreedBy = [] } = goalData

  const isConfirmed = status === 'confirmed'
  const isRevised = status === 'revised'
  const hasAgreed = agreedBy.includes(userRole)
  const otherAgreed = agreedBy.includes(userRole === 'coach' ? 'coachee' : 'coach')

  const getStatusStyle = () => {
    if (isConfirmed) return { border: 'border-green-200', bg: 'bg-green-50', header: 'bg-green-100', icon: 'text-green-600', text: 'text-green-800' }
    if (isRevised) return { border: 'border-gray-200', bg: 'bg-gray-50', header: 'bg-gray-100', icon: 'text-gray-400', text: 'text-gray-500' }
    return { border: 'border-blue-200', bg: 'bg-white', header: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-800' }
  }
  const style = getStatusStyle()

  const getStatusBadge = () => {
    if (isConfirmed) return { label: '합의 완료', variant: 'success' }
    if (isRevised) return { label: '수정됨', variant: 'secondary' }
    if (otherAgreed) return { label: '상대방 동의함', variant: 'primary' }
    return { label: `v${version}`, variant: 'warning' }
  }
  const badge = getStatusBadge()

  return (
    <div className={`w-56 rounded-xl border-2 overflow-hidden text-sm ${style.border} ${style.bg} ${isRevised ? 'opacity-60' : ''}`}>
      {/* 헤더 */}
      <div className={`px-3 py-2 flex items-center justify-between ${style.header}`}>
        <div className="flex items-center gap-1.5">
          <FileText className={`w-4 h-4 ${style.icon}`} />
          <span className={`font-medium ${style.text}`}>목표 합의서</span>
        </div>
        <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
      </div>

      {/* 요약 내용 */}
      <div className="p-3 space-y-2">
        {goals.map((goal, index) => (
          <div key={goal.id || index} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
            <span className="truncate">{goal.topic || `목표 ${index + 1}`}</span>
          </div>
        ))}

        {!isConfirmed && !isRevised && agreedBy.length > 0 && (
          <div className="flex gap-1.5 text-xs pt-1">
            {agreedBy.includes('coach') && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">코치 동의</span>
            )}
            {agreedBy.includes('coachee') && (
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full">피코치 동의</span>
            )}
          </div>
        )}

        {/* 내용 확인 및 동의 버튼 */}
        {!isConfirmed && !isRevised && !hasAgreed && (
          <div className="flex gap-2 mt-1">
            <button
              onClick={onView}
              className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              내용 확인
            </button>
            <button
              onClick={onAgree}
              className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              동의
            </button>
          </div>
        )}

        {/* 이미 동의한 경우 */}
        {!isConfirmed && !isRevised && hasAgreed && (
          <div className="text-center text-xs text-blue-600 pt-1">
            상대방 확인 대기중
          </div>
        )}

        {/* 확정 완료 */}
        {isConfirmed && (
          <div className="flex items-center justify-center gap-1 text-green-600 text-xs pt-1">
            <CheckCircle className="w-3 h-3" /> 양측 합의 완료
          </div>
        )}
      </div>
    </div>
  )
}
