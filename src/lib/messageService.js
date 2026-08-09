/**
 * 메시지 관련 서비스
 * Supabase 연동
 */

import { supabase, isSupabaseConfigured } from './supabase'

// 대화방 조회 또는 생성
export async function getOrCreateConversation(coachId, coacheeId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 기존 대화방 찾기 (maybeSingle: 없으면 null 반환)
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .eq('coach_id', coachId)
    .eq('coachee_id', coacheeId)
    .maybeSingle()

  if (findError) throw findError
  if (existing) return existing

  // 새 대화방 생성
  const { data, error } = await supabase
    .from('conversations')
    .insert({ coach_id: coachId, coachee_id: coacheeId })
    .select()
    .single()

  if (error) throw error
  return data
}

// 사용자의 대화방 목록 조회
export async function getUserConversations(userId, role) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const filterColumn = role === 'coach' ? 'coach_id' : 'coachee_id'
  const otherColumn = role === 'coach' ? 'coachee_id' : 'coach_id'

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      other_user:${otherColumn}(id, name, avatar_url)
    `)
    .eq(filterColumn, userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

// 대화방의 메시지 조회
export async function getMessages(conversationId, limit = 50) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id(id, name, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}

// 메시지 전송
export async function sendMessage(conversationId, senderId, senderRole, content, type = 'normal', metadata = null) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      sender_role: senderRole,
      content,
      type,
      metadata
    })
    .select()
    .single()

  if (error) throw error

  // 대화방 업데이트 시간 갱신
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  return data
}

// 선언서 메시지 전송
export async function sendDeclaration(conversationId, senderId, declarationData) {
  return sendMessage(
    conversationId,
    senderId,
    'coach',
    '참여 선언서가 도착했습니다.',
    'declaration',
    declarationData
  )
}

// 목표합의서 메시지 전송
export async function sendGoalAgreement(conversationId, senderId, goalData) {
  return sendMessage(
    conversationId,
    senderId,
    'coach',
    '목표합의서가 도착했습니다.',
    'goal_agreement',
    goalData
  )
}

// 메시지 읽음 처리
export async function markAsRead(messageId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('id', messageId)

  if (error) throw error
  return true
}

// 대화방의 모든 메시지 읽음 처리
export async function markAllAsRead(conversationId, userId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)  // 본인이 보낸 메시지 제외

  if (error) throw error
  return true
}

// 안 읽은 메시지 수 조회
export async function getUnreadCount(conversationId, userId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('read', false)
    .neq('sender_id', userId)

  if (error) throw error
  return count || 0
}

// 메시지 메타데이터 업데이트
export async function updateMessageMetadata(messageId, metadata) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('messages')
    .update({ metadata })
    .eq('id', messageId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 메시지 실시간 구독
export function subscribeToMessages(conversationId, callback) {
  if (!isSupabaseConfigured()) return () => {}

  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => callback(payload.new)
    )
    .subscribe()

  return () => channel.unsubscribe()
}

// 피코치의 최신 코치 메시지 조회
export async function getLastCoachMessage(coacheeId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 피코치가 포함된 대화방 찾기
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, coach_id')
    .eq('coachee_id', coacheeId)

  if (!conversations || conversations.length === 0) {
    return null
  }

  const conversationIds = conversations.map(c => c.id)
  const coachId = conversations[0].coach_id

  // 코치가 보낸 최신 메시지 조회
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .eq('sender_role', 'coach')
    .eq('type', 'normal')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  if (!messages || messages.length === 0) {
    return null
  }

  const lastMessage = messages[0]

  // 코치 이름 조회
  let coachName = '플로카 코치'
  if (coachId) {
    const { data: coachData } = await supabase
      .from('users')
      .select('name')
      .eq('id', coachId)
      .single()
    if (coachData?.name) {
      coachName = coachData.name
    }
  }

  // 읽지 않은 메시지 수 조회
  const { count: unreadCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', conversationIds)
    .eq('sender_role', 'coach')
    .eq('read', false)

  return {
    content: lastMessage.content,
    coachName,
    timestamp: lastMessage.created_at,
    unreadCount: unreadCount || 0
  }
}

// 피코치의 코칭 진행 상태 조회 (선언서, 목표합의서 완료 여부)
export async function getCoachingProgressStatus(coacheeId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 피코치가 포함된 대화방 찾기
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('coachee_id', coacheeId)

  if (!conversations || conversations.length === 0) {
    return {
      declarationCompleted: false,
      goalAgreementCompleted: false,
      nextSessionPrepared: false
    }
  }

  const conversationIds = conversations.map(c => c.id)

  // 해당 대화방들의 메시지 조회
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)

  if (error) throw error
  if (!messages) {
    return {
      declarationCompleted: false,
      goalAgreementCompleted: false,
      nextSessionPrepared: false
    }
  }

  // 선언서 완료 확인
  const declarationCompleted = messages.some(msg =>
    msg.type === 'system' && msg.content?.includes('코칭 참여 선언이 완료되었습니다')
  )

  // 목표합의서 완료 확인
  const goalAgreementCompleted = messages.some(msg => {
    // system 메시지로 완료 확인
    if (msg.type === 'system' && msg.content?.includes('목표 합의가 완료되었습니다')) {
      return true
    }
    // 또는 goal_agreement 메시지의 status가 confirmed인 경우
    if (msg.type === 'goal_agreement' && msg.metadata?.goalData?.status === 'confirmed') {
      return true
    }
    return false
  })

  // 다음 상담 준비 (예약된 세션이 있는지 확인)
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('coachee_id', coacheeId)
    .eq('status', 'scheduled')
    .limit(1)

  const nextSessionPrepared = sessions && sessions.length > 0

  return {
    declarationCompleted,
    goalAgreementCompleted,
    nextSessionPrepared
  }
}

// 피코치의 확정된 목표 합의서 조회
export async function getConfirmedGoals(coacheeId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 먼저 피코치가 포함된 대화방 찾기
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('coachee_id', coacheeId)

  if (!conversations || conversations.length === 0) return []

  const conversationIds = conversations.map(c => c.id)

  // 해당 대화방들에서 목표 합의서 메시지 조회
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .eq('type', 'goal_agreement')
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!messages) return []

  // 확정된 목표 합의서만 필터링 (metadata.goalData.status === 'confirmed')
  const confirmedGoals = messages
    .filter(msg => msg.metadata?.goalData?.status === 'confirmed')
    .map(msg => ({
      id: msg.id,
      goals: msg.metadata?.goalData?.goals || [],
      confirmedAt: msg.updated_at || msg.created_at,
      version: msg.metadata?.goalData?.version || 1
    }))

  return confirmedGoals
}
