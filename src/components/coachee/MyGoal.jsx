import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { Target, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function MyGoal() {
  const { coachingGoal } = useStore()
  const navigate = useNavigate()

  // 목표가 없는 경우
  if (!coachingGoal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            나의 코칭 목표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">아직 설정된 목표가 없습니다.</p>
            <p className="text-xs text-gray-400 mt-1">코치님과 상담 후 목표가 설정됩니다.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progressPercent = (coachingGoal.currentScore / coachingGoal.targetScore) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-600" />
          나의 코칭 목표
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="font-medium text-gray-900">
            {coachingGoal.title}
          </p>

          {/* 점수 표시 */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-emerald-600">
              {coachingGoal.currentScore}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="text-2xl font-bold text-gray-400">
              {coachingGoal.targetScore}
            </span>
          </div>

          {/* 진행 바 */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>

          {/* 현재 행동 */}
          {coachingGoal.currentAction && (
            <div className="text-sm">
              <span className="text-gray-500">이번에 함께 해볼 행동</span>
              <p className="text-gray-700 mt-1">{coachingGoal.currentAction}</p>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-600"
            onClick={() => navigate('/coachee/goals')}
          >
            목표합의서 전체 보기
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
