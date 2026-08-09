/**
 * 성찰일지 관련 서비스
 * Supabase 연동
 */

import { supabase, isSupabaseConfigured } from './supabase'

// 성찰일지 생성
export async function createReflection(coacheeId, sessionNumber, reflectionData) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('reflection_notes')
    .insert({
      coachee_id: coacheeId,
      title: reflectionData.topic || `${sessionNumber}회기 성찰일지`,
      content: JSON.stringify({
        topic: reflectionData.topic,
        previousScore: reflectionData.previousScore,
        currentScore: reflectionData.currentScore,
        learned: reflectionData.learned,
        felt: reflectionData.felt,
        actionPlan: reflectionData.actionPlan,
        nextExpectation: reflectionData.nextExpectation,
        sessionNumber: sessionNumber
      }),
      mood: reflectionData.mood || 'neutral',
      tags: reflectionData.tags || [],
      is_shared: false
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 피코치의 성찰일지 목록 조회
export async function getCoacheeReflections(coacheeId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('reflection_notes')
    .select('*')
    .eq('coachee_id', coacheeId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // content JSON 파싱하여 반환
  return (data || []).map(item => {
    let parsedContent = {}
    try {
      parsedContent = JSON.parse(item.content || '{}')
    } catch (e) {
      parsedContent = { learned: item.content }
    }

    return {
      id: item.id,
      sessionNumber: parsedContent.sessionNumber || null,
      topic: parsedContent.topic || item.title,
      previousScore: parsedContent.previousScore || 0,
      currentScore: parsedContent.currentScore || 0,
      learned: parsedContent.learned || '',
      felt: parsedContent.felt || '',
      actionPlan: parsedContent.actionPlan || '',
      nextExpectation: parsedContent.nextExpectation || '',
      mood: item.mood,
      tags: item.tags || [],
      isShared: item.is_shared,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }
  })
}

// 성찰일지 상세 조회
export async function getReflection(reflectionId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('reflection_notes')
    .select('*')
    .eq('id', reflectionId)
    .single()

  if (error) throw error

  let parsedContent = {}
  try {
    parsedContent = JSON.parse(data.content || '{}')
  } catch (e) {
    parsedContent = { learned: data.content }
  }

  return {
    id: data.id,
    sessionNumber: parsedContent.sessionNumber || null,
    topic: parsedContent.topic || data.title,
    previousScore: parsedContent.previousScore || 0,
    currentScore: parsedContent.currentScore || 0,
    learned: parsedContent.learned || '',
    felt: parsedContent.felt || '',
    actionPlan: parsedContent.actionPlan || '',
    nextExpectation: parsedContent.nextExpectation || '',
    mood: data.mood,
    tags: data.tags || [],
    isShared: data.is_shared,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

// 성찰일지 수정
export async function updateReflection(reflectionId, reflectionData) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const updateData = {
    title: reflectionData.topic || '성찰일지',
    content: JSON.stringify({
      topic: reflectionData.topic,
      previousScore: reflectionData.previousScore,
      currentScore: reflectionData.currentScore,
      learned: reflectionData.learned,
      felt: reflectionData.felt,
      actionPlan: reflectionData.actionPlan,
      nextExpectation: reflectionData.nextExpectation,
      sessionNumber: reflectionData.sessionNumber
    }),
    mood: reflectionData.mood || 'neutral',
    tags: reflectionData.tags || [],
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('reflection_notes')
    .update(updateData)
    .eq('id', reflectionId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 성찰일지 삭제
export async function deleteReflection(reflectionId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { error } = await supabase
    .from('reflection_notes')
    .delete()
    .eq('id', reflectionId)

  if (error) throw error
  return true
}

// 코치 공유 토글
export async function toggleReflectionShare(reflectionId, isShared) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('reflection_notes')
    .update({ is_shared: isShared, updated_at: new Date().toISOString() })
    .eq('id', reflectionId)
    .select()
    .single()

  if (error) throw error
  return data
}
