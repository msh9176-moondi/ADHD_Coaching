import { Link } from 'react-router-dom'
import { Card, CardContent } from '../common/Card'
import { Avatar } from '../common/Avatar'
import { MessageSquare, ChevronRight, Award, Calendar } from 'lucide-react'
import { useStore } from '../../store/useStore'

export function CoachInfoCard() {
  const { matchedCoach, coachingPackage } = useStore()

  if (!matchedCoach) {
    return null
  }

  const completedSessions = coachingPackage?.completedSessions || 0
  const matchedDate = matchedCoach.matchedAt
    ? new Date(matchedCoach.matchedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long'
      })
    : null

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <Avatar
            name={matchedCoach.coachName}
            size="lg"
            className="w-14 h-14"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {matchedCoach.coachName} 코치
            </h3>
            <p className="text-sm text-gray-500">담당 코치</p>
          </div>
          <Link
            to="/coachee/messages"
            className="flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            채팅
          </Link>
        </div>

        {/* 함께한 기록 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{completedSessions}회</p>
                <p className="text-xs text-gray-500">완료 세션</p>
              </div>
            </div>
            {matchedDate && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{matchedDate}</p>
                  <p className="text-xs text-gray-500">시작일</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
