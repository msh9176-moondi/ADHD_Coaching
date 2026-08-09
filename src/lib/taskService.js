/**
 * 과제 관련 서비스
 * Supabase 연동
 */

import { supabase, isSupabaseConfigured } from './supabase'

// 과제 생성
export async function createTask(taskData) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single()

  if (error) throw error
  return data
}

// 피코치의 모든 과제 조회
export async function getCoacheeTasks(coacheeId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('coachee_id', coacheeId)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data
}

// 코치가 담당하는 피코치들의 과제 조회
export async function getCoachTasks(coachId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      coachee:coachee_id(id, name, avatar_url)
    `)
    .eq('coach_id', coachId)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data
}

// 과제 수정
export async function updateTask(taskId, updateData) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 과제 상태 변경
export async function updateTaskStatus(taskId, status) {
  return updateTask(taskId, { status })
}

// 과제 완료 횟수 증가
export async function incrementTaskCount(taskId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 현재 값 조회 후 증가
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('completed_count, target_count')
    .eq('id', taskId)
    .single()

  if (fetchError) throw fetchError

  const newCount = (task.completed_count || 0) + 1
  const updates = { completed_count: newCount }

  // 목표 횟수 달성 시 완료 처리
  if (task.target_count && newCount >= task.target_count) {
    updates.status = 'completed'
  }

  return updateTask(taskId, updates)
}

// 과제 삭제
export async function deleteTask(taskId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw error
  return true
}

// 과제 리마인더 전송
export async function sendTaskReminder(coacheeId, taskTitle, message) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: coacheeId,
      type: 'task_reminder',
      title: '과제 리마인더',
      message: message || `"${taskTitle}" 과제를 확인해주세요!`,
      metadata: { task_title: taskTitle }
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 과제 실시간 구독
export function subscribeToTasks(coacheeId, callback) {
  if (!isSupabaseConfigured()) return () => {}

  const channel = supabase
    .channel(`tasks:${coacheeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `coachee_id=eq.${coacheeId}`
      },
      (payload) => callback(payload)
    )
    .subscribe()

  return () => channel.unsubscribe()
}

// 실행 기록 추가
export async function addExecutionRecord(coacheeId, content, taskId = null) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('execution_records')
    .insert({
      coachee_id: coacheeId,
      task_id: taskId,
      content,
      completed: true
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 실행 기록 조회
export async function getExecutionRecords(coacheeId, limit = 10) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('execution_records')
    .select('*')
    .eq('coachee_id', coacheeId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
