import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '../common/Card'
import {
  Calendar, Sparkles, Clock, ChevronRight, Crown, RefreshCw, CalendarPlus
} from 'lucide-react'
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS_LABELS,
  getDaysUntilRenewal
} from '../../lib/subscriptionService'
import { SubscriberSessionBookingModal } from '../modals/SubscriberSessionBookingModal'
import { bookSubscriberSession } from '../../lib/sessionService'
import { useStore } from '../../store/useStore'

export function SubscriptionStatusCard({ subscription, onSessionBooked }) {
  const [showBookingModal, setShowBookingModal] = useState(false)
  const { user, matchedCoach, setSubscription } = useStore()

  const handleBookSession = async (bookingData) => {
    if (!subscription || !user?.id || !matchedCoach?.coachId) {
      throw new Error('필요한 정보가 없습니다')
    }

    const session = await bookSubscriberSession(
      subscription.id,
      matchedCoach.coachId,
      user.id,
      bookingData
    )

    // 구독 상태 업데이트 (사용량 증가)
    setSubscription({
      ...subscription,
      sessions_used_this_month: subscription.sessions_used_this_month + 1
    })

    onSessionBooked?.(session)
    return session
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">구독이 없습니다</h3>
            <p className="text-sm text-gray-500 mb-4">
              사후관리 구독으로 성장을 이어가세요
            </p>
            <Link
              to="/coachee/subscribe"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              구독 시작하기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const plan = SUBSCRIPTION_PLANS[subscription.plan_type]
  const daysUntilRenewal = getDaysUntilRenewal(subscription)
  const sessionsRemaining = subscription.sessions_per_month - subscription.sessions_used_this_month
  const sessionProgress = (subscription.sessions_used_this_month / subscription.sessions_per_month) * 100

  return (
    <>
      <Card className="overflow-hidden">
        {/* 헤더 배경 */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white/80 text-xs">현재 구독</div>
                <div className="text-white font-bold">{plan?.name || '월간 구독'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                subscription.status === 'active'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-5">
          {/* 세션 사용량 */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">이번 달 세션</span>
              <span className="text-sm font-medium text-gray-900">
                {subscription.sessions_used_this_month} / {subscription.sessions_per_month}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                style={{ width: `${sessionProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>
                {sessionsRemaining > 0
                  ? `${sessionsRemaining}회 남음`
                  : '이번 달 세션 완료'}
              </span>
              {sessionsRemaining > 0 && (
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  세션 예약하기
                </button>
              )}
            </div>
          </div>

          {/* 갱신 정보 */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <div className="flex-1 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">다음 갱신일</div>
                <div className="text-sm font-medium text-gray-900">
                  {subscription.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric'
                      })
                    : '-'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-600 font-medium">
                <Clock className="w-4 h-4" />
                <span>D-{daysUntilRenewal}</span>
              </div>
            </div>
          </div>

          {/* 빠른 액션 */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowBookingModal(true)}
              disabled={sessionsRemaining <= 0}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                sessionsRemaining > 0
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CalendarPlus className="w-4 h-4" />
              세션 예약하기
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 예약 모달 */}
      <SubscriberSessionBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        subscription={subscription}
        coachName={matchedCoach?.coachName}
        onBook={handleBookSession}
      />
    </>
  )
}
