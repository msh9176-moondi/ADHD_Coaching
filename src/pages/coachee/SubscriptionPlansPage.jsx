import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../components/common/Card'
import { Modal } from '../../components/common/Modal'
import { Button } from '../../components/common/Button'
import { useStore } from '../../store/useStore'
import {
  Check, Crown, Sparkles, Calendar, MessageSquare,
  TrendingUp, Shield, ArrowRight, Loader2, Copy,
  CreditCard, CheckCircle, AlertCircle, X, Brain, Leaf, Zap
} from 'lucide-react'
import { SUBSCRIPTION_PLANS, createSubscription } from '../../lib/subscriptionService'
import { isSupabaseConfigured } from '../../lib/supabase'

// 계좌 정보
const BANK_INFO = {
  bank: '토스뱅크',
  accountNumber: '1000-0560-9809',
  accountHolder: '문성하'
}

const PLAN_FEATURES = {
  monthly: [
    '매월 3회 사후관리 세션 (30분)',
    '담당 코치 유지',
    '채팅 상담 지원',
    '목표 달성도 체크'
  ],
  quarterly: [
    '매월 3회 사후관리 세션 (30분)',
    '담당 코치 유지',
    '채팅 상담 지원',
    '목표 달성도 체크',
    '분기별 종합 리포트',
    '10% 할인 적용'
  ],
  yearly: [
    '매월 3회 사후관리 세션 (30분)',
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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paymentStep, setPaymentStep] = useState('info') // 'info' | 'confirm' | 'complete'
  const [depositorName, setDepositorName] = useState('')

  const handleOpenPayment = () => {
    if (!isSupabaseConfigured()) {
      alert('데모 모드에서는 구독을 시작할 수 없습니다.')
      return
    }

    if (!user?.id || !coacheeProfile?.coach_id) {
      alert('사용자 정보가 없습니다.')
      return
    }

    setShowPaymentModal(true)
    setPaymentStep('info')
    setDepositorName(user?.name || '')
  }

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BANK_INFO.accountNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // 클립보드 복사 실패 시 수동 선택
      const input = document.createElement('input')
      input.value = BANK_INFO.accountNumber
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConfirmPayment = async () => {
    if (!depositorName.trim()) {
      alert('입금자명을 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      await createSubscription({
        userId: user.id,
        coachId: coacheeProfile.coach_id,
        planType: selectedPlan,
        depositorName: depositorName.trim()
      })

      setPaymentStep('complete')
    } catch (error) {
      console.error('구독 생성 실패:', error)
      alert('구독 신청에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    setShowPaymentModal(false)
    navigate('/coachee', {
      state: { subscriptionPending: true }
    })
  }

  const selectedPlanData = SUBSCRIPTION_PLANS[selectedPlan]

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
                        {(20000 * (key === 'yearly' ? 12 : key === 'quarterly' ? 3 : 1)).toLocaleString()}원
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
              <div className="text-xs text-gray-500">매월 3회 (30분)</div>
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

      {/* 울트라마인드 프로그램 안내 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-sm text-gray-500 px-2">또는</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <Card className="overflow-hidden border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* 아이콘 & 제목 */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-200">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-gray-900">Ultra Mind Solution</h3>
                    <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
                      NEW
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    뇌 기능 최적화를 위한 6주 맞춤형 건강 프로그램
                  </p>

                  {/* 특징 */}
                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1 text-violet-700">
                      <Zap className="w-3.5 h-3.5" />
                      <span>7가지 핵심 영역 분석</span>
                    </div>
                    <div className="flex items-center gap-1 text-violet-700">
                      <Leaf className="w-3.5 h-3.5" />
                      <span>맞춤형 체크리스트</span>
                    </div>
                    <div className="flex items-center gap-1 text-violet-700">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>6주 실천 프로그램</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => navigate('/coachee/ultramind')}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200"
                >
                  알아보기
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 구독과 함께 안내 */}
            <div className="mt-4 pt-4 border-t border-violet-200">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                사후관리 구독과 함께 진행하면 코치의 지속적인 지원을 받을 수 있어요
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
            onClick={handleOpenPayment}
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

      {/* 결제 안내 모달 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h2 className="font-semibold text-gray-900">
                  {paymentStep === 'complete' ? '신청 완료' : '계좌이체 안내'}
                </h2>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-5">
              {paymentStep === 'info' && (
                <>
                  {/* 선택한 플랜 정보 */}
                  <div className="bg-emerald-50 rounded-xl p-4 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-emerald-700 font-medium">{selectedPlanData.name}</span>
                      <span className="text-emerald-800 font-bold text-lg">
                        {selectedPlanData.price.toLocaleString()}원
                      </span>
                    </div>
                    <p className="text-sm text-emerald-600">{selectedPlanData.description}</p>
                  </div>

                  {/* 계좌 정보 */}
                  <div className="mb-5">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">입금 계좌</h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">은행</span>
                        <span className="font-medium text-gray-900">{BANK_INFO.bank}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">계좌번호</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 font-mono">
                            {BANK_INFO.accountNumber}
                          </span>
                          <button
                            onClick={handleCopyAccount}
                            className={`p-1.5 rounded-lg transition-colors ${
                              copied
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            {copied ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">예금주</span>
                        <span className="font-medium text-gray-900">{BANK_INFO.accountHolder}</span>
                      </div>
                    </div>
                  </div>

                  {/* 안내사항 */}
                  <div className="bg-amber-50 rounded-xl p-4 mb-5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">입금 시 유의사항</p>
                        <ul className="space-y-1 text-amber-700">
                          <li>• 입금자명을 정확히 입력해주세요</li>
                          <li>• 입금 확인 후 구독이 활성화됩니다</li>
                          <li>• 확인까지 최대 1영업일 소요됩니다</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setPaymentStep('confirm')}
                    className="w-full"
                  >
                    입금 완료했어요
                  </Button>
                </>
              )}

              {paymentStep === 'confirm' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      입금 정보 확인
                    </h3>
                    <p className="text-sm text-gray-500">
                      입금하신 분의 성함을 입력해주세요
                    </p>
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      입금자명
                    </label>
                    <input
                      type="text"
                      value={depositorName}
                      onChange={(e) => setDepositorName(e.target.value)}
                      placeholder="예: 홍길동"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">입금 금액</span>
                      <span className="font-bold text-gray-900">
                        {selectedPlanData.price.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setPaymentStep('info')}
                      className="flex-1"
                    >
                      이전
                    </Button>
                    <Button
                      onClick={handleConfirmPayment}
                      disabled={isLoading || !depositorName.trim()}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          처리 중...
                        </>
                      ) : (
                        '신청 완료'
                      )}
                    </Button>
                  </div>
                </>
              )}

              {paymentStep === 'complete' && (
                <div className="text-center py-4">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    구독 신청 완료!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    입금 확인 후 구독이 활성화됩니다.<br />
                    확인까지 최대 1영업일 소요됩니다.
                  </p>

                  <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">신청 내역</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">플랜</span>
                        <span className="text-gray-900">{selectedPlanData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">금액</span>
                        <span className="text-gray-900">{selectedPlanData.price.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">입금자명</span>
                        <span className="text-gray-900">{depositorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">상태</span>
                        <span className="text-amber-600 font-medium">입금 확인 중</span>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleComplete} className="w-full">
                    확인
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
