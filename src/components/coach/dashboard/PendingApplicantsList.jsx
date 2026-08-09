import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { Avatar } from '../../common/Avatar'
import { Button } from '../../common/Button'
import { useStore } from '../../../store/useStore'
import { coacheeService } from '../../../lib'
import { PACKAGE_COLORS } from '../../../constants/styles'

const PACKAGE_INFO = {
  starter: { name: '스타터', sessions: 3 },
  basic: { name: '베이직', sessions: 5 },
  premium: { name: '프리미엄', sessions: 10 }
}

export function PendingApplicantsList({ applicants = [] }) {
  const navigate = useNavigate()
  const { user } = useStore()

  const handleAccept = async (applicant) => {
    try {
      await coacheeService.matchCoachee(applicant.id, user?.id, applicant.package_type)
      window.location.reload()
    } catch (err) {
      console.error('매칭 실패:', err)
      alert('매칭 처리 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="space-y-3">
      {applicants.map((applicant) => {
        const pkgInfo = PACKAGE_INFO[applicant.package_type] || { name: '미정', sessions: 0 }
        const pkgColor = PACKAGE_COLORS[applicant.package_type] || 'bg-gray-100 text-gray-700'

        return (
          <div
            key={applicant.id}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-green-200"
          >
            <div className="flex items-center gap-4">
              <Avatar name={applicant.name} size="sm" />
              <div>
                <p className="font-medium text-gray-900">{applicant.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${pkgColor}`}>
                    {pkgInfo.name} {pkgInfo.sessions}회기
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(applicant.created_at).toLocaleDateString('ko-KR')} 신청
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/coach/coachees/${applicant.id}`)}
              >
                상세보기
              </Button>
              <Button
                size="sm"
                onClick={() => handleAccept(applicant)}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                수락
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
