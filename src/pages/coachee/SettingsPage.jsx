import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { getActiveSubscription } from '../../lib/subscriptionService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { SubscriptionStatusCard } from '../../components/coachee/SubscriptionStatusCard'
import { CoachInfoCard } from '../../components/coachee/CoachInfoCard'
import { PastSessionsCard } from '../../components/coachee/PastSessionsCard'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card'
import {
  Settings, User, CreditCard, Bell, Shield, LogOut,
  ChevronRight, Mail, Phone, Calendar, Edit3
} from 'lucide-react'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, matchedCoach, subscription, setSubscription, resetAll } = useStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!user?.id || !isSupabaseConfigured()) {
        setIsLoading(false)
        return
      }

      try {
        // 구독 정보 로드
        const subscriptionData = await getActiveSubscription(user.id)
        if (subscriptionData) {
          setSubscription(subscriptionData)
        }
      } catch (err) {
        console.error('설정 데이터 로드 실패:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  const handleLogout = () => {
    resetAll()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-20 lg:pb-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">설정</h1>
          <p className="text-sm text-gray-500">개인정보 및 구독 관리</p>
        </div>
      </div>

      {/* 프로필 요약 */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{user?.name || '회원'}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={() => navigate('/coachee/profile')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit3 className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 개인정보 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-gray-600" />
            개인정보 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <button
            onClick={() => navigate('/coachee/profile')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">내 정보</p>
                <p className="text-sm text-gray-500">이름, 연락처, 생년월일</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/coachee/profile')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">건강 정보 (TDEE)</p>
                <p className="text-sm text-gray-500">키, 체중, 활동량</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </CardContent>
      </Card>

      {/* 구독 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-600" />
            구독 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {subscription?.status === 'active' ? (
            <div className="p-4">
              <SubscriptionStatusCard subscription={subscription} />
            </div>
          ) : (
            <button
              onClick={() => navigate('/coachee/subscription')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-violet-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">구독 플랜 보기</p>
                  <p className="text-sm text-gray-500">월간 구독으로 지속적인 관리</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </CardContent>
      </Card>

      {/* 코치 정보 */}
      {matchedCoach && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CoachInfoCard />
          <PastSessionsCard />
        </div>
      )}

      {/* 기타 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-600" />
            기타
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">알림 설정</p>
                <p className="text-sm text-gray-500">푸시 알림, 이메일 알림</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">개인정보 처리방침</p>
                <p className="text-sm text-gray-500">데이터 보호 정책</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </CardContent>
      </Card>

      {/* 로그아웃 */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 font-medium transition-colors"
      >
        <LogOut className="w-5 h-5" />
        로그아웃
      </button>
    </div>
  )
}
