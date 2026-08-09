/**
 * 세션 및 세션일지 관련 서비스
 * Supabase 연동
 */

import { supabase, isSupabaseConfigured } from './supabase'
import { formatDate, formatTime, getWeekRange, getToday, addMonths } from './utils/dateUtils'
import { enrichWithUserDataAsync } from './utils/dataUtils'

// 세션 조회 또는 생성 (세션 상태를 in_progress로 설정)
export async function getOrCreateSession(coachId, coacheeId, sessionNumber) {
  console.log('[sessionService] getOrCreateSession 호출:', { coachId, coacheeId, sessionNumber })

  if (!isSupabaseConfigured()) {
    console.error('[sessionService] Supabase 미설정')
    throw new Error('LOCAL_MODE')
  }

  // 기존 세션 찾기
  console.log('[sessionService] 기존 세션 조회 중...')
  const { data: existingList, error: findError } = await supabase
    .from('sessions')
    .select('*')
    .eq('coach_id', coachId)
    .eq('coachee_id', coacheeId)
    .eq('session_number', sessionNumber)
    .order('created_at', { ascending: false })
    .limit(1)

  if (findError) {
    console.error('[sessionService] 세션 조회 실패:', findError)
    throw findError
  }

  if (existingList && existingList.length > 0) {
    const existing = existingList[0]
    console.log('[sessionService] 기존 세션 발견:', existing)

    // 기존 세션이 completed가 아니면 in_progress로 업데이트
    if (existing.status !== 'completed') {
      console.log('[sessionService] 세션 상태를 in_progress로 업데이트')
      const { data: updated, error: updateError } = await supabase
        .from('sessions')
        .update({ status: 'in_progress' })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        console.error('[sessionService] 상태 업데이트 실패:', updateError)
        return existing // 실패해도 기존 세션 반환
      }
      return updated
    }
    return existing
  }

  // 새 세션 생성
  console.log('[sessionService] 새 세션 생성 중...')
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      coach_id: coachId,
      coachee_id: coacheeId,
      session_number: sessionNumber,
      date: getToday(),
      time: formatTime(),
      status: 'in_progress'
    })
    .select()
    .single()

  if (error) {
    console.error('[sessionService] 세션 생성 실패:', error)
    throw error
  }

  console.log('[sessionService] 세션 생성 완료:', data)
  return data
}

// 세션일지 저장
export async function saveSessionNote(sessionId, coachId, noteData) {
  console.log('[sessionService] saveSessionNote 호출:', { sessionId, coachId, noteData })

  if (!isSupabaseConfigured()) {
    console.error('[sessionService] Supabase 미설정')
    throw new Error('LOCAL_MODE')
  }

  // 기존 일지 확인
  console.log('[sessionService] 기존 일지 확인 중...')
  const { data: existingList, error: findError } = await supabase
    .from('session_notes')
    .select('id')
    .eq('session_id', sessionId)
    .limit(1)

  if (findError) {
    console.error('[sessionService] 일지 조회 실패:', findError)
    throw findError
  }

  const existing = existingList && existingList.length > 0 ? existingList[0] : null
  console.log('[sessionService] 기존 일지:', existing)

  const noteRecord = {
    session_id: sessionId,
    coach_id: coachId,
    summary: noteData.content || '',
    client_state: JSON.stringify({
      mood: noteData.mood,
      emotion: noteData.emotion,
      bodyResponse: noteData.bodyResponse
    }),
    main_topics: noteData.sessionTopic ? [noteData.sessionTopic] : [],
    insights: JSON.stringify({
      coachingGoal: noteData.coachingGoal,
      taskReview: noteData.taskReview,
      autoThought: noteData.autoThought,
      avoidance: noteData.avoidance,
      helpfulAction: noteData.helpfulAction,
      achievement: noteData.achievement,
      desiredResult: noteData.desiredResult
    }),
    next_actions: noteData.nextTask ? [noteData.nextTask] : [],
    coach_notes: noteData.privateNote || ''
  }

  console.log('[sessionService] 저장할 데이터:', noteRecord)

  if (existing) {
    // 업데이트
    console.log('[sessionService] 기존 일지 업데이트 중...')
    const { data, error } = await supabase
      .from('session_notes')
      .update(noteRecord)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('[sessionService] 일지 업데이트 실패:', error)
      throw error
    }
    console.log('[sessionService] 업데이트 완료:', data)
    return data
  } else {
    // 새로 생성
    console.log('[sessionService] 새 일지 생성 중...')
    const { data, error } = await supabase
      .from('session_notes')
      .insert(noteRecord)
      .select()
      .single()

    if (error) {
      console.error('[sessionService] 일지 생성 실패:', error)
      throw error
    }
    console.log('[sessionService] 생성 완료:', data)
    return data
  }
}

// 세션일지 조회
export async function getSessionNote(sessionId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data: dataList, error } = await supabase
    .from('session_notes')
    .select('*')
    .eq('session_id', sessionId)
    .limit(1)

  if (error) throw error

  const data = dataList && dataList.length > 0 ? dataList[0] : null
  if (!data) return null

  // 데이터 변환
  const clientState = typeof data.client_state === 'string'
    ? JSON.parse(data.client_state)
    : data.client_state || {}

  const insights = typeof data.insights === 'string'
    ? JSON.parse(data.insights)
    : data.insights || {}

  return {
    sessionTopic: data.main_topics?.[0] || '',
    mood: clientState.mood || '',
    emotion: clientState.emotion || '',
    bodyResponse: clientState.bodyResponse || '',
    coachingGoal: insights.coachingGoal || '',
    taskReview: insights.taskReview || '',
    content: data.summary || '',
    autoThought: insights.autoThought || '',
    avoidance: insights.avoidance || '',
    helpfulAction: insights.helpfulAction || '',
    achievement: insights.achievement || '',
    desiredResult: insights.desiredResult || '',
    nextTask: data.next_actions?.[0] || '',
    privateNote: data.coach_notes || ''
  }
}

// 피코치의 세션 목록 조회 (코치 ID + 피코치 ID)
export async function getCoacheeSessions(coachId, coacheeId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_notes (*)
    `)
    .eq('coach_id', coachId)
    .eq('coachee_id', coacheeId)
    .order('session_number', { ascending: true })

  if (error) throw error
  return data || []
}

// 피코치 본인의 세션 목록 조회 (피코치 ID만 사용)
export async function getSessionsForCoachee(coacheeId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_notes (*)
    `)
    .eq('coachee_id', coacheeId)
    .order('session_number', { ascending: true })

  if (error) throw error
  return data || []
}

// 코치의 모든 세션 목록 조회
export async function getCoachSessions(coachId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_notes (*)
    `)
    .eq('coach_id', coachId)
    .order('date', { ascending: true })

  if (error) throw error

  // 피코치 이름 조회
  if (data && data.length > 0) {
    return await enrichWithUserDataAsync(data, supabase, 'coachee_id', 'coachee_name')
  }

  return data || []
}

// 새 세션 생성
export async function createSession(sessionData) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      coach_id: sessionData.coach_id || sessionData.coachId,
      coachee_id: sessionData.coachee_id || sessionData.coacheeId,
      session_number: sessionData.session_number || sessionData.sessionNumber || 1,
      date: sessionData.date,
      time: sessionData.time,
      duration: sessionData.duration || 60,
      topic: sessionData.topic || '',
      status: sessionData.status || 'scheduled'
    })
    .select()
    .single()

  if (error) throw error

  // coachee_name은 DB에 저장하지 않고 반환 데이터에 추가
  return {
    ...data,
    coachee_name: sessionData.coachee_name || sessionData.coacheeName
  }
}

// 세션 삭제 (세션일지도 함께 삭제)
export async function deleteSession(sessionId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 먼저 세션일지 삭제
  const { error: noteError } = await supabase
    .from('session_notes')
    .delete()
    .eq('session_id', sessionId)

  if (noteError) {
    console.error('세션일지 삭제 실패:', noteError)
  }

  // 세션 삭제
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)

  if (error) throw error
  return true
}

// 세션일지만 삭제
export async function deleteSessionNote(sessionId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { error } = await supabase
    .from('session_notes')
    .delete()
    .eq('session_id', sessionId)

  if (error) throw error
  return true
}

// 사후관리 세션 예약 (마지막 회기 종료 후 1개월 뒤)
export async function scheduleFollowUpSession(coachId, coacheeId, baseDate = new Date()) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 1개월 후 날짜 계산
  const followUpDate = addMonths(baseDate, 1)

  // 기존 사후관리 세션이 있는지 확인
  const { data: existing } = await supabase
    .from('sessions')
    .select('*')
    .eq('coach_id', coachId)
    .eq('coachee_id', coacheeId)
    .eq('session_number', 0)  // 사후관리 세션은 0번
    .maybeSingle()

  if (existing) {
    // 이미 있으면 날짜만 업데이트
    const { data, error } = await supabase
      .from('sessions')
      .update({
        date: formatDate(followUpDate),
        status: 'scheduled'
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // 새 사후관리 세션 생성
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      coach_id: coachId,
      coachee_id: coacheeId,
      session_number: 0,  // 사후관리 세션
      date: formatDate(followUpDate),
      time: '14:00',
      topic: '사후관리 세션',
      status: 'scheduled'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 이번 주 세션 수 조회
export async function getWeekSessionsCount(coachId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { startDate, endDate } = getWeekRange()

  const { data, error } = await supabase
    .from('sessions')
    .select('id', { count: 'exact' })
    .eq('coach_id', coachId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error
  return data?.length || 0
}

// 오늘 세션 조회
export async function getTodaySessions(coachId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('coach_id', coachId)
    .eq('date', getToday())
    .order('time', { ascending: true })

  if (error) throw error

  // 피코치 이름 조회
  if (data && data.length > 0) {
    return await enrichWithUserDataAsync(data, supabase, 'coachee_id', 'coachee_name')
  }

  return data || []
}
