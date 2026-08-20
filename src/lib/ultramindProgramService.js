/**
 * Ultra Mind 프로그램 서비스
 * 프로그램 저장, 조회, 진행상황 업데이트
 */

import { supabase, isSupabaseConfigured } from './supabase'

/**
 * 활성화된 Ultra Mind 프로그램 조회
 */
export async function getActiveUltramindProgram(userId) {
  if (!userId) return null

  // 먼저 로컬 스토리지 확인
  const localProgram = localStorage.getItem(`ultramind_program_${userId}`)
  if (localProgram) {
    try {
      const parsed = JSON.parse(localProgram)
      if (parsed.status === 'active') {
        return parsed
      }
    } catch (e) {
      console.warn('[UltramindProgram] 로컬 데이터 파싱 실패')
    }
  }

  // Supabase가 설정되어 있으면 DB에서 조회
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('ultramind_programs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 테이블이 없거나 데이터가 없는 경우
    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.code === '42P01') {
        return null
      }
      console.error('[UltramindProgram] 조회 오류:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('[UltramindProgram] 조회 실패:', err)
    return null
  }
}

/**
 * Ultra Mind 프로그램 저장
 */
export async function saveUltramindProgram(userId, programData, prescriptions) {
  if (!isSupabaseConfigured() || !userId) return null

  try {
    // 기존 활성 프로그램이 있으면 완료 처리
    await supabase
      .from('ultramind_programs')
      .update({ status: 'completed' })
      .eq('user_id', userId)
      .eq('status', 'active')

    // 새 프로그램 생성
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 42) // 6주

    const { data, error } = await supabase
      .from('ultramind_programs')
      .insert({
        user_id: userId,
        program_data: programData,
        prescriptions,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        current_week: 1,
        weekly_progress: []
      })
      .select()
      .single()

    if (error) {
      console.error('[UltramindProgram] 저장 오류:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('[UltramindProgram] 저장 실패:', err)
    return null
  }
}

/**
 * 오늘의 일일 로그 조회
 */
export async function getTodayProgress(programId) {
  if (!programId) return null

  const today = new Date().toISOString().split('T')[0]

  // 로컬 프로그램인 경우
  if (String(programId).startsWith('local_')) {
    const localLog = localStorage.getItem(`ultramind_daily_${programId}_${today}`)
    if (localLog) {
      try {
        return JSON.parse(localLog)
      } catch (e) {
        return null
      }
    }
    return null
  }

  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('ultramind_daily_logs')
      .select('*')
      .eq('program_id', programId)
      .eq('log_date', today)
      .single()

    if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
      console.error('[UltramindProgram] 일일 로그 조회 오류:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('[UltramindProgram] 일일 로그 조회 실패:', err)
    return null
  }
}

/**
 * 일일 진행상황 업데이트
 */
export async function updateDailyProgress(programId, userId, completedTasks, moodScore, energyScore, notes) {
  if (!programId) return null

  const today = new Date().toISOString().split('T')[0]

  const logData = {
    program_id: programId,
    user_id: userId,
    log_date: today,
    completed_tasks: completedTasks,
    mood_score: moodScore,
    energy_score: energyScore,
    notes,
    updated_at: new Date().toISOString()
  }

  // 로컬 프로그램인 경우
  if (String(programId).startsWith('local_')) {
    localStorage.setItem(`ultramind_daily_${programId}_${today}`, JSON.stringify(logData))
    return logData
  }

  if (!isSupabaseConfigured()) {
    // DB 없으면 로컬 저장
    localStorage.setItem(`ultramind_daily_${programId}_${today}`, JSON.stringify(logData))
    return logData
  }

  try {
    const { data, error } = await supabase
      .from('ultramind_daily_logs')
      .upsert(logData, {
        onConflict: 'program_id,log_date'
      })
      .select()
      .single()

    if (error) {
      // 테이블 없으면 로컬 저장
      if (error.code === 'PGRST205' || error.code === '42P01') {
        localStorage.setItem(`ultramind_daily_${programId}_${today}`, JSON.stringify(logData))
        return logData
      }
      console.error('[UltramindProgram] 일일 로그 업데이트 오류:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('[UltramindProgram] 일일 로그 업데이트 실패:', err)
    return null
  }
}

/**
 * 현재 주차 계산
 */
export function calculateCurrentWeek(startDate) {
  if (!startDate) return 1

  const start = new Date(startDate)
  const now = new Date()
  const diffTime = now - start
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const week = Math.floor(diffDays / 7) + 1

  return Math.min(Math.max(week, 1), 6) // 1-6주 범위
}

/**
 * 오늘의 루틴 가져오기 (시간대별)
 */
export function getTodayRoutine(programData) {
  if (!programData?.detailedDailyRoutine) {
    return null
  }

  const now = new Date()
  const hour = now.getHours()

  // 현재 시간에 해당하는 루틴 찾기
  const routine = programData.detailedDailyRoutine
  const routineSlots = []

  // 모든 시간대 루틴 반환
  const slots = ['wakeUp', 'morning', 'midMorning', 'lunch', 'afternoon', 'preDinner', 'dinner', 'evening', 'bedtime']

  for (const slot of slots) {
    if (routine[slot]) {
      routineSlots.push({
        id: slot,
        ...routine[slot],
        isCurrentSlot: isCurrentTimeSlot(slot, hour)
      })
    }
  }

  return routineSlots
}

/**
 * 현재 시간대 체크
 */
function isCurrentTimeSlot(slot, hour) {
  const timeSlots = {
    wakeUp: [5, 7],
    morning: [7, 10],
    midMorning: [10, 12],
    lunch: [12, 14],
    afternoon: [14, 17],
    preDinner: [17, 18],
    dinner: [18, 20],
    evening: [20, 23],
    bedtime: [23, 24]
  }

  const [start, end] = timeSlots[slot] || [0, 24]
  return hour >= start && hour < end
}

/**
 * 이번 주 체크리스트 가져오기
 */
export function getWeeklyChecklist(programData) {
  if (!programData?.weeklyChecklist) {
    return null
  }

  return programData.weeklyChecklist
}

/**
 * 현재 주차 페이즈 가져오기
 */
export function getCurrentPhase(programData, currentWeek) {
  if (!programData?.phases) {
    return null
  }

  const phaseIndex = Math.min(Math.max(currentWeek - 1, 0), programData.phases.length - 1)
  return programData.phases[phaseIndex]
}

/**
 * 프로그램 진행률 계산
 */
export function calculateProgramProgress(startDate, endDate) {
  if (!startDate || !endDate) return 0

  const start = new Date(startDate)
  const end = new Date(endDate)
  const now = new Date()

  const totalDays = (end - start) / (1000 * 60 * 60 * 24)
  const elapsedDays = (now - start) / (1000 * 60 * 60 * 24)

  const progress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100)
  return Math.round(progress)
}

/**
 * 체크리스트 결과 저장
 */
export async function saveChecklistResults(userId, programId, results) {
  if (!isSupabaseConfigured() || !userId) return null

  try {
    const records = results.map(result => ({
      user_id: userId,
      program_id: programId,
      checklist_id: result.checklistId,
      checklist_name: result.checklistName,
      category: result.category,
      score: result.score,
      max_score: result.maxScore,
      percentage: result.percentage,
      answers: result.answers
    }))

    const { data, error } = await supabase
      .from('ultramind_checklist_results')
      .insert(records)
      .select()

    if (error) {
      console.error('[UltramindProgram] 체크리스트 결과 저장 오류:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('[UltramindProgram] 체크리스트 결과 저장 실패:', err)
    return null
  }
}

export default {
  getActiveUltramindProgram,
  saveUltramindProgram,
  getTodayProgress,
  updateDailyProgress,
  calculateCurrentWeek,
  getTodayRoutine,
  getWeeklyChecklist,
  getCurrentPhase,
  calculateProgramProgress,
  saveChecklistResults
}
