/**
 * 인증 관련 서비스
 * Supabase Auth 연동
 */

import { supabase, isSupabaseConfigured } from './supabase'

// 회원가입
export async function signUp(email, password, userData) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 1. Supabase Auth 회원가입
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw authError

  // 2. users 테이블에 프로필 저장
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone || null,
      adhd_status: userData.adhdStatus || null,
    })

  if (profileError) throw profileError

  return authData
}

// 로그인
export async function signIn(email, password) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // 사용자 프로필 조회
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single()

  return { ...data, profile }
}

// 로그아웃
export async function signOut() {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { error } = await supabase.auth.signOut()
  if (error) throw error
  return true
}

// 현재 세션 조회
export async function getSession() {
  if (!isSupabaseConfigured()) return null

  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// 현재 사용자 프로필 조회
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return profile
}

// 프로필 업데이트
export async function updateProfile(userId, updates) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 인증 상태 변경 리스너
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) return { data: { subscription: { unsubscribe: () => {} } } }

  return supabase.auth.onAuthStateChange(async (event, session) => {
    let profile = null

    if (session?.user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      profile = data
    }

    callback(event, session, profile)
  })
}

// 비밀번호 재설정 이메일 발송
export async function resetPassword(email) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
  return true
}

// 비밀번호 변경
export async function updatePassword(newPassword) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) throw error
  return true
}
