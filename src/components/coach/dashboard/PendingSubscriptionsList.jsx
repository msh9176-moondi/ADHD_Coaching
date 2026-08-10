import { useState } from 'react'
import { CheckCircle, Loader2, Crown } from 'lucide-react'
import { Avatar } from '../../common/Avatar'
import { Button } from '../../common/Button'
import { confirmSubscriptionPayment, SUBSCRIPTION_PLANS } from '../../../lib/subscriptionService'

export function PendingSubscriptionsList({ subscriptions = [], onConfirmed }) {
  const [confirming, setConfirming] = useState(null)

  const handleConfirmPayment = async (subscription) => {
    try {
      setConfirming(subscription.id)
      await confirmSubscriptionPayment(subscription.id)
      onConfirmed?.(subscription.id)
    } catch (err) {
      console.error('결제 확인 실패:', err)
      alert('결제 확인 중 오류가 발생했습니다.')
    } finally {
      setConfirming(null)
    }
  }

  const getPlanName = (planType) => {
    return SUBSCRIPTION_PLANS[planType]?.name || planType
  }

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  return (
    <div className="space-y-3">
      {subscriptions.map((subscription) => (
        <div
          key={subscription.id}
          className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-200"
        >
          <div className="flex items-center gap-4">
            <Avatar name={subscription.user?.name || '사용자'} size="sm" />
            <div>
              <p className="font-medium text-gray-900">
                {subscription.user?.name || '알 수 없음'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                  <Crown className="w-3 h-3 inline mr-1" />
                  {getPlanName(subscription.plan_type)}
                </span>
                <span className="text-xs text-gray-600 font-medium">
                  {formatPrice(subscription.amount)}
                </span>
              </div>
              {subscription.depositor_name && (
                <p className="text-xs text-gray-500 mt-1">
                  입금자명: {subscription.depositor_name}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(subscription.created_at).toLocaleDateString('ko-KR')} 신청
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleConfirmPayment(subscription)}
            disabled={confirming === subscription.id}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {confirming === subscription.id ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                확인 중
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                입금 확인
              </>
            )}
          </Button>
        </div>
      ))}
    </div>
  )
}
