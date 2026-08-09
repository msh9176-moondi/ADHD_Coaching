import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Button } from '../components/common/Button'
import { Card, CardContent } from '../components/common/Card'
import { PACKAGES } from '../data/coachData'
import {
  Target, ArrowRight, CheckCircle, MessageCircle,
  Clock, Users, Sparkles, Package, Check
} from 'lucide-react'

// FLOCA 코칭 서비스 정보
const FLOCA_COACH = {
  id: 'floca',
  name: '플로카',
  bio: 'ADHD 실행회복을 위한 전문 코칭 서비스',
  detail: 'FLOCA는 ADHD 특성을 가진 분들의 실행력 회복을 돕는 전문 코칭 서비스입니다. 개인별 맞춤 전략과 체계적인 코칭 프로그램을 통해 일상의 변화를 만들어갑니다.',
  specialties: ['실행력 향상', '시간관리', '루틴형성', '감정조절', '목표설정', 'ADHD 코칭']
}

export function CoachSelectionPage() {
  const navigate = useNavigate()
  const { user, setMatchedCoach, setCoachingPackage, setOnboardingStatus } = useStore()
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const coach = FLOCA_COACH
  const packageList = Object.values(PACKAGES)

  const handleConfirm = () => {
    if (!selectedPackage) {
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      const pkg = PACKAGES[selectedPackage]

      setMatchedCoach({
        coachId: coach.id,
        coachName: coach.name,
        packageType: selectedPackage,
        totalSessions: pkg.sessions,
        matchedAt: new Date().toISOString()
      })

      setCoachingPackage({
        type: selectedPackage,
        totalSessions: pkg.sessions,
        completedSessions: 0,
        currentSession: 1
      })

      setOnboardingStatus({
        step: 'self-intro',
        completed: false
      })

      navigate('/self-intro')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            코칭 시작하기
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {user?.name || '회원'}님, 환영합니다!
          </h1>
          <p className="text-gray-600">
            FLOCA 코칭 서비스와 함께<br />
            실행력 회복 여정을 시작해보세요.
          </p>
        </div>

        {/* 플로카 코치 카드 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* 로고 & 이름 */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">FLOCA 코칭</h2>
                <p className="text-sm text-gray-500">{coach.bio}</p>
              </div>
            </div>

            {/* 설명 */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              {coach.detail}
            </p>

            {/* 전문 분야 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">코칭 영역</h3>
              <div className="flex flex-wrap gap-2">
                {coach.specialties.map((specialty, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {/* 코칭 특징 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>개인별 ADHD 유형 맞춤 코칭</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>체계적인 실행력 회복 프로그램</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>일상에서 바로 적용 가능한 전략 제공</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>지속적인 피드백과 성장 기록</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 패키지 선택 섹션 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">코칭 패키지 선택</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">목표에 맞는 회기 수를 선택해주세요.</p>

          <div className="space-y-3">
            {packageList.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPackage === pkg.id
                    ? 'border-blue-500 bg-blue-50'
                    : pkg.recommended
                    ? 'border-blue-300 bg-white hover:border-blue-400'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* 추천 배지 */}
                {pkg.recommended && (
                  <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded">
                    추천
                  </div>
                )}

                {/* 선택 체크 */}
                {selectedPackage === pkg.id && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* 아이콘 */}
                  <div className="text-3xl">{pkg.icon}</div>

                  {/* 내용 */}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                      <span className="text-2xl font-black text-blue-600">{pkg.sessions}</span>
                      <span className="text-sm text-gray-500">회기</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {pkg.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-xs text-gray-600"
                        >
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 선택 안내 */}
        {selectedPackage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm text-green-800 font-medium text-center">
              ✅ {PACKAGES[selectedPackage].name} 패키지 ({PACKAGES[selectedPackage].sessions}회기)를 선택했습니다
            </p>
          </div>
        )}

        {/* 시작 버튼 */}
        <Button
          onClick={handleConfirm}
          disabled={isSubmitting || !selectedPackage}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              시작하는 중...
            </>
          ) : !selectedPackage ? (
            '패키지를 선택해주세요'
          ) : (
            <>
              {PACKAGES[selectedPackage].name} {PACKAGES[selectedPackage].sessions}회기로 시작하기
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        {/* 안내 문구 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600 text-center">
            <MessageCircle className="w-4 h-4 inline mr-1" />
            다음 단계에서 코치님께 나를 소개하는<br />
            간단한 자기소개를 작성하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
