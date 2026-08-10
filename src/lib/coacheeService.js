/**
 * 피코치 관련 서비스
 * Supabase 연동
 */

import { supabase, isSupabaseConfigured } from './supabase'

// ===== 피코치 프로필 =====

// 피코치 프로필 생성/업데이트 (온보딩 완료 시) - upsert 사용
export async function createCoacheeProfile(userId, profileData) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const packageSessions = {
    starter: 3,
    basic: 5,
    premium: 10
  }

  const { data, error } = await supabase
    .from('coachee_profiles')
    .upsert({
      user_id: userId,
      package_type: profileData.packageType,
      total_sessions: packageSessions[profileData.packageType] || 5,
      intro: profileData.intro || null,
      expectation: profileData.expectation || null,
      concern: profileData.concern || null,
      communication_styles: profileData.communicationStyles || [],
      preferred_times: profileData.preferredTimes || [],
      status: 'pending'
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 피코치 프로필 조회
export async function getCoacheeProfile(userId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('coachee_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

// 피코치 프로필 업데이트
export async function updateCoacheeProfile(userId, updates) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 먼저 업데이트 시도
  const { data, error } = await supabase
    .from('coachee_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()

  if (error) throw error

  // 업데이트된 행이 없으면 (프로필이 없으면) 생성
  if (!data || data.length === 0) {
    return await createCoacheeProfile(userId, {
      packageType: updates.package_type,
      intro: null,
      expectation: null,
      concern: null,
      communicationStyles: [],
      preferredTimes: []
    })
  }

  return data[0]
}

// ===== 코치용 조회 =====

// 코치의 담당 피코치 목록 조회 (직접 테이블 조인)
export async function getCoachCoachees(coachId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 1. coachee_profiles 조회 (담당 피코치)
  const { data: profiles, error: profileError } = await supabase
    .from('coachee_profiles')
    .select('*')
    .eq('coach_id', coachId)
    .order('matched_at', { ascending: false })

  if (profileError) throw profileError
  if (!profiles || profiles.length === 0) return []

  // 2. 사용자 정보 조회
  const userIds = profiles.map(p => p.user_id)
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, phone, adhd_status')
    .in('id', userIds)

  const usersMap = (users || []).reduce((acc, u) => {
    acc[u.id] = u
    return acc
  }, {})

  // 3. coaching_status 조회
  const { data: statuses } = await supabase
    .from('coaching_status')
    .select('coachee_id, declaration_completed, goal_agreement_completed, next_session_prepared')
    .in('coachee_id', userIds)

  const statusMap = (statuses || []).reduce((acc, s) => {
    acc[s.coachee_id] = s
    return acc
  }, {})

  // 4. coaching_goals 조회
  const { data: goals } = await supabase
    .from('coaching_goals')
    .select('user_id, current_score, target_score, title')
    .in('user_id', userIds)
    .eq('is_active', true)

  const goalMap = (goals || []).reduce((acc, g) => {
    acc[g.user_id] = g
    return acc
  }, {})

  // 5. 결과 조합
  return profiles.map(cp => ({
    ...cp,
    name: usersMap[cp.user_id]?.name || '이름 없음',
    email: usersMap[cp.user_id]?.email,
    phone: usersMap[cp.user_id]?.phone,
    adhd_status: usersMap[cp.user_id]?.adhd_status,
    declaration_completed: statusMap[cp.user_id]?.declaration_completed || false,
    goal_agreement_completed: statusMap[cp.user_id]?.goal_agreement_completed || false,
    next_session_prepared: statusMap[cp.user_id]?.next_session_prepared || false,
    recent_score: goalMap[cp.user_id]?.current_score,
    target_score: goalMap[cp.user_id]?.target_score,
    goal_title: goalMap[cp.user_id]?.title
  }))
}

// 매칭 대기 중인 신청자 목록 조회
export async function getPendingApplicants() {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 코치가 없고 패키지가 선택된 피코치 (온보딩 완료)
  const { data: profiles, error: profileError } = await supabase
    .from('coachee_profiles')
    .select('id, user_id, package_type, total_sessions, status, created_at')
    .is('coach_id', null)
    .not('package_type', 'is', null)
    .order('created_at', { ascending: false })

  if (profileError) throw profileError
  if (!profiles || profiles.length === 0) return []

  // 사용자 정보 조회
  const userIds = profiles.map(p => p.user_id)
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', userIds)

  const usersMap = (users || []).reduce((acc, u) => {
    acc[u.id] = u
    return acc
  }, {})

  return profiles.map(p => ({
    ...p,
    name: usersMap[p.user_id]?.name || '이름 없음',
    email: usersMap[p.user_id]?.email
  }))
}

// 담당 피코치 + 신청자 모두 조회
export async function getAllCoacheesForCoach(coachId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const [matched, pending] = await Promise.all([
    getCoachCoachees(coachId).catch(() => []),
    getPendingApplicants().catch(() => [])
  ])

  return { matched, pending }
}

// ===== 매칭 =====

// 코치-피코치 매칭
export async function matchCoachee(coacheeProfileId, coachId, packageType) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const packageSessions = {
    starter: 3,
    basic: 5,
    premium: 10
  }

  const { data, error } = await supabase
    .from('coachee_profiles')
    .update({
      coach_id: coachId,
      package_type: packageType,
      total_sessions: packageSessions[packageType] || 5,
      matched_at: new Date().toISOString(),
      status: 'active'
    })
    .eq('id', coacheeProfileId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 피코치 상세 정보 조회 (자기소개, ASRS, 설문 등 포함)
export async function getCoacheeDetail(coacheeProfileId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  // 디버깅: 현재 세션 확인
  const { data: { session } } = await supabase.auth.getSession()
  console.log('=== getCoacheeDetail 디버깅 ===')
  console.log('현재 세션:', session)
  console.log('현재 유저 ID:', session?.user?.id)
  console.log('조회할 프로필 ID:', coacheeProfileId)

  // coachee_profiles에서 직접 조회 (id 또는 user_id로 조회)
  // 먼저 id로 시도
  let { data: profileData, error: profileError } = await supabase
    .from('coachee_profiles')
    .select('*')
    .eq('id', coacheeProfileId)
    .maybeSingle()

  // id로 못 찾으면 user_id로 시도
  if (!profileData && !profileError) {
    const result = await supabase
      .from('coachee_profiles')
      .select('*')
      .eq('user_id', coacheeProfileId)
      .maybeSingle()
    profileData = result.data
    profileError = result.error
  }

  console.log('조회 결과:', { profileData, profileError })

  if (profileError) {
    console.error('coachee_profiles 조회 에러:', profileError)
    throw profileError
  }

  if (!profileData) {
    throw new Error('피코치 프로필을 찾을 수 없거나 접근 권한이 없습니다.')
  }

  // 사용자 정보 조회
  const { data: userData } = await supabase
    .from('users')
    .select('name, email, phone, adhd_status')
    .eq('id', profileData.user_id)
    .maybeSingle()

  // coaching_status 조회
  const { data: statusData } = await supabase
    .from('coaching_status')
    .select('declaration_completed, goal_agreement_completed, next_session_prepared')
    .eq('coachee_id', profileData.user_id)
    .maybeSingle()

  // coaching_goals 조회 (active만)
  const { data: goalData } = await supabase
    .from('coaching_goals')
    .select('current_score, target_score, title')
    .eq('user_id', profileData.user_id)
    .eq('is_active', true)
    .maybeSingle()

  const profile = {
    ...profileData,
    name: userData?.name || '이름 없음',
    email: userData?.email,
    phone: userData?.phone,
    adhd_status: userData?.adhd_status,
    declaration_completed: statusData?.declaration_completed || false,
    goal_agreement_completed: statusData?.goal_agreement_completed || false,
    next_session_prepared: statusData?.next_session_prepared || false,
    recent_score: goalData?.current_score,
    target_score: goalData?.target_score,
    goal_title: goalData?.title
  }

  if (!profile) throw new Error('피코치를 찾을 수 없습니다.')

  const userId = profile.user_id

  // 추가 데이터 병렬 조회
  const [selfIntroRes, asrsRes, preSurveyRes, goalRes, tasksRes, sessionsRes, topicsRes] = await Promise.allSettled([
    // 자기소개
    supabase
      .from('self_introductions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
    // ASRS 결과 (limit 제거, order 후 첫번째 결과만 사용)
    supabase
      .from('asrs_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    // 사전 설문 (limit 제거)
    supabase
      .from('survey_results')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'pre')
      .order('created_at', { ascending: false }),
    // 코칭 목표
    supabase
      .from('coaching_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
    // 과제
    supabase
      .from('tasks')
      .select('*')
      .eq('coachee_id', userId)
      .order('created_at', { ascending: false }),
    // 세션 기록
    supabase
      .from('sessions')
      .select('*')
      .eq('coachee_id', userId)
      .order('date', { ascending: false }),
    // 코칭 주제
    supabase
      .from('coaching_topics')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true })
  ])

  // 디버깅용 로그
  console.log('=== getCoacheeDetail 조회 결과 ===')
  console.log('userId:', userId)
  console.log('selfIntroRes:', selfIntroRes)
  console.log('asrsRes 전체:', asrsRes)
  console.log('asrsRes.value.data:', asrsRes.status === 'fulfilled' ? asrsRes.value.data : 'failed')
  console.log('preSurveyRes 전체:', preSurveyRes)
  console.log('preSurveyRes.value.data:', preSurveyRes.status === 'fulfilled' ? preSurveyRes.value.data : 'failed')
  console.log('goalRes:', goalRes)

  // self_introductions 데이터 또는 coachee_profiles의 데이터를 fallback으로 사용
  const selfIntroFromDb = selfIntroRes.status === 'fulfilled' && selfIntroRes.value.data
  const selfIntroData = selfIntroFromDb
    ? {
        intro: selfIntroFromDb.intro,
        expectation: selfIntroFromDb.expectation,
        concern: selfIntroFromDb.concern,
        communicationStyles: selfIntroFromDb.communication_styles,
        preferredTimes: selfIntroFromDb.preferred_times
      }
    : {
        // coachee_profiles 테이블의 데이터를 fallback으로 사용
        intro: profile.intro,
        expectation: profile.expectation,
        concern: profile.concern,
        communicationStyles: profile.communication_styles,
        preferredTimes: profile.preferred_times
      }

  // ASRS 결과 데이터 정규화 (배열에서 첫번째 항목 사용)
  const asrsRaw = asrsRes.status === 'fulfilled' && asrsRes.value.data && asrsRes.value.data[0]
  const asrsData = asrsRaw
    ? {
        totalScore: asrsRaw.total_score,
        maxScore: asrsRaw.max_score,
        inattentionScore: asrsRaw.inattention_score,
        hyperactivityScore: asrsRaw.hyperactivity_score,
        impulsivityScore: asrsRaw.impulsivity_score,
        level: asrsRaw.level,
        interpretation: asrsRaw.interpretation
      }
    : null

  // 사전설문 결과 데이터 정규화 (배열에서 첫번째 항목 사용)
  const preSurveyRaw = preSurveyRes.status === 'fulfilled' && preSurveyRes.value.data && preSurveyRes.value.data[0]
  const preSurveyData = preSurveyRaw
    ? {
        answers: preSurveyRaw.answers,
        categoryScores: preSurveyRaw.category_scores,
        totalScore: preSurveyRaw.total_score
      }
    : null

  console.log('asrsRaw:', asrsRaw)
  console.log('preSurveyRaw:', preSurveyRaw)

  // 코칭 목표 데이터 정규화 (goalRes에서 추가 필드 추출)
  const goalDataExtra = goalRes.status === 'fulfilled' && goalRes.value.data
    ? {
        title: goalRes.value.data.title,
        description: goalRes.value.data.description,
        currentScore: goalRes.value.data.current_score,
        targetScore: goalRes.value.data.target_score,
        currentAction: goalRes.value.data.current_action
      }
    : null

  // 결과 조합
  return {
    ...profile,
    self_intro: selfIntroData,
    asrs_result: asrsData,
    pre_survey: preSurveyData,
    coaching_goal: goalDataExtra,
    tasks: tasksRes.status === 'fulfilled' ? (tasksRes.value.data || []).map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      dueDate: t.due_date,
      status: t.status,
      priority: t.priority,
      sessionNumber: t.session_number
    })) : [],
    session_history: sessionsRes.status === 'fulfilled'
      ? (sessionsRes.value.data || []).map(s => ({
          session: s.session_number,
          date: s.date,
          topic: s.topic,
          note: s.notes || '',
          status: s.status
        }))
      : [],
    topics: topicsRes.status === 'fulfilled'
      ? (topicsRes.value.data || []).map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          start_score: t.start_score,
          current_score: t.current_score,
          target_score: t.target_score,
          order_index: t.order_index
        }))
      : []
  }
}

// ===== 피코치 대시보드용 =====

// 피코치 패키지 정보 조회
export async function getCoacheePackage(userId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('coachee_profiles')
    .select('package_type, total_sessions, completed_sessions, current_session')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

// 피코치 코칭 주제 목록 조회
export async function getCoachingTopics(userId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('coaching_topics')
    .select('id, title, description, start_score, current_score, target_score')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

// 피코치 코칭 목표 조회
export async function getCoachingGoal(userId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('coaching_goals')
    .select('title, current_score, target_score, current_action')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data
}

// 피코치 프로필 업데이트 (ID 기준)
export async function updateCoacheeById(profileId, updates) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('coachee_profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ===== 코칭 주제 점수 관리 =====

// 피코치의 코칭 주제 목록 조회 (코치용)
export async function getCoacheeTopicsForCoach(coacheeUserId) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('coaching_topics')
    .select('*')
    .eq('user_id', coacheeUserId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return (data || []).map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    startScore: t.start_score,
    currentScore: t.current_score,
    targetScore: t.target_score,
    orderIndex: t.order_index
  }))
}

// 코칭 주제 점수 업데이트
export async function updateTopicScore(topicId, currentScore) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const { data, error } = await supabase
    .from('coaching_topics')
    .update({
      current_score: currentScore,
      updated_at: new Date().toISOString()
    })
    .eq('id', topicId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 여러 코칭 주제 점수 일괄 업데이트
export async function updateMultipleTopicScores(topicScores) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  const results = []
  for (const { topicId, currentScore } of topicScores) {
    const result = await updateTopicScore(topicId, currentScore)
    results.push(result)
  }
  return results
}

// 주제 이름으로 코칭 주제 점수 업데이트 (성찰일지 연동용)
export async function updateTopicScoreByTitle(userId, topicTitle, currentScore) {
  if (!isSupabaseConfigured()) return null

  // 주제 이름으로 검색 (대소문자 무시, 공백 trim)
  const { data: topics, error: findError } = await supabase
    .from('coaching_topics')
    .select('id, title, current_score')
    .eq('user_id', userId)

  if (findError || !topics || topics.length === 0) {
    console.log('코칭 주제를 찾을 수 없음:', topicTitle)
    return null
  }

  // 주제 이름 매칭 (정확히 일치하거나 포함하는 경우)
  const normalizedTitle = topicTitle.trim().toLowerCase()
  const matchedTopic = topics.find(t =>
    t.title.trim().toLowerCase() === normalizedTitle ||
    t.title.trim().toLowerCase().includes(normalizedTitle) ||
    normalizedTitle.includes(t.title.trim().toLowerCase())
  )

  if (!matchedTopic) {
    console.log('매칭되는 코칭 주제 없음:', topicTitle, '/ 기존 주제:', topics.map(t => t.title))
    return null
  }

  // 점수 업데이트
  const { data, error } = await supabase
    .from('coaching_topics')
    .update({
      current_score: currentScore,
      updated_at: new Date().toISOString()
    })
    .eq('id', matchedTopic.id)
    .select()
    .single()

  if (error) {
    console.error('주제 점수 업데이트 실패:', error)
    return null
  }

  console.log(`코칭 주제 점수 업데이트 완료: ${matchedTopic.title} (${matchedTopic.current_score} → ${currentScore})`)
  return data
}

// 목표 합의서에서 코칭 주제 저장 (기존 주제 삭제 후 새로 저장)
export async function saveCoachingTopicsFromGoal(userId, goals) {
  if (!isSupabaseConfigured()) throw new Error('LOCAL_MODE')

  console.log('=== saveCoachingTopicsFromGoal 시작 ===')
  console.log('userId:', userId)
  console.log('goals:', goals)

  // 기존 주제 삭제
  const { error: deleteError } = await supabase
    .from('coaching_topics')
    .delete()
    .eq('user_id', userId)

  if (deleteError) {
    console.error('기존 코칭 주제 삭제 실패:', deleteError)
    // 삭제 실패해도 계속 진행 (기존 데이터가 없을 수 있음)
  }

  // 새 주제 저장
  const topicsToInsert = goals.map((goal, index) => ({
    user_id: userId,
    title: goal.topic,
    description: goal.desiredResult || '',
    start_score: goal.currentScore || 0,
    current_score: goal.currentScore || 0,
    target_score: goal.targetScore || 10,
    order_index: index
  }))

  console.log('topicsToInsert:', topicsToInsert)

  const { data, error } = await supabase
    .from('coaching_topics')
    .insert(topicsToInsert)
    .select()

  if (error) {
    console.error('코칭 주제 저장 실패:', error)
    throw error
  }

  console.log('코칭 주제 저장 성공:', data)
  return data
}
