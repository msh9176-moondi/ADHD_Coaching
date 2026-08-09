import { useNavigate } from 'react-router-dom'
import { Users, TrendingUp } from 'lucide-react'
import { Avatar } from '../../common/Avatar'
import { ProgressBar } from '../../common/ProgressBar'
import { PACKAGES } from '../../../data/coachData'
import { PACKAGE_COLORS } from '../../../constants/styles'

export function CoacheeQuickList({ coachees = [] }) {
  const navigate = useNavigate()

  if (coachees.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="mb-2">아직 등록된 피코치가 없습니다.</p>
        <p className="text-sm text-gray-400">피코치가 신청하면 이곳에 표시됩니다.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b">
            <th className="pb-3 font-medium">피코치</th>
            <th className="pb-3 font-medium">패키지</th>
            <th className="pb-3 font-medium">진행 상태</th>
            <th className="pb-3 font-medium">다음 상담</th>
            <th className="pb-3 font-medium">점수 변화</th>
            <th className="pb-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {coachees.map((coachee) => {
            const pkg = coachee.packageType ? PACKAGES[coachee.packageType] : null
            const pkgColor = PACKAGE_COLORS[coachee.packageType] || ''

            return (
              <tr key={coachee.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={coachee.name} size="sm" />
                    <div>
                      <p className="font-medium text-gray-900">{coachee.name}</p>
                      {coachee.hasWarning && (
                        <span className="text-xs text-yellow-600">주의 필요</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  {pkg && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${pkgColor}`}>
                      {pkg.name} {pkg.sessions}회기
                    </span>
                  )}
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <ProgressBar
                      current={coachee.currentSession}
                      total={coachee.totalSessions}
                      color="blue"
                      size="sm"
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">
                      {Math.min(coachee.currentSession, coachee.totalSessions)}/{coachee.totalSessions}
                      {coachee.currentSession > coachee.totalSessions && ' ✓'}
                    </span>
                  </div>
                </td>
                <td className="py-4">
                  <span className="text-sm text-gray-600">{coachee.nextSession}</span>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{coachee.recentScore}</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-400">/ {coachee.targetScore}</span>
                  </div>
                </td>
                <td className="py-4">
                  <button
                    onClick={() => navigate(`/coach/coachees/${coachee.id}`)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
