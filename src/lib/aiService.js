/**
 * AI 분석 서비스
 * OpenAI GPT-4 API를 사용하여 코칭 대화 분석
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// 코칭 분석을 위한 시스템 프롬프트
const COACHING_ANALYSIS_PROMPT = `당신은 ADHD 코칭 전문가 어시스턴트입니다.
코치가 피코치(클라이언트)와 나눈 대화를 분석하여 인사이트를 제공합니다.

다음 형식으로 JSON 응답을 제공하세요:
{
  "summary": "대화의 핵심 내용 요약 (3-5문장)",
  "emotions": {
    "primary": "주요 감정 (예: 불안, 희망, 좌절 등)",
    "secondary": "부차적 감정",
    "trend": "감정 변화 추세 (improving/stable/declining)",
    "note": "감정에 대한 간단한 설명"
  },
  "patterns": {
    "concerns": ["반복되는 고민 1", "반복되는 고민 2"],
    "avoidance": ["회피 패턴 1"],
    "strengths": ["강점 1", "강점 2"]
  },
  "suggestions": {
    "questions": ["다음 세션에서 물어볼 질문 1", "질문 2"],
    "topics": ["다룰 주제 1", "주제 2"],
    "cautions": ["주의할 점"]
  }
}

분석 시 고려사항:
- ADHD 특성을 고려한 분석
- 피코치의 성장과 긍정적 변화에 주목
- 구체적이고 실행 가능한 코칭 제안
- 한국어로 응답`

/**
 * 대화 내용과 피코치 정보를 분석 요청 형식으로 구성
 */
function buildAnalysisRequest(messages, coacheeInfo) {
  // 최근 메시지만 분석 (토큰 제한 고려)
  const recentMessages = messages.slice(-30)

  const conversationText = recentMessages.map(msg => {
    const role = msg.sender_role === 'coach' ? '코치' : '피코치'
    const content = msg.content || ''
    return `[${role}]: ${content}`
  }).join('\n')

  const coacheeContext = coacheeInfo ? `
## 피코치 정보
- 이름: ${coacheeInfo.name || '미상'}
- 패키지: ${coacheeInfo.packageType || '미상'}
- 현재 회기: ${coacheeInfo.currentSession || 0}/${coacheeInfo.totalSessions || 0}
- 코칭 주제: ${coacheeInfo.topics?.join(', ') || '미설정'}
` : ''

  return `${coacheeContext}

## 대화 내용
${conversationText}

위 대화를 분석하여 코치에게 도움이 될 인사이트를 제공해주세요.`
}

/**
 * API 응답 파싱
 */
function parseAnalysisResponse(data) {
  try {
    const content = data.choices[0]?.message?.content || ''

    // JSON 블록 추출 (마크다운 코드 블록 처리)
    let jsonStr = content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    return JSON.parse(jsonStr.trim())
  } catch (err) {
    console.error('AI 응답 파싱 실패:', err)
    // 파싱 실패 시 기본 구조 반환
    return {
      summary: '분석 결과를 파싱하는 데 문제가 발생했습니다.',
      emotions: {
        primary: '분석 불가',
        secondary: '',
        trend: 'stable',
        note: ''
      },
      patterns: {
        concerns: [],
        avoidance: [],
        strengths: []
      },
      suggestions: {
        questions: [],
        topics: [],
        cautions: []
      }
    }
  }
}

/**
 * 대화 분석 실행
 * @param {Array} messages - 메시지 배열
 * @param {Object} coacheeInfo - 피코치 정보
 * @returns {Promise<Object>} 분석 결과
 */
export async function analyzeConversation(messages, coacheeInfo) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다. .env.local 파일에 VITE_OPENAI_API_KEY를 설정해주세요.')
  }

  if (!messages || messages.length === 0) {
    throw new Error('분석할 대화 내용이 없습니다.')
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: COACHING_ANALYSIS_PROMPT },
        { role: 'user', content: buildAnalysisRequest(messages, coacheeInfo) }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `API 요청 실패: ${response.status}`)
  }

  const data = await response.json()
  return parseAnalysisResponse(data)
}

/**
 * API 키 유효성 확인
 */
export function isAIConfigured() {
  return !!import.meta.env.VITE_OPENAI_API_KEY
}

// ============================================
// 피코치용 AI 기능
// ============================================

/**
 * AI 체크인 대화
 * @param {string} userMessage - 사용자 메시지
 * @param {Array} history - 대화 히스토리
 * @param {Object} context - 피코치 컨텍스트 (이름, 목표 등)
 */
export async function chatWithAI(userMessage, history = [], context = {}) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('API 키가 설정되지 않았습니다.')

  const systemPrompt = `당신은 따뜻하고 공감적인 ADHD 코칭 서포터입니다.
피코치의 일상적인 체크인을 도와주세요.

역할:
- 오늘 하루를 되돌아보게 돕기
- 감정을 표현하도록 격려
- 작은 성취도 인정하고 칭찬
- 어려움에 공감하되 해결책 강요하지 않기
- 필요시 코치와의 상담을 권유

대화 스타일:
- 짧고 따뜻한 문장 사용
- 이모지 적절히 활용
- 질문은 한 번에 하나씩
- 판단하지 않고 수용적으로

${context.name ? `피코치 이름: ${context.name}` : ''}
${context.goal ? `현재 목표: ${context.goal}` : ''}
${context.currentTask ? `진행 중인 과제: ${context.currentTask}` : ''}`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage }
  ]

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages,
      temperature: 0.8,
      max_tokens: 500
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'AI 응답 실패')
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

/**
 * 성찰 도우미 - 질문 생성
 * @param {Object} context - 현재 성찰 내용
 */
export async function getReflectionQuestions(context = {}) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('API 키가 설정되지 않았습니다.')

  const prompt = `ADHD 피코치의 성찰일지 작성을 돕는 질문을 3개 생성해주세요.

현재 상황:
- 회기: ${context.sessionNumber || 1}회기
- 오늘 기분: ${context.mood || '미입력'}
- 적은 내용: ${context.content || '아직 작성 전'}

JSON 형식으로 응답:
{
  "questions": [
    "성찰을 깊게 할 수 있는 질문 1",
    "질문 2",
    "질문 3"
  ],
  "encouragement": "짧은 격려 메시지"
}`

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    })
  })

  if (!response.ok) throw new Error('AI 응답 실패')

  const data = await response.json()
  const content = data.choices[0]?.message?.content || ''

  try {
    let jsonStr = content
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) jsonStr = match[1]
    return JSON.parse(jsonStr.trim())
  } catch {
    return {
      questions: [
        '오늘 가장 인상 깊었던 순간은 무엇인가요?',
        '어떤 감정이 가장 강하게 느껴졌나요?',
        '내일 한 가지 다르게 해보고 싶은 것이 있다면?'
      ],
      encouragement: '성찰하는 것 자체가 큰 성장이에요!'
    }
  }
}

/**
 * 성찰 인사이트 생성
 * @param {Object} reflection - 작성된 성찰 내용
 */
export async function getReflectionInsight(reflection) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('API 키가 설정되지 않았습니다.')

  const prompt = `피코치가 작성한 성찰일지를 읽고 간단한 인사이트를 제공해주세요.

성찰 내용:
- 기분: ${reflection.mood || '미입력'}
- 잘한 점: ${reflection.achievements || '미입력'}
- 어려웠던 점: ${reflection.challenges || '미입력'}
- 배운 점: ${reflection.learnings || '미입력'}
- 다음 목표: ${reflection.nextGoal || '미입력'}

JSON 형식으로 응답 (각 항목 1-2문장):
{
  "summary": "전체 성찰 요약",
  "strength": "발견한 강점",
  "growth": "성장 포인트",
  "tip": "ADHD 관점에서 도움될 팁"
}`

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    })
  })

  if (!response.ok) throw new Error('AI 응답 실패')

  const data = await response.json()
  const content = data.choices[0]?.message?.content || ''

  try {
    let jsonStr = content
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) jsonStr = match[1]
    return JSON.parse(jsonStr.trim())
  } catch {
    return {
      summary: '성찰일지를 작성해주셔서 감사해요!',
      strength: '꾸준히 기록하는 것 자체가 큰 강점이에요.',
      growth: '매일 조금씩 성장하고 있어요.',
      tip: '작은 성취도 소중히 여겨주세요.'
    }
  }
}

/**
 * 과제 서포터 - 힌트/격려
 * @param {Object} task - 과제 정보
 * @param {string} type - 'hint' | 'encourage' | 'stuck'
 */
export async function getTaskSupport(task, type = 'encourage') {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('API 키가 설정되지 않았습니다.')

  const prompts = {
    hint: `ADHD 피코치가 과제를 시작하기 어려워합니다. 첫 단계를 위한 구체적인 힌트를 주세요.

과제: ${task.title || '과제'}
설명: ${task.description || ''}
진행률: ${task.completedCount || 0}/${task.targetCount || 5}

JSON 응답:
{
  "firstStep": "가장 작은 첫 단계 (5분 이내)",
  "tip": "ADHD에 도움되는 팁",
  "encouragement": "짧은 격려"
}`,

    encourage: `ADHD 피코치에게 과제 진행에 대한 격려 메시지를 주세요.

과제: ${task.title || '과제'}
진행률: ${task.completedCount || 0}/${task.targetCount || 5}

JSON 응답:
{
  "message": "따뜻한 격려 메시지 (2-3문장)",
  "celebration": "진행상황 축하 (1문장)"
}`,

    stuck: `ADHD 피코치가 과제 진행 중 막혔습니다. 도움을 주세요.

과제: ${task.title || '과제'}
설명: ${task.description || ''}
진행률: ${task.completedCount || 0}/${task.targetCount || 5}

JSON 응답:
{
  "validation": "감정 공감 (1문장)",
  "suggestion": "다른 접근법 제안",
  "alternative": "더 작은 단계로 나누기",
  "reminder": "코치에게 말해도 된다는 안내"
}`
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompts[type] || prompts.encourage }],
      temperature: 0.8,
      max_tokens: 400
    })
  })

  if (!response.ok) throw new Error('AI 응답 실패')

  const data = await response.json()
  const content = data.choices[0]?.message?.content || ''

  try {
    let jsonStr = content
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) jsonStr = match[1]
    return JSON.parse(jsonStr.trim())
  } catch {
    return type === 'hint'
      ? { firstStep: '5분만 해보기', tip: '타이머를 설정해보세요', encouragement: '시작이 반이에요!' }
      : type === 'stuck'
      ? { validation: '막히는 건 자연스러운 거예요', suggestion: '잠시 쉬어가도 괜찮아요', alternative: '더 작게 나눠보면 어떨까요?', reminder: '코치에게 말씀해보세요' }
      : { message: '조금씩 해나가고 있는 것 자체가 대단해요!', celebration: '오늘도 한 걸음 나아갔어요 🎉' }
  }
}
