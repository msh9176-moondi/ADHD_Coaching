import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { createCoacheeProfile, getCoacheeProfile, updateCoacheeProfile } from '../../lib/coacheeService'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  Package, Check, CheckCircle, Clock, UserCheck,
  ArrowRight, Sparkles, Target, Edit3, Crown, ChevronRight
} from 'lucide-react'

// 패키지 정보
const PACKAGES = {
  starter: {
    id: 'starter',
    name: '스타터',
    sessions: 3,
    icon: '🌱',
    description: '코칭이 처음이신 분',
    features: ['3회 코칭 세션', '기본 피드백'],
    color: 'green'
  },
  basic: {
    id: 'basic',
    name: '베이직',
    sessions: 5,
    icon: '🌿',
    description: '본격적인 변화를 원하시는 분',
    features: ['5회 코칭 세션', '상세 피드백', '중간 점검'],
    recommended: true,
    color: 'blue'
  },
  premium: {
    id: 'premium',
    name: '프리미엄',
    sessions: 10,
    icon: '🌳',
    description: '깊은 변화와 습관 형성',
    features: ['10회 코칭 세션', '심층 피드백', '주간 점검', '우선 예약'],
    color: 'purple'
  }
}

export function MatchingCard() {
  const { user, coachingPackage, setCoachingPackage, matchedCoach, subscription } = useStore()
  const [selectedPackage, setSelectedPackage] = useState(coachingPackage?.type || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [status, setStatus] = useState(matchedCoach ? 'matched' : coachingPackage?.type ? 'pending' : 'select')
  // select: 패키지 선택 전
  // pending: 패키지 선택 후 코치 매칭 대기
  // matched: 코치 매칭 완료

  // 모든 회기 완료 여부 체크
  const totalSessions = coachingPackage?.totalSessions || matchedCoach?.totalSessions || 0
  const currentSession = coachingPackage?.currentSession || 1
  const isAllSessionsCompleted = totalSessions > 0 && currentSession > totalSessions
  const hasActiveSubscription = subscription?.status === 'active'

  const handleSelectPackage = async () => {
    if (!selectedPackage || !user?.id) return

    setIsSubmitting(true)

    try {
      const pkg = PACKAGES[selectedPackage]

      // Supabase에 프로필 생성/업데이트
      if (isSupabaseConfigured()) {
        // 기존 프로필 확인
        const existingProfile = await getCoacheeProfile(user.id)

        if (existingProfile) {
          // 기존 프로필 업데이트
          await updateCoacheeProfile(user.id, {
            package_type: selectedPackage,
            total_sessions: pkg.sessions
          })
        } else {
          // 새 프로필 생성
          await createCoacheeProfile(user.id, {
            packageType: selectedPackage,
            intro: null,
            expectation: null,
            concern: null,
            communicationStyles: [],
            preferredTimes: []
          })
        }
      }

      // 로컬 상태 업데이트
      setCoachingPackage({
        type: selectedPackage,
        totalSessions: pkg.sessions,
        completedSessions: coachingPackage?.completedSessions || 0,
        currentSession: coachingPackage?.currentSession || 1
      })

      setStatus('pending')
      setIsEditing(false)
    } catch (err) {
      console.error('패키지 선택 실패:', err)
      alert('패키지 선택에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setSelectedPackage(coachingPackage?.type || null)
    setIsEditing(false)
  }

  // 활성 구독자는 MatchingCard를 표시하지 않음 (SubscriptionStatusCard가 대신 표시됨)
  if (hasActiveSubscription) {
    return null
  }

  // 코치 매칭 완료 상태
  if (status === 'matched' && matchedCoach) {
    // 모든 회기 완료 + 구독 없음 = 구독 안내
    if (isAllSessionsCompleted) {
      return (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">코칭 여정을 완료했습니다!</h3>
                  <span className="text-lg">🎉</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {matchedCoach.coachName || 'FLOCA'} 코치님과 {totalSessions}회 코칭을 모두 마쳤습니다.
                  <br />
                  <span className="text-amber-700 font-medium">사후관리 구독</span>으로 성장을 이어가세요!
                </p>
                <Link to="/coachee/subscribe">
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md">
                    <Crown className="w-4 h-4 mr-2" />
                    구독 플랜 보기
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    // 일반 매칭 완료 상태 (진행 중)
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">코치 매칭 완료</h3>
              <p className="text-sm text-gray-600">
                {matchedCoach.coachName || 'FLOCA'} 코치님과 함께합니다
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 매칭 대기 상태
  if (status === 'pending' && !isEditing) {
    const pkg = PACKAGES[coachingPackage?.type || selectedPackage]
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-emerald-600 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-gray-900">코치 매칭 대기중</h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-emerald-600 hover:text-blue-800 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  패키지 변경
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium text-emerald-700">{pkg?.name} 패키지 ({pkg?.sessions}회기)</span>를 신청하셨습니다.<br />
                코치님이 곧 연락드릴 예정입니다.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                담당 코치 배정 중...
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 패키지 선택 화면 (신규 선택 또는 수정)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Edit3 className="w-5 h-5 text-emerald-600" />
              패키지 변경
            </>
          ) : (
            <>
              <Package className="w-5 h-5 text-emerald-600" />
              코칭 패키지 선택
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          {isEditing
            ? '변경할 패키지를 선택해주세요.'
            : '목표에 맞는 코칭 회기를 선택해주세요.'}
        </p>

        {/* 패키지 목록 */}
        <div className="space-y-3">
          {Object.values(PACKAGES).map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPackage === pkg.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : pkg.recommended
                  ? 'border-emerald-300 bg-white hover:border-blue-400'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* 추천 배지 */}
              {pkg.recommended && (
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded">
                  추천
                </div>
              )}

              {/* 선택 체크 */}
              {selectedPackage === pkg.id && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* 아이콘 */}
                <div className="text-2xl">{pkg.icon}</div>

                {/* 내용 */}
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                    <span className="text-xl font-black text-emerald-600">{pkg.sessions}</span>
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

        {/* 선택 버튼 */}
        <div className={isEditing ? 'flex gap-3' : ''}>
          {isEditing && (
            <Button
              onClick={handleCancelEdit}
              variant="outline"
              className="flex-1"
            >
              취소
            </Button>
          )}
          <Button
            onClick={handleSelectPackage}
            disabled={isSubmitting || !selectedPackage || (isEditing && selectedPackage === coachingPackage?.type)}
            className={isEditing ? 'flex-1' : 'w-full'}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {isEditing ? '변경 중...' : '신청 중...'}
              </>
            ) : !selectedPackage ? (
              '패키지를 선택해주세요'
            ) : isEditing && selectedPackage === coachingPackage?.type ? (
              '현재 선택된 패키지입니다'
            ) : (
              <>
                {PACKAGES[selectedPackage].name} {PACKAGES[selectedPackage].sessions}회기 {isEditing ? '로 변경' : '신청하기'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
