/**
 * 코치 상담 가능 시간 슬롯 서비스
 */

import { supabase, isSupabaseConfigured } from './supabase'

// =============================================
// 코치용 함수
// =============================================

/**
 * 가용 시간 슬롯 추가
 * @param {string} coachId - 코치 ID
 * @param {Object} slotData - { date, startTime, endTime, duration }
 */
export async function addAvailableSlot(coachId, slotData) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase가 설정되지 않았습니다.')
  }

  const { date, startTime, endTime, duration = 60 } = slotData

  const { data, error } = await supabase
    .from('coach_available_slots')
    .insert({
      coach_id: coachId,
      date,
      start_time: startTime,
      end_time: endTime,
      duration
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('이미 같은 시간에 슬롯이 존재합니다.')
    }
    throw new Error(error.message)
  }

  return data
}

/**
 * 여러 슬롯 일괄 추가
 * @param {string} coachId - 코치 ID
 * @param {string} date - 날짜 (YYYY-MM-DD)
 * @param {Array} timeSlots - [{ startTime, endTime, duration }, ...]
 */
export async function addMultipleSlots(coachId, date, timeSlots) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase가 설정되지 않았습니다.')
  }

  const slotsToInsert = timeSlots.map(slot => ({
    coach_id: coachId,
    date,
    start_time: slot.startTime,
    end_time: slot.endTime,
    duration: slot.duration || 60
  }))

  const { data, error } = await supabase
    .from('coach_available_slots')
    .insert(slotsToInsert)
    .select()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * 슬롯 삭제 (예약 안 된 것만)
 * @param {string} slotId - 슬롯 ID
 * @param {string} coachId - 코치 ID
 */
export async function deleteSlot(slotId, coachId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase가 설정되지 않았습니다.')
  }

  const { error } = await supabase
    .from('coach_available_slots')
    .delete()
    .eq('id', slotId)
    .eq('coach_id', coachId)
    .eq('is_booked', false)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

/**
 * 코치의 특정 날짜 가용 슬롯 조회
 * @param {string} coachId - 코치 ID
 * @param {string} date - 날짜 (YYYY-MM-DD)
 */
export async function getCoachSlotsByDate(coachId, date) {
  if (!isSupabaseConfigured()) {
    return []
  }

  const { data, error } = await supabase
    .from('coach_available_slots')
    .select(`
      *,
      booked_user:booked_by(id, name, email)
    `)
    .eq('coach_id', coachId)
    .eq('date', date)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('슬롯 조회 오류:', error)
    return []
  }

  return data || []
}

/**
 * 코치의 월별 가용 슬롯 조회
 * @param {string} coachId - 코치 ID
 * @param {number} year - 연도
 * @param {number} month - 월 (1-12)
 */
export async function getCoachSlotsByMonth(coachId, year, month) {
  if (!isSupabaseConfigured()) {
    return []
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('coach_available_slots')
    .select('*')
    .eq('coach_id', coachId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('월별 슬롯 조회 오류:', error)
    return []
  }

  return data || []
}

/**
 * 코치의 날짜별 슬롯 개수 조회 (캘린더 표시용)
 * @param {string} coachId - 코치 ID
 * @param {number} year - 연도
 * @param {number} month - 월 (1-12)
 */
export async function getSlotCountsByMonth(coachId, year, month) {
  const slots = await getCoachSlotsByMonth(coachId, year, month)

  // 날짜별로 그룹화
  const counts = {}
  slots.forEach(slot => {
    if (!counts[slot.date]) {
      counts[slot.date] = { total: 0, available: 0, booked: 0 }
    }
    counts[slot.date].total++
    if (slot.is_booked) {
      counts[slot.date].booked++
    } else {
      counts[slot.date].available++
    }
  })

  return counts
}

// =============================================
// 피코치용 함수
// =============================================

/**
 * 코치의 예약 가능한 슬롯 조회 (is_booked = false만)
 * @param {string} coachId - 코치 ID
 * @param {string} startDate - 시작 날짜
 * @param {string} endDate - 종료 날짜
 */
export async function getAvailableSlots(coachId, startDate, endDate) {
  if (!isSupabaseConfigured()) {
    return []
  }

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('coach_available_slots')
    .select('*')
    .eq('coach_id', coachId)
    .eq('is_booked', false)
    .gte('date', startDate || today)
    .lte('date', endDate || '2099-12-31')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('가용 슬롯 조회 오류:', error)
    return []
  }

  return data || []
}

/**
 * 코치의 예약 가능한 날짜 목록 조회
 * @param {string} coachId - 코치 ID
 * @param {number} year - 연도
 * @param {number} month - 월 (1-12)
 */
export async function getAvailableDates(coachId, year, month) {
  if (!isSupabaseConfigured()) {
    return []
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('coach_available_slots')
    .select('date')
    .eq('coach_id', coachId)
    .eq('is_booked', false)
    .gte('date', today > startDate ? today : startDate)
    .lte('date', endDate)

  if (error) {
    console.error('가용 날짜 조회 오류:', error)
    return []
  }

  // 중복 제거
  const uniqueDates = [...new Set((data || []).map(d => d.date))]
  return uniqueDates
}

/**
 * 특정 날짜의 예약 가능한 슬롯 조회
 * @param {string} coachId - 코치 ID
 * @param {string} date - 날짜
 */
export async function getAvailableSlotsByDate(coachId, date) {
  if (!isSupabaseConfigured()) {
    return []
  }

  const { data, error } = await supabase
    .from('coach_available_slots')
    .select('*')
    .eq('coach_id', coachId)
    .eq('date', date)
    .eq('is_booked', false)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('가용 슬롯 조회 오류:', error)
    return []
  }

  return data || []
}

/**
 * 슬롯 예약 (트랜잭션 처리)
 * @param {string} slotId - 슬롯 ID
 * @param {string} coacheeId - 피코치 ID
 * @param {Object} sessionData - { sessionNumber, topic, type }
 */
export async function bookSlot(slotId, coacheeId, sessionData) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase가 설정되지 않았습니다.')
  }

  // 1. 슬롯 조회 및 가용 여부 확인
  const { data: slot, error: slotError } = await supabase
    .from('coach_available_slots')
    .select('*')
    .eq('id', slotId)
    .eq('is_booked', false)
    .single()

  if (slotError || !slot) {
    throw new Error('해당 슬롯은 이미 예약되었거나 존재하지 않습니다.')
  }

  // 2. 세션 생성
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      coach_id: slot.coach_id,
      coachee_id: coacheeId,
      session_number: sessionData.sessionNumber || 1,
      date: slot.date,
      time: slot.start_time,
      duration: slot.duration,
      type: sessionData.type || 'message',
      topic: sessionData.topic || '',
      status: 'scheduled'
    })
    .select()
    .single()

  if (sessionError) {
    throw new Error('세션 생성에 실패했습니다: ' + sessionError.message)
  }

  // 3. 슬롯 업데이트 (낙관적 락)
  const { data: updatedSlot, error: updateError } = await supabase
    .from('coach_available_slots')
    .update({
      is_booked: true,
      booked_by: coacheeId,
      session_id: session.id
    })
    .eq('id', slotId)
    .eq('is_booked', false) // 다시 확인 (동시 예약 방지)
    .select()
    .single()

  if (updateError || !updatedSlot) {
    // 슬롯 업데이트 실패 시 세션 삭제 (롤백)
    await supabase.from('sessions').delete().eq('id', session.id)
    throw new Error('슬롯 예약에 실패했습니다. 다른 사용자가 먼저 예약했을 수 있습니다.')
  }

  return {
    slot: updatedSlot,
    session
  }
}

/**
 * 예약 취소
 * @param {string} slotId - 슬롯 ID
 * @param {string} userId - 요청 사용자 ID (코치 또는 피코치)
 */
export async function cancelBooking(slotId, userId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase가 설정되지 않았습니다.')
  }

  // 슬롯 조회
  const { data: slot, error: slotError } = await supabase
    .from('coach_available_slots')
    .select('*')
    .eq('id', slotId)
    .single()

  if (slotError || !slot) {
    throw new Error('슬롯을 찾을 수 없습니다.')
  }

  // 권한 확인 (코치 또는 예약한 피코치만)
  if (slot.coach_id !== userId && slot.booked_by !== userId) {
    throw new Error('취소 권한이 없습니다.')
  }

  // 세션 삭제 (있는 경우)
  if (slot.session_id) {
    await supabase.from('sessions').delete().eq('id', slot.session_id)
  }

  // 슬롯 초기화
  const { error: updateError } = await supabase
    .from('coach_available_slots')
    .update({
      is_booked: false,
      booked_by: null,
      session_id: null
    })
    .eq('id', slotId)

  if (updateError) {
    throw new Error('예약 취소에 실패했습니다.')
  }

  return true
}
