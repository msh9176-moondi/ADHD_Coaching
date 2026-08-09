/**
 * 알림 관련 서비스
 * Supabase 연동
 */

import { supabase, isSupabaseConfigured } from './supabase'

// 알림 목록 조회
export async function getNotifications(userId, limit = 20) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// 안 읽은 알림 수 조회
export async function getUnreadCount(userId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) throw error
  return count || 0
}

// 알림 읽음 처리
export async function markAsRead(notificationId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) throw error
  return true
}

// 모든 알림 읽음 처리
export async function markAllAsRead(userId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) throw error
  return true
}

// 알림 삭제
export async function deleteNotification(notificationId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) throw error
  return true
}

// 알림 생성 (시스템용)
export async function createNotification(userId, type, title, message, metadata = null) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      metadata
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 세션 리마인더 알림
export async function sendSessionReminder(userId, sessionData) {
  return createNotification(
    userId,
    'session_reminder',
    '세션 알림',
    `${sessionData.date} ${sessionData.time}에 세션이 예정되어 있습니다.`,
    { session_id: sessionData.id }
  )
}

// 알림 실시간 구독
export function subscribeToNotifications(userId, callback) {
  if (!isSupabaseConfigured()) return () => {}

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => callback(payload.new)
    )
    .subscribe()

  return () => channel.unsubscribe()
}
