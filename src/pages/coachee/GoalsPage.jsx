import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '../../components/common/Card'
import { Target, MessageSquare, ChevronRight, TrendingUp, Loader2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { getConfirmedGoals } from '../../lib/messageService'
import { isSupabaseConfigured } from '../../lib/supabase'

export function GoalsPage() {
  const { user } = useStore()
  const [confirmedGoals, setConfirmedGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGoals() {
      if (!user?.id || !isSupabaseConfigured()) {
        setLoading(false)
        return
      }

      try {
        const goals = await getConfirmedGoals(user.id)
        setConfirmedGoals(goals)
      } catch (err) {
        console.error('목표 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }

    loadGoals()
  }, [user?.id])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">나의 목표</h1>
        <p className="text-gray-600">
          코치님과 함께 합의한 목표를 확인하세요.
        </p>
      </div>

      {confirmedGoals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              아직 합의된 목표가 없어요
            </h3>
            <p className="text-gray-600 mb-6">
              코치님과 채팅에서 목표 합의서를 주고받으며 함께 목표를 설정해보세요.
            </p>
            <Link
              to="/coachee/messages"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              채팅으로 이동
              <ChevronRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {confirmedGoals.map((agreement) => (
            <Card key={agreement.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      목표 합의서 v{agreement.version}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(agreement.confirmedAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} 확정
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {agreement.goals.map((goal, idx) => {
                    const startScore = goal.startScore || goal.currentScore
                    const hasProgress = goal.currentScore > startScore

                    return (
                      <div key={goal.id || idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-gray-900 flex-1">
                            {goal.topic || `목표 ${idx + 1}`}
                          </h4>
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className={`w-4 h-4 ${hasProgress ? 'text-emerald-500' : 'text-gray-400'}`} />
                            <span className={`font-medium ${hasProgress ? 'text-emerald-600' : 'text-gray-600'}`}>
                              {startScore} → {goal.targetScore}
                            </span>
                          </div>
                        </div>
                        {goal.desiredResult && (
                          <p className="text-sm text-gray-600">
                            {goal.desiredResult}
                          </p>
                        )}

                        {/* 진행률 바 */}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span className="flex items-center gap-1">
                              현재 <span className={`font-medium ${hasProgress ? 'text-emerald-600' : ''}`}>{goal.currentScore}점</span>
                              {hasProgress && (
                                <span className="text-emerald-500">(+{goal.currentScore - startScore})</span>
                              )}
                            </span>
                            <span>목표 {goal.targetScore}점</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-600 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, (goal.currentScore / goal.targetScore) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
