import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { useStore } from '../../store/useStore'
import { reportService } from '../../lib'
import { isSupabaseConfigured } from '../../lib/supabase'
import { getActiveSubscription, SUBSCRIPTION_PLANS } from '../../lib/subscriptionService'
import { SubscriptionStatusCard } from '../../components/coachee/SubscriptionStatusCard'
import {
  Award, TrendingUp, Target, CheckCircle, BookOpen, ClipboardList,
  ChevronLeft, Loader2, Star, Sparkles, Calendar, ArrowRight, Crown, Zap
} from 'lucide-react'

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

export function CoachingReportPage() {
  const navigate = useNavigate()
  const { user, subscription, setSubscription } = useStore()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      if (!user?.id || !isSupabaseConfigured()) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        // 리포트와 구독 정보 병렬 로드
        const [reportData, subscriptionData] = await Promise.all([
          reportService.generateReportData(user.id),
          getActiveSubscription(user.id)
        ])
        setReport(reportData)
        if (subscriptionData) {
          setSubscription(subscriptionData)
        }
      } catch (err) {
        console.error('데이터 로드 실패:', err)
        setError('보고서를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user?.id, setSubscription])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-gray-500">보고서 생성 중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-500">{error}</p>
            <Button className="mt-4" onClick={() => navigate(-1)}>
              돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">아직 보고서가 없습니다</h3>
            <p className="text-gray-500 mb-4">코칭이 완료되면 결과 보고서가 생성됩니다.</p>
            <Button onClick={() => navigate('/coachee')}>
              대시보드로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { summary, topicGrowth, sessionHighlights, coachee } = report

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
      >
        <ChevronLeft className="w-4 h-4" />
        돌아가기
      </button>

      {/* 헤더 */}
      <div className="bg-gradient-to-r from-emerald-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">코칭 결과 보고서</h1>
            <p className="text-blue-100">
              {coachee.coachName} 코치와 함께한 {coachee.completedSessions}회기 여정
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <Sparkles className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{summary.overallAchievementRate}%</p>
            <p className="text-sm text-blue-100">목표 달성률</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">+{summary.overallGrowth}</p>
            <p className="text-sm text-blue-100">전체 성장</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <ClipboardList className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{summary.taskCompletionRate}%</p>
            <p className="text-sm text-blue-100">과제 완료율</p>
          </div>
        </div>
      </div>

      {/* 주제별 성장 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            주제별 성장
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topicGrowth.map((topic, idx) => (
            <div key={topic.id || idx} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{topic.title}</h4>
                <Badge variant={topic.growth > 0 ? 'success' : 'default'}>
                  {topic.growth > 0 ? '+' : ''}{topic.growth}점
                </Badge>
              </div>
              <div className="flex items-center gap-4 mb-2">
                <div className="text-center">
                  <p className="text-xs text-gray-500">시작</p>
                  <span className="text-lg font-semibold text-gray-400">{topic.startScore}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300" />
                <div className="text-center">
                  <p className="text-xs text-gray-500">현재</p>
                  <span className="text-lg font-semibold text-emerald-600">{topic.currentScore}</span>
                </div>
                <div className="flex-1" />
                <div className="text-center">
                  <p className="text-xs text-gray-500">목표</p>
                  <span className="text-lg font-semibold text-gray-600">{topic.targetScore}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    topic.achievementRate >= 100 ? 'bg-green-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(topic.achievementRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-right mt-1">
                달성률 {topic.achievementRate}%
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 회기별 하이라이트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            회기별 여정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* 타임라인 */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-6">
              {sessionHighlights.map((session, idx) => (
                <div key={idx} className="relative pl-14">
                  {/* 타임라인 마커 */}
                  <div className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
                    session.status === 'completed'
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white border-gray-300'
                  } flex items-center justify-center`}>
                    {session.status === 'completed' && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {session.sessionNumber}회기
                      </h4>
                      {session.date && (
                        <span className="text-xs text-gray-500">{formatDate(session.date)}</span>
                      )}
                    </div>
                    {session.topic && (
                      <p className="text-sm text-gray-700 mb-2">{session.topic}</p>
                    )}
                    {session.reflection && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-1 text-xs text-emerald-600 mb-1">
                          <BookOpen className="w-3 h-3" />
                          성찰일지
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {session.reflection.learned}
                        </p>
                        {session.reflection.previousScore !== undefined && (
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            <span className="text-gray-400">{session.reflection.previousScore}점</span>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <span className="text-green-600 font-medium">{session.reflection.currentScore}점</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 과제 완료 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-600" />
            과제 완료 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {summary.completedTasks} / {summary.totalTasks}
              </p>
              <p className="text-sm text-gray-500">완료한 과제</p>
            </div>
            <div className="w-20 h-20 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="8"
                  strokeDasharray={`${summary.taskCompletionRate * 2.26} 226`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-teal-600">{summary.taskCompletionRate}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 구독 상태에 따른 다음 단계 */}
      {subscription?.status === 'active' ? (
        // 구독자용: 구독 상태 카드
        <div className="space-y-4">
          <SubscriptionStatusCard subscription={subscription} />
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">실행기능 사용 설명서</h4>
                  <p className="text-sm text-gray-500">꾸준히 실천하며 성장을 유지하세요</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/coachee/guide')}>
                  보기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // 비구독자용: 구독 전환 CTA
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">성장을 계속 이어가세요</h3>
                <p className="text-white/80">
                  {coachee.coachName} 코치와 함께하는 월간 사후관리 구독
                </p>
              </div>
            </div>
          </div>
          <CardContent className="py-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-900">매월 2회</p>
                <p className="text-xs text-gray-500">사후관리 세션</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Zap className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-900">담당 코치</p>
                <p className="text-xs text-gray-500">연속성 유지</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-900">목표 관리</p>
                <p className="text-xs text-gray-500">지속적 성장</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => navigate('/coachee/subscribe')}
              >
                <Crown className="w-4 h-4 mr-2" />
                구독 시작하기
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/coachee')}
              >
                나중에
              </Button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              월 {SUBSCRIPTION_PLANS.monthly.price.toLocaleString()}원부터 시작
            </p>
          </CardContent>
        </Card>
      )}

      {/* 실행기능 안내 (구독자가 아닐 때만) */}
      {!subscription?.status && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">실행기능 사용 설명서</h4>
                  <p className="text-sm text-gray-500">혼자서도 꾸준히 실천할 수 있어요</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/coachee/guide')}>
                보기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
