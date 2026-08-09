/**
 * 결과 보고서 서비스
 * 코칭 완료 후 피코치에게 제공되는 종합 보고서 데이터 생성
 */

import { supabase, isSupabaseConfigured } from './supabase'

/**
 * 피코치의 전체 코칭 데이터를 집계하여 보고서용 데이터 생성
 * @param {string} coacheeUserId - 피코치 user_id
 * @returns {object} 보고서 데이터
 */
export async function generateReportData(coacheeUserId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 병렬로 모든 데이터 조회
  const [
    profileRes,
    topicsRes,
    sessionsRes,
    reflectionsRes,
    tasksRes,
    asrsRes,
    preSurveyRes,
    postSurveyRes
  ] = await Promise.allSettled([
    // 피코치 프로필
    supabase
      .from('coachee_profiles')
      .select('*, coach:users!coachee_profiles_coach_id_fkey(name)')
      .eq('user_id', coacheeUserId)
      .maybeSingle(),
    // 코칭 주제
    supabase
      .from('coaching_topics')
      .select('*')
      .eq('user_id', coacheeUserId)
      .order('order_index', { ascending: true }),
    // 세션 기록
    supabase
      .from('sessions')
      .select('*')
      .eq('coachee_id', coacheeUserId)
      .order('session_number', { ascending: true }),
    // 성찰일지
    supabase
      .from('reflection_notes')
      .select('*')
      .eq('coachee_id', coacheeUserId)
      .order('session_number', { ascending: true }),
    // 과제
    supabase
      .from('tasks')
      .select('*')
      .eq('coachee_id', coacheeUserId)
      .order('created_at', { ascending: true }),
    // ASRS 결과
    supabase
      .from('asrs_results')
      .select('*')
      .eq('user_id', coacheeUserId)
      .order('created_at', { ascending: false }),
    // 사전 설문
    supabase
      .from('survey_results')
      .select('*')
      .eq('user_id', coacheeUserId)
      .eq('type', 'pre')
      .order('created_at', { ascending: false }),
    // 사후 설문
    supabase
      .from('survey_results')
      .select('*')
      .eq('user_id', coacheeUserId)
      .eq('type', 'post')
      .order('created_at', { ascending: false })
  ])

  // 데이터 추출
  const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : null
  const topics = topicsRes.status === 'fulfilled' ? (topicsRes.value.data || []) : []
  const sessions = sessionsRes.status === 'fulfilled' ? (sessionsRes.value.data || []) : []
  const reflections = reflectionsRes.status === 'fulfilled' ? (reflectionsRes.value.data || []) : []
  const tasks = tasksRes.status === 'fulfilled' ? (tasksRes.value.data || []) : []
  const asrsResults = asrsRes.status === 'fulfilled' ? (asrsRes.value.data || []) : []
  const preSurveys = preSurveyRes.status === 'fulfilled' ? (preSurveyRes.value.data || []) : []
  const postSurveys = postSurveyRes.status === 'fulfilled' ? (postSurveyRes.value.data || []) : []

  // 주제별 성장 계산
  const topicGrowth = topics.map(topic => ({
    id: topic.id,
    title: topic.title,
    description: topic.description,
    startScore: topic.start_score || 0,
    currentScore: topic.current_score || 0,
    targetScore: topic.target_score || 10,
    growth: (topic.current_score || 0) - (topic.start_score || 0),
    achievementRate: topic.target_score
      ? Math.round(((topic.current_score || 0) / topic.target_score) * 100)
      : 0
  }))

  // 전체 성장률 계산
  const totalStartScore = topics.reduce((sum, t) => sum + (t.start_score || 0), 0)
  const totalCurrentScore = topics.reduce((sum, t) => sum + (t.current_score || 0), 0)
  const totalTargetScore = topics.reduce((sum, t) => sum + (t.target_score || 10), 0)
  const overallGrowth = totalCurrentScore - totalStartScore
  const overallAchievementRate = totalTargetScore > 0
    ? Math.round((totalCurrentScore / totalTargetScore) * 100)
    : 0

  // 과제 완료율
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const taskCompletionRate = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0

  // 회기별 하이라이트 (세션 + 성찰일지 매칭)
  const sessionHighlights = sessions.map(session => {
    const reflection = reflections.find(r => r.session_number === session.session_number)
    return {
      sessionNumber: session.session_number,
      date: session.date,
      topic: session.topic,
      notes: session.notes,
      status: session.status,
      reflection: reflection ? {
        topic: reflection.topic,
        learned: reflection.learned,
        felt: reflection.felt,
        actionPlan: reflection.action_plan,
        previousScore: reflection.previous_score,
        currentScore: reflection.current_score
      } : null
    }
  })

  // ASRS 비교 (처음 vs 마지막)
  const asrsComparison = asrsResults.length > 0 ? {
    initial: asrsResults[asrsResults.length - 1],  // 가장 오래된 것
    final: asrsResults[0],  // 가장 최근
    hasImproved: asrsResults.length > 1
      ? asrsResults[0].total_score < asrsResults[asrsResults.length - 1].total_score
      : null
  } : null

  // 설문 비교 (사전 vs 사후)
  const surveyComparison = (preSurveys.length > 0 && postSurveys.length > 0) ? {
    pre: preSurveys[0],
    post: postSurveys[0],
    improvement: postSurveys[0].total_score - preSurveys[0].total_score
  } : null

  return {
    // 기본 정보
    coachee: {
      id: profile?.id,
      userId: coacheeUserId,
      packageType: profile?.package_type,
      totalSessions: profile?.total_sessions || 0,
      completedSessions: profile?.completed_sessions || 0,
      coachName: profile?.coach?.name || '담당 코치'
    },

    // 전체 요약
    summary: {
      totalTopics: topics.length,
      overallGrowth,
      overallAchievementRate,
      totalTasks: tasks.length,
      completedTasks,
      taskCompletionRate,
      totalReflections: reflections.length
    },

    // 주제별 성장
    topicGrowth,

    // 회기별 하이라이트
    sessionHighlights,

    // ASRS 비교
    asrsComparison,

    // 설문 비교
    surveyComparison,

    // 과제 목록
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      sessionNumber: t.session_number,
      dueDate: t.due_date
    })),

    // 성찰일지 요약
    reflections: reflections.map(r => ({
      sessionNumber: r.session_number,
      topic: r.topic,
      learned: r.learned,
      actionPlan: r.action_plan
    })),

    // 생성 시간
    generatedAt: new Date().toISOString()
  }
}
