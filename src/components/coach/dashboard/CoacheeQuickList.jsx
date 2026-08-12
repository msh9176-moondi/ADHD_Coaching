import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, TrendingUp, CheckCircle, Play } from 'lucide-react'
import { Avatar } from '../../common/Avatar'
import { ProgressBar } from '../../common/ProgressBar'
import { PACKAGES } from '../../../data/coachData'
import { PACKAGE_COLORS } from '../../../constants/styles'

const TABS = [
  { id: 'active', label: '진행 중', icon: Play },
  { id: 'completed', label: '완료', icon: CheckCircle }
]

export function CoacheeQuickList({ coachees = [] }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('active')

  // 피코치를 상태별로 분류
  const activeCoachees = coachees.filter(c => c.currentSession <= c.totalSessions)
  const completedCoachees = coachees.filter(c => c.currentSession > c.totalSessions)

  const displayedCoachees = activeTab === 'active' ? activeCoachees : completedCoachees

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
    <div>
      {/* 탭 */}
      <div className="flex gap-2 mb-4 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const count = tab.id === 'active' ? activeCoachees.length : completedCoachees.length
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {displayedCoachees.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <p>{activeTab === 'active' ? '진행 중인 피코치가 없습니다.' : '완료된 피코치가 없습니다.'}</p>
        </div>
      ) : (
        <>
          {/* 모바일: 카드 레이아웃 */}
          <div className="md:hidden space-y-3">
            {displayedCoachees.map((coachee) => {
              const pkg = coachee.packageType ? PACKAGES[coachee.packageType] : null
              const pkgColorObj = PACKAGE_COLORS[coachee.packageType]
              const pkgColor = pkgColorObj?.badge || 'bg-gray-100 text-gray-700'

              return (
                <div
                  key={coachee.id}
                  onClick={() => navigate(`/coach/coachees/${coachee.id}`)}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar name={coachee.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">{coachee.name}</p>
                        {pkg && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pkgColor}`}>
                            {pkg.name}
                          </span>
                        )}
                        {coachee.hasWarning && (
                          <span className="text-[10px] text-yellow-600">주의</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span>
                        {Math.min(coachee.currentSession, coachee.totalSessions)}/{coachee.totalSessions}회기
                        {coachee.currentSession > coachee.totalSessions && ' ✓'}
                      </span>
                      <span className="flex items-center gap-1">
                        점수 {coachee.recentScore}
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      </span>
                    </div>
                    <span className="text-emerald-600 font-medium">상세 →</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 데스크톱: 테이블 레이아웃 */}
          <div className="hidden md:block overflow-x-auto">
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
                {displayedCoachees.map((coachee) => {
                  const pkg = coachee.packageType ? PACKAGES[coachee.packageType] : null
                  const pkgColorObj = PACKAGE_COLORS[coachee.packageType]
                  const pkgColor = pkgColorObj?.badge || 'bg-gray-100 text-gray-700'

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
                          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
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
        </>
      )}
    </div>
  )
}
