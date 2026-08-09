import { supabase, isSupabaseConfigured } from './supabase'

/**
 * 구독 플랜 상수
 */
export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: '월간 구독',
    sessionsPerMonth: 2,
    price: 99000,
    discountRate: 0,
    description: '매월 2회 사후관리 세션'
  },
  quarterly: {
    id: 'quarterly',
    name: '분기 구독',
    sessionsPerMonth: 2,
    price: 267300, // 10% 할인
    discountRate: 10,
    description: '3개월간 매월 2회 세션 (10% 할인)'
  },
  yearly: {
    id: 'yearly',
    name: '연간 구독',
    sessionsPerMonth: 2,
    price: 950400, // 20% 할인
    discountRate: 20,
    description: '12개월간 매월 2회 세션 (20% 할인)'
  }
}

/**
 * 구독 상태 라벨
 */
export const SUBSCRIPTION_STATUS_LABELS = {
  pending: '대기 중',
  active: '구독 중',
  cancelled: '해지됨',
  expired: '만료됨'
}

/**
 * 사용자의 활성 구독 조회
 */
export async function getActiveSubscription(userId) {
  if (!isSupabaseConfigured() || !userId) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('구독 조회 실패:', error)
    return null
  }

  return data
}

/**
 * 사용자의 모든 구독 이력 조회
 */
export async function getSubscriptionHistory(userId) {
  if (!isSupabaseConfigured() || !userId) return []

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('구독 이력 조회 실패:', error)
    return []
  }

  return data || []
}

/**
 * 새 구독 생성
 */
export async function createSubscription({ userId, coachId, planType }) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase가 설정되지 않았습니다')
  }

  const plan = SUBSCRIPTION_PLANS[planType]
  if (!plan) {
    throw new Error('유효하지 않은 플랜입니다')
  }

  // 기간 계산
  const now = new Date()
  let periodEnd = new Date(now)

  if (planType === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  } else if (planType === 'quarterly') {
    periodEnd.setMonth(periodEnd.getMonth() + 3)
  } else if (planType === 'yearly') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      coach_id: coachId,
      plan_type: planType,
      status: 'active',
      sessions_per_month: plan.sessionsPerMonth,
      sessions_used_this_month: 0,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      payment_status: 'unpaid' // 결제 시스템 연동 전까지
    })
    .select()
    .single()

  if (error) {
    console.error('구독 생성 실패:', error)
    throw error
  }

  // coachee_profiles에 subscription_id 연결
  await supabase
    .from('coachee_profiles')
    .update({ subscription_id: data.id })
    .eq('user_id', userId)

  return data
}

/**
 * 구독 상태 업데이트
 */
export async function updateSubscriptionStatus(subscriptionId, status) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase가 설정되지 않았습니다')
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update({ status })
    .eq('id', subscriptionId)
    .select()
    .single()

  if (error) {
    console.error('구독 상태 업데이트 실패:', error)
    throw error
  }

  return data
}

/**
 * 구독 취소
 */
export async function cancelSubscription(subscriptionId) {
  return updateSubscriptionStatus(subscriptionId, 'cancelled')
}

/**
 * 세션 사용 기록
 */
export async function useSubscriptionSession(subscriptionId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase가 설정되지 않았습니다')
  }

  // 현재 구독 정보 조회
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single()

  if (fetchError) {
    throw fetchError
  }

  // 세션 한도 체크
  if (subscription.sessions_used_this_month >= subscription.sessions_per_month) {
    throw new Error('이번 달 세션을 모두 사용했습니다')
  }

  // 사용량 증가
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      sessions_used_this_month: subscription.sessions_used_this_month + 1
    })
    .eq('id', subscriptionId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * 남은 세션 수 조회
 */
export async function getRemainingSessionsCount(subscriptionId) {
  if (!isSupabaseConfigured() || !subscriptionId) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .select('sessions_per_month, sessions_used_this_month')
    .eq('id', subscriptionId)
    .single()

  if (error) {
    console.error('세션 수 조회 실패:', error)
    return null
  }

  return data.sessions_per_month - data.sessions_used_this_month
}

/**
 * 코치의 구독자 목록 조회
 */
export async function getCoachSubscribers(coachId) {
  if (!isSupabaseConfigured() || !coachId) return []

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      user:profiles!subscriptions_user_id_fkey (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('coach_id', coachId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('구독자 목록 조회 실패:', error)
    return []
  }

  return data || []
}

/**
 * 구독 기간 만료 체크
 */
export function isSubscriptionExpired(subscription) {
  if (!subscription || !subscription.current_period_end) return true
  return new Date(subscription.current_period_end) < new Date()
}

/**
 * 다음 갱신일까지 남은 일수
 */
export function getDaysUntilRenewal(subscription) {
  if (!subscription || !subscription.current_period_end) return 0

  const now = new Date()
  const end = new Date(subscription.current_period_end)
  const diff = end - now

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
