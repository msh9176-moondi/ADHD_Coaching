/**
 * 피코치 개인정보 페이지
 * 시스템에서 수집된 모든 개인정보를 확인하고 수정할 수 있음
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card'
import TDEESurvey, { calculateMealPortions } from '../../components/ultramind/TDEESurvey'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { getActiveUltramindProgram } from '../../lib/ultramindProgramService'
import { getActiveSubscription } from '../../lib/subscriptionService'
import {
  User, Mail, Phone, Calendar, Scale, Ruler, Activity,
  Brain, Target, Award, CreditCard, MessageSquare,
  Edit3, Save, X, ChevronRight, Check, AlertCircle,
  Sparkles, TrendingUp, Clock, Heart
} from 'lucide-react'

export default function MyProfilePage() {
  const navigate = useNavigate()
  const { user, matchedCoach, coachingPackage, subscription: storeSubscription } = useStore()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(null) // 'basic' | 'tdee' | null
  const [profileData, setProfileData] = useState({
    // 기본 정보
    name: '',
    email: '',
    phone: '',
    birthDate: '',

    // TDEE 정보
    tdee: null,

    // 코칭 정보
    coaching: null,

    // 울트라마인드 정보
    ultramind: null,

    // 구독 정보
    subscription: null,

    // ASRS 결과
    asrs: null,

    // 설문 결과
    surveys: null
  })

  // 데이터 로드
  useEffect(() => {
    loadAllProfileData()
  }, [user?.id])

  const loadAllProfileData = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      // 기본 사용자 정보
      const basicInfo = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        birthDate: user.birthDate || ''
      }

      // TDEE 정보 (localStorage에서)
      let tdeeInfo = null
      const storedTDEE = localStorage.getItem(`tdee_data_${user.id}`)
      if (storedTDEE) {
        try {
          tdeeInfo = JSON.parse(storedTDEE)
        } catch (e) {
          console.warn('TDEE 데이터 파싱 실패')
        }
      }

      // 울트라마인드 프로그램에서 TDEE 확인
      const ultramindProgram = await getActiveUltramindProgram(user.id)
      if (!tdeeInfo && ultramindProgram?.program_data?.tdeeData) {
        tdeeInfo = ultramindProgram.program_data.tdeeData
      }

      // 코칭 정보
      let coachingInfo = null
      if (matchedCoach) {
        coachingInfo = {
          coachName: matchedCoach.coachName,
          packageType: matchedCoach.packageType || coachingPackage?.type,
          totalSessions: coachingPackage?.totalSessions || matchedCoach.totalSessions,
          completedSessions: coachingPackage?.completedSessions || 0,
          currentSession: coachingPackage?.currentSession || 1,
          matchedAt: matchedCoach.matchedAt
        }
      }

      // 구독 정보
      let subscriptionInfo = storeSubscription
      if (!subscriptionInfo && isSupabaseConfigured()) {
        subscriptionInfo = await getActiveSubscription(user.id)
      }

      // ASRS 결과 (store에서)
      const asrsResult = useStore.getState().asrsResult

      // 설문 결과 (store에서)
      const preSurvey = useStore.getState().preSurvey
      const postSurvey = useStore.getState().postSurvey

      setProfileData({
        ...basicInfo,
        tdee: tdeeInfo,
        coaching: coachingInfo,
        ultramind: ultramindProgram ? {
          status: ultramindProgram.status,
          startDate: ultramindProgram.start_date,
          endDate: ultramindProgram.end_date,
          currentWeek: ultramindProgram.current_week
        } : null,
        subscription: subscriptionInfo,
        asrs: asrsResult,
        surveys: {
          pre: preSurvey,
          post: postSurvey
        }
      })
    } catch (err) {
      console.error('프로필 데이터 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  // TDEE 저장
  const handleSaveTDEE = (tdeeData) => {
    // localStorage에 저장
    localStorage.setItem(`tdee_data_${user.id}`, JSON.stringify(tdeeData))

    // 울트라마인드 프로그램에도 업데이트
    const localProgram = localStorage.getItem(`ultramind_program_${user.id}`)
    if (localProgram) {
      try {
        const program = JSON.parse(localProgram)
        program.program_data = {
          ...program.program_data,
          tdeeData
        }
        localStorage.setItem(`ultramind_program_${user.id}`, JSON.stringify(program))
      } catch (e) {
        console.warn('프로그램 업데이트 실패')
      }
    }

    setProfileData(prev => ({ ...prev, tdee: tdeeData }))
    setEditMode(null)
  }

  // 기본 정보 저장
  const handleSaveBasicInfo = async () => {
    setSaving(true)
    try {
      // TODO: Supabase에 저장
      setEditMode(null)
    } catch (err) {
      console.error('저장 실패:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">내 정보</h1>
          <p className="text-sm text-gray-500">개인정보 확인 및 수정</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              기본 정보
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow icon={<User className="w-4 h-4" />} label="이름" value={profileData.name || '-'} />
          <InfoRow icon={<Mail className="w-4 h-4" />} label="이메일" value={profileData.email || '-'} />
          <InfoRow icon={<Phone className="w-4 h-4" />} label="연락처" value={profileData.phone || '-'} />
        </CardContent>
      </Card>

      {/* 신체 정보 & TDEE */}
      <Card className="border-emerald-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-500" />
              신체 정보 & 칼로리
            </CardTitle>
            <button
              onClick={() => setEditMode(editMode === 'tdee' ? null : 'tdee')}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              {editMode === 'tdee' ? '취소' : '수정'}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {editMode === 'tdee' ? (
            <TDEESurvey
              onComplete={handleSaveTDEE}
              initialData={profileData.tdee}
            />
          ) : profileData.tdee ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={<User className="w-4 h-4" />} label="성별" value={profileData.tdee.gender === 'male' ? '남성' : '여성'} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="나이" value={`${profileData.tdee.age}세`} />
                <InfoRow icon={<Ruler className="w-4 h-4" />} label="키" value={`${profileData.tdee.height}cm`} />
                <InfoRow icon={<Scale className="w-4 h-4" />} label="체중" value={`${profileData.tdee.weight}kg`} />
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">활동량</span>
                  <span className="text-sm font-medium text-gray-800">
                    {getActivityLabel(profileData.tdee.activityLevel)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">일일 필요 칼로리</span>
                  <span className="text-lg font-bold text-emerald-600">{profileData.tdee.tdee?.toLocaleString()} kcal</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  기초대사량(BMR): {profileData.tdee.bmr?.toLocaleString()} kcal
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">신체 정보가 등록되지 않았습니다</p>
              <button
                onClick={() => setEditMode('tdee')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                신체 정보 등록하기
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 코칭 정보 */}
      {profileData.coaching && (
        <Card className="border-violet-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-500" />
              코칭 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={<User className="w-4 h-4" />} label="담당 코치" value={profileData.coaching.coachName} />
            <InfoRow icon={<Target className="w-4 h-4" />} label="패키지" value={getPackageLabel(profileData.coaching.packageType)} />
            <InfoRow
              icon={<TrendingUp className="w-4 h-4" />}
              label="진행 현황"
              value={`${profileData.coaching.completedSessions}/${profileData.coaching.totalSessions} 회기 완료`}
            />
            {profileData.coaching.matchedAt && (
              <InfoRow
                icon={<Calendar className="w-4 h-4" />}
                label="매칭일"
                value={new Date(profileData.coaching.matchedAt).toLocaleDateString('ko-KR')}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* 울트라마인드 프로그램 */}
      {profileData.ultramind && (
        <Card className="border-indigo-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" />
              Ultra Mind 프로그램
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              icon={<Sparkles className="w-4 h-4" />}
              label="상태"
              value={profileData.ultramind.status === 'active' ? '진행 중' : '완료'}
            />
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="시작일"
              value={new Date(profileData.ultramind.startDate).toLocaleDateString('ko-KR')}
            />
            <InfoRow
              icon={<Target className="w-4 h-4" />}
              label="현재 주차"
              value={`${profileData.ultramind.currentWeek || 1}주차 / 6주`}
            />
            <button
              onClick={() => navigate('/coachee/ultramind')}
              className="w-full py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              프로그램 상세 보기
              <ChevronRight className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* 구독 정보 */}
      {profileData.subscription && (
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              구독 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              icon={<Check className="w-4 h-4" />}
              label="상태"
              value={getSubscriptionStatus(profileData.subscription.status)}
              valueColor={profileData.subscription.status === 'active' ? 'text-green-600' : 'text-gray-600'}
            />
            <InfoRow
              icon={<Award className="w-4 h-4" />}
              label="플랜"
              value={profileData.subscription.plan_name || getSubscriptionPlan(profileData.subscription.plan_type)}
            />
            {profileData.subscription.next_billing_date && (
              <InfoRow
                icon={<Calendar className="w-4 h-4" />}
                label="다음 결제일"
                value={new Date(profileData.subscription.next_billing_date).toLocaleDateString('ko-KR')}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* ASRS 검사 결과 */}
      {profileData.asrs && (
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-5 h-5 text-amber-500" />
              ASRS 검사 결과
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              icon={<Target className="w-4 h-4" />}
              label="총점"
              value={`${profileData.asrs.totalScore} / ${profileData.asrs.maxScore}`}
            />
            <InfoRow
              icon={<AlertCircle className="w-4 h-4" />}
              label="수준"
              value={profileData.asrs.level}
            />
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="p-2 bg-amber-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">부주의</p>
                <p className="text-sm font-semibold text-amber-700">{profileData.asrs.inattentionScore}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">과잉행동</p>
                <p className="text-sm font-semibold text-orange-700">{profileData.asrs.hyperactivityScore}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">충동성</p>
                <p className="text-sm font-semibold text-red-700">{profileData.asrs.impulsivityScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 설문 결과 요약 */}
      {(profileData.surveys?.pre || profileData.surveys?.post) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              코칭 설문 결과
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profileData.surveys.pre && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">사전 설문</span>
                  <span className="text-sm font-medium text-gray-800">총점 {profileData.surveys.pre.totalScore}</span>
                </div>
              </div>
            )}
            {profileData.surveys.post && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">사후 설문</span>
                  <span className="text-sm font-medium text-green-700">총점 {profileData.surveys.post.totalScore}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 데이터 관리 */}
      <Card className="border-gray-200">
        <CardContent className="py-4">
          <p className="text-xs text-gray-500 text-center">
            개인정보 삭제 요청은 코치에게 문의해주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// 정보 행 컴포넌트
function InfoRow({ icon, label, value, valueColor = 'text-gray-800' }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className={`text-sm font-medium ${valueColor}`}>{value}</span>
    </div>
  )
}

// 활동량 라벨
function getActivityLabel(level) {
  const labels = {
    sedentary: '좌식생활',
    light: '가벼운 활동',
    moderate: '보통 활동',
    active: '활발한 활동',
    veryActive: '매우 활발'
  }
  return labels[level] || level
}

// 패키지 라벨
function getPackageLabel(type) {
  const labels = {
    basic: '베이직 (5회기)',
    standard: '스탠다드 (8회기)',
    premium: '프리미엄 (12회기)'
  }
  return labels[type] || type
}

// 구독 상태
function getSubscriptionStatus(status) {
  const statuses = {
    active: '활성',
    pending: '대기 중',
    cancelled: '해지됨',
    expired: '만료됨'
  }
  return statuses[status] || status
}

// 구독 플랜
function getSubscriptionPlan(type) {
  const plans = {
    monthly: '월간 구독',
    yearly: '연간 구독'
  }
  return plans[type] || type
}
