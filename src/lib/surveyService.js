/**
 * 설문 및 ASRS 관련 서비스
 * Supabase 연동
 */

import { supabase, isSupabaseConfigured } from './supabase'

// ========== ASRS 자가진단 ==========

// ASRS 결과 저장
export async function saveASRSResult(userId, result) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('asrs_results')
    .insert({
      user_id: userId,
      total_score: result.totalScore || 0,
      max_score: result.maxScore || 72,
      inattention_score: result.inattentionScore || 0,
      hyperactivity_score: result.hyperactivityScore || 0,
      impulsivity_score: result.impulsivityScore || 0,
      level: result.level || 'low',
      interpretation: result.interpretation || '',
      answers: result.answers || {}
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ASRS 결과 조회
export async function getASRSResult(userId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('asrs_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

// ========== 설문 ==========

// 설문 결과 저장
export async function saveSurveyResult(userId, type, result) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // total_score는 정수로 반올림 (DB 컬럼이 INT)
  // categoryScores에 소수점 데이터가 있으므로 그건 JSONB로 저장됨
  const totalScore = result.totalScore ? Math.round(result.totalScore) : 0

  const insertData = {
    user_id: userId,
    type,
    answers: result.answers,
    category_scores: result.categoryScores,
    total_score: totalScore
  }

  // 사후설문 추가 필드
  if (type === 'post' && result.extraAnswers) {
    insertData.coaching_helpful = result.extraAnswers.p1
    insertData.coach_trust = result.extraAnswers.p2
    insertData.will_pay_again = result.extraAnswers.p3
    insertData.will_recommend = result.extraAnswers.p4
  }

  const { data, error } = await supabase
    .from('survey_results')
    .insert(insertData)
    .select()
    .single()

  if (error) throw error
  return data
}

// 설문 결과 조회
export async function getSurveyResult(userId, type) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('survey_results')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

// 사전/사후 설문 비교
export async function compareSurveys(userId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('survey_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error

  const pre = data.find(s => s.type === 'pre')
  const post = data.find(s => s.type === 'post')

  return { pre, post }
}

// ========== 자기소개 ==========

// 자기소개 저장
export async function saveSelfIntro(userId, intro) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('self_introductions')
    .upsert({
      user_id: userId,
      intro: intro.intro,
      expectation: intro.expectation,
      concern: intro.concern || null,
      communication_styles: intro.communicationStyles || [],
      preferred_times: intro.preferredTimes || []
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 자기소개 조회
export async function getSelfIntro(userId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('self_introductions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

// ========== 코칭 상태 ==========

// 코칭 상태 조회
export async function getCoachingStatus(coacheeId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('coaching_status')
    .select('*')
    .eq('coachee_id', coacheeId)
    .maybeSingle()

  if (error) throw error
  return data
}

// 코칭 상태 업데이트
export async function updateCoachingStatus(coacheeId, updates) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('coaching_status')
    .update(updates)
    .eq('coachee_id', coacheeId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 선언서 완료 처리
export async function completeDeclaration(coacheeId) {
  return updateCoachingStatus(coacheeId, { declaration_completed: true })
}

// 목표합의서 완료 처리
export async function completeGoalAgreement(coacheeId) {
  return updateCoachingStatus(coacheeId, { goal_agreement_completed: true })
}
