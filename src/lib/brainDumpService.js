/**
 * 브레인 덤프 동기화 서비스
 * Supabase 연동 + localStorage 폴백
 */

import { supabase, isSupabaseConfigured } from './supabase'

const LOCAL_STORAGE_KEY = (userId) => `brain_dump_${userId}`

// 브레인 덤프 데이터 조회
export async function getBrainDump(userId) {
  // Supabase가 설정되어 있으면 서버에서 조회
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('brain_dumps')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = 데이터 없음, 그 외 에러는 throw
        throw error
      }

      if (data) {
        // 서버 데이터를 localStorage에도 캐시
        localStorage.setItem(LOCAL_STORAGE_KEY(userId), JSON.stringify({
          dailyTasks: data.daily_tasks || [],
          comprehensiveTasks: data.comprehensive_tasks || [],
          updatedAt: data.updated_at
        }))
        return {
          dailyTasks: data.daily_tasks || [],
          comprehensiveTasks: data.comprehensive_tasks || []
        }
      }
    } catch (err) {
      console.error('서버 조회 실패, localStorage 폴백:', err)
    }
  }

  // localStorage에서 조회 (폴백)
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY(userId))
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      return {
        dailyTasks: parsed.dailyTasks || [],
        comprehensiveTasks: parsed.comprehensiveTasks || []
      }
    } catch (e) {
      console.error('localStorage 파싱 실패:', e)
    }
  }

  return { dailyTasks: [], comprehensiveTasks: [] }
}

// 브레인 덤프 데이터 저장
export async function saveBrainDump(userId, dailyTasks, comprehensiveTasks) {
  const now = new Date().toISOString()

  // localStorage에 먼저 저장 (오프라인 지원)
  localStorage.setItem(LOCAL_STORAGE_KEY(userId), JSON.stringify({
    dailyTasks,
    comprehensiveTasks,
    updatedAt: now
  }))

  // Supabase가 설정되어 있으면 서버에도 저장
  if (isSupabaseConfigured()) {
    try {
      const { data: existing } = await supabase
        .from('brain_dumps')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (existing) {
        // 업데이트
        const { error } = await supabase
          .from('brain_dumps')
          .update({
            daily_tasks: dailyTasks,
            comprehensive_tasks: comprehensiveTasks,
            updated_at: now
          })
          .eq('user_id', userId)

        if (error) throw error
      } else {
        // 새로 생성
        const { error } = await supabase
          .from('brain_dumps')
          .insert({
            user_id: userId,
            daily_tasks: dailyTasks,
            comprehensive_tasks: comprehensiveTasks,
            updated_at: now
          })

        if (error) throw error
      }

      // 이벤트 발생 (다른 컴포넌트 동기화용)
      window.dispatchEvent(new Event('brain-dump-updated'))
      return true
    } catch (err) {
      console.error('서버 저장 실패:', err)
      // localStorage에는 이미 저장됨, 나중에 동기화 가능
      return false
    }
  }

  window.dispatchEvent(new Event('brain-dump-updated'))
  return true
}

// 로컬 데이터를 서버로 마이그레이션
export async function migrateLocalToServer(userId) {
  if (!isSupabaseConfigured()) return false

  const saved = localStorage.getItem(LOCAL_STORAGE_KEY(userId))
  if (!saved) return false

  try {
    const parsed = JSON.parse(saved)

    // 서버에 데이터가 있는지 확인
    const { data: existing } = await supabase
      .from('brain_dumps')
      .select('id, updated_at')
      .eq('user_id', userId)
      .single()

    // 서버 데이터가 없거나 로컬이 더 최신이면 업로드
    if (!existing || (parsed.updatedAt && new Date(parsed.updatedAt) > new Date(existing.updated_at))) {
      await saveBrainDump(userId, parsed.dailyTasks || [], parsed.comprehensiveTasks || [])
      console.log('로컬 데이터 서버로 마이그레이션 완료')
      return true
    }

    return false
  } catch (err) {
    console.error('마이그레이션 실패:', err)
    return false
  }
}

// 실시간 구독 (다른 기기에서 변경 시 동기화)
export function subscribeToBrainDump(userId, callback) {
  if (!isSupabaseConfigured()) return () => {}

  const channel = supabase
    .channel(`brain_dump:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'brain_dumps',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        if (payload.new) {
          callback({
            dailyTasks: payload.new.daily_tasks || [],
            comprehensiveTasks: payload.new.comprehensive_tasks || []
          })
        }
      }
    )
    .subscribe()

  return () => channel.unsubscribe()
}
