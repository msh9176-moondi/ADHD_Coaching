import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../components/common/Card'
import { useStore } from '../../store/useStore'
import {
  Check, Crown, Sparkles, Calendar, MessageSquare,
  TrendingUp, Shield, ArrowRight, Loader2
} from 'lucide-react'
import { SUBSCRIPTION_PLANS, createSubscription } from '../../lib/subscriptionService'
import { isSupabaseConfigured } from '../../lib/supabase'

const PLAN_FEATURES = {
  monthly: [
    '매월 2회 사후관리 세션',
    '담당 코치 유지',
    '채팅 상담 지원',
    '목표 달성도 체크'
  ],
  quarterly: [
    '매월 2회 사후관리 세션',
    '담당 코치 유지',
    '채팅 상담 지원',
    '목표 달성도 체크',
    '분기별 종합 리포트',
    '10% 할인 적용'
  ],
  yearly: [
    '매월 2회 사후관리 세션',
    '담당 코치 유지',
    '채팅 상담 지원',
    '목표 달성도 체크',
    '분기별 종합 리포트',
    '연간 성장 분석',
    '우선 예약권',
    '20% 할인 적용'
  ]
}

export function SubscriptionPlansPage() {
  const navigate = useNavigate()
  const { user, coacheeProfile } = useStore()
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!isSupabaseConfigured()) {
      alert('데모 모드에서는 구독을 시작할 수 없습니다.')
      return
    }

    if (!user?.id || !coacheeProfile?.coach_id) {
      alert('사용자 정보가 없습니다.')
      return
    }

    setIsLoading(true)
    try {
      await createSubscription({
        userId: user.id,
        coachId: coacheeProfile.coach_id,
        planType: selectedPlan
      })

      // 성공 후 대시보드로 이동
      navigate('/coachee', {
        state: { subscriptionSuccess: true }
      })
    } catch (error) {
      console.error('구독 생성 실패:', error)
      alert('구독 시작에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          사후관리 구독
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          성장을 지속하세요
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          코칭을 완료했지만 혼자 유지하기 어려우신가요?
          <br />
          담당 코치와 함께 목표를 지속적으로 관리하세요.
        </p>
      </div>

      {/* 플랜 카드들 */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
          const isSelected = selectedPlan === key
          const isPopular = key === 'quarterly'

          return (
            <Card
              key={key}
              className={`relative cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-emerald-500 shadow-lg'
                  : 'hover:shadow-md'
              } ${isPopular ? 'md:-mt-4 md:mb-4' : ''}`}
              onClick={() => setSelectedPlan(key)}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                    <Crown className="w-3 h-3" />
                    인기
                  </span>
                </div>
              )}

              <CardContent className={`p-5 ${isPopular ? 'pt-6' : ''}`}>
                {/* 플랜명 */}
                <h3 className="font-bold text-lg text-gray-900 mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {plan.description}
                </p>

                {/* 가격 */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {(plan.price / (key === 'yearly' ? 12 : key === 'quarterly' ? 3 : 1)).toLocaleString()}
                    </span>
                    <span className="text-gray-500">/월</span>
                  </div>
                  {plan.discountRate > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-400 line-through">
                        {(99000).toLocaleString()}원
                      </span>
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                        {plan.discountRate}% 할인
                      </span>
                    </div>
                  )}
                </div>

                {/* 기능 목록 */}
                <ul className="space-y-2">
                  {PLAN_FEATURES[key].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* 선택 표시 */}
                <div className={`mt-4 py-2 rounded-lg text-center text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isSelected ? '선택됨' : '선택하기'}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 혜택 안내 */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">구독 혜택</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">정기 세션</div>
              <div className="text-xs text-gray-500">매월 2회 보장</div>
            </div>
            <div className="text-center p-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">채팅 상담</div>
              <div className="text-xs text-gray-500">상시 질문 가능</div>
            </div>
            <div className="text-center p-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">성장 관리</div>
              <div className="text-xs text-gray-500">목표 달성 체크</div>
            </div>
            <div className="text-center p-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">담당 코치</div>
              <div className="text-xs text-gray-500">연속성 유지</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 구독 시작 버튼 */}
      <div className="sticky bottom-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500">
              {SUBSCRIPTION_PLANS[selectedPlan].name}
            </div>
            <div className="text-xl font-bold text-gray-900">
              {SUBSCRIPTION_PLANS[selectedPlan].price.toLocaleString()}원
              <span className="text-sm font-normal text-gray-500">
                {selectedPlan === 'yearly' ? '/년' : selectedPlan === 'quarterly' ? '/3개월' : '/월'}
              </span>
            </div>
          </div>
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                구독 시작하기
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
