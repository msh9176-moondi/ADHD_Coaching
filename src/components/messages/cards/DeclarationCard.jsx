import { Badge } from '../../common/Badge'
import { ScrollText, CheckCircle, ChevronRight } from 'lucide-react'

export function DeclarationCard({ message, userRole, onView }) {
  const { declarationData } = message

  // declarationData가 없으면 렌더링하지 않음
  if (!declarationData) {
    return null
  }

  const { status, coacheeAgreed, coachAgreed } = declarationData

  const isCompleted = status === 'completed'

  const getStatusInfo = () => {
    if (isCompleted) return { label: '완료', variant: 'success', color: 'green' }
    if (status === 'pending_coach') return { label: '코치 확인 대기', variant: 'warning', color: 'amber' }
    return { label: '피코치 확인 대기', variant: 'primary', color: 'blue' }
  }
  const statusInfo = getStatusInfo()

  const needsAction = (userRole === 'coachee' && !coacheeAgreed) || (userRole === 'coach' && coacheeAgreed && !coachAgreed)

  return (
    <div className={`w-56 rounded-xl border-2 overflow-hidden text-sm ${
      isCompleted ? 'border-green-200 bg-green-50' : 'border-purple-200 bg-white'
    }`}>
      <div className={`px-3 py-2 flex items-center justify-between ${
        isCompleted ? 'bg-green-100' : 'bg-purple-50'
      }`}>
        <div className="flex items-center gap-1.5">
          <ScrollText className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-purple-600'}`} />
          <span className={`font-medium ${isCompleted ? 'text-green-800' : 'text-purple-800'}`}>
            참여 선언서
          </span>
        </div>
        <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
      </div>

      <div className="p-3 space-y-2">
        <p className="text-xs text-gray-600">
          코치와 피코치의 역할과 코칭 원칙을 확인하는 약속입니다.
        </p>

        {/* 동의 상태 */}
        <div className="flex gap-1.5 text-xs">
          {coacheeAgreed && (
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> 피코치
            </span>
          )}
          {coachAgreed && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> 코치
            </span>
          )}
        </div>

        {/* 확인하기 버튼 */}
        {!isCompleted && needsAction && (
          <button
            onClick={onView}
            className="w-full mt-1 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            내용 확인하기
          </button>
        )}

        {isCompleted && (
          <div className="flex items-center justify-center gap-1 text-green-600 text-xs pt-1">
            <CheckCircle className="w-3 h-3" /> 양측 동의 완료
          </div>
        )}
      </div>
    </div>
  )
}
