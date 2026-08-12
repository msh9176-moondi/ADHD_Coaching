/**
 * AI 분석 서비스
 * Ollama 로컬 AI (adhd-coach) 우선 시도, 실패 시 OpenAI GPT-4로 자동 폴백
 */

// API URLs
const OLLAMA_API_URL = 'http://localhost:11434/v1/chat/completions'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// 모델명
const OLLAMA_MODEL = 'adhd-coach'
const OPENAI_MODEL = 'gpt-4'

// Ollama 연결 상태 캐시 (불필요한 재시도 방지)
let ollamaAvailable = null
let ollamaCheckTime = 0
const OLLAMA_CHECK_INTERVAL = 30000 // 30초마다 재확인

/**
 * Ollama 연결 가능 여부 확인
 */
async function checkOllamaConnection() {
  const now = Date.now()

  // 캐시된 결과가 있고 30초 이내면 재사용
  if (ollamaAvailable !== null && (now - ollamaCheckTime) < OLLAMA_CHECK_INTERVAL) {
    return ollamaAvailable
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000) // 3초 타임아웃

    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: controller.signal
    })

    clearTimeout(timeout)
    ollamaAvailable = response.ok
    ollamaCheckTime = now

    if (ollamaAvailable) {
      console.log('[AI] Ollama 로컬 AI 연결됨')
    }

    return ollamaAvailable
  } catch (err) {
    ollamaAvailable = false
    ollamaCheckTime = now
    console.log('[AI] Ollama 연결 불가 - OpenAI로 전환')
    return false
  }
}

/**
 * AI API 호출 공통 함수 (자동 폴백)
 * 1. Ollama 연결 시도
 * 2. 실패 시 OpenAI로 자동 전환
 */
async function callAI(messages, options = {}) {
  const { temperature = 0.7, max_tokens = 2000 } = options
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  // Ollama 연결 확인
  const useOllama = await checkOllamaConnection()

  if (useOllama) {
    // Ollama 사용
    try {
      const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages,
          temperature,
          max_tokens
        })
      })

      if (response.ok) {
        return response.json()
      }

      // Ollama 요청 실패 시 OpenAI로 폴백
      console.log('[AI] Ollama 요청 실패 - OpenAI로 폴백')
    } catch (err) {
      console.log('[AI] Ollama 요청 오류 - OpenAI로 폴백:', err.message)
    }
  }

  // OpenAI 사용 (폴백)
  if (!apiKey) {
    throw new Error('로컬 AI(Ollama)에 연결할 수 없고, OpenAI API 키도 설정되지 않았습니다. .env.local 파일에 VITE_OPENAI_API_KEY를 설정해주세요.')
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature,
      max_tokens
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `API 요청 실패: ${response.status}`)
  }

  return response.json()
}

/**
 * 현재 사용 중인 AI 제공자 반환 (비동기)
 */
export async function getCurrentAIProvider() {
  const useOllama = await checkOllamaConnection()
  return useOllama ? 'ollama' : 'openai'
}

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
  if (!messages || messages.length === 0) {
    throw new Error('분석할 대화 내용이 없습니다.')
  }

  const data = await callAI([
    { role: 'system', content: COACHING_ANALYSIS_PROMPT },
    { role: 'user', content: buildAnalysisRequest(messages, coacheeInfo) }
  ], { temperature: 0.7, max_tokens: 2000 })

  return parseAnalysisResponse(data)
}

/**
 * AI 설정 확인
 * Ollama 또는 OpenAI 중 하나라도 사용 가능하면 true
 */
export function isAIConfigured() {
  // OpenAI API 키가 있으면 항상 사용 가능
  if (import.meta.env.VITE_OPENAI_API_KEY) return true
  // Ollama는 런타임에 확인 (일단 true 반환, 실제 호출 시 폴백)
  return true
}

/**
 * 현재 AI 제공자 반환 (동기 버전 - 캐시된 값 사용)
 */
export function getAIProvider() {
  if (ollamaAvailable === true) return 'ollama'
  if (ollamaAvailable === false) return 'openai'
  return 'auto' // 아직 확인 안됨
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

  const data = await callAI(messages, { temperature: 0.8, max_tokens: 500 })
  return data.choices[0]?.message?.content || ''
}

/**
 * 채팅 내역 기반 성찰일지 도우미
 * @param {Array} messages - 채팅 내역
 * @param {string} topicTitle - 선택된 코칭 주제
 * @param {number} sessionNumber - 회기 번호
 */
export async function getSessionReflectionHelper(messages = [], topicTitle = '', sessionNumber = 1) {
  // 최근 메시지만 분석 (토큰 제한 고려)
  const recentMessages = messages.slice(-40)
  const conversationText = recentMessages.map(msg => {
    const role = msg.sender === 'coach' || msg.sender_role === 'coach' ? '코치' : '피코치'
    return `[${role}]: ${msg.content || ''}`
  }).join('\n')

  const prompt = `당신은 ADHD 코칭 피코치의 성찰일지 작성을 돕는 따뜻한 도우미입니다.
아래 코칭 대화 내역을 분석하여 피코치가 성찰일지를 쉽게 작성할 수 있도록 조언해주세요.

## 대화 내역
${conversationText || '대화 내역 없음'}

## 회기 정보
- 회기: ${sessionNumber}회기
- 코칭 주제: ${topicTitle || '미선택'}

## 요청
위 대화를 바탕으로 피코치가 성찰일지를 작성하는 데 도움이 될 내용을 JSON 형식으로 제공해주세요.
피코치의 언어와 표현을 최대한 활용하고, 강요하지 않는 부드러운 제안으로 작성해주세요.

JSON 응답 형식:
{
  "sessionSummary": "이번 회기에서 다룬 핵심 내용 요약 (2-3문장)",
  "keyMoments": ["인상 깊었던 순간 1", "순간 2"],
  "learnedSuggestions": [
    "배운 점 제안 1 (피코치가 직접 표현한 내용 활용)",
    "배운 점 제안 2"
  ],
  "actionPlanSuggestions": [
    {
      "action": "구체적인 액션플랜",
      "why": "왜 이게 도움이 될지",
      "howSmall": "더 작게 시작하려면"
    }
  ],
  "nextSessionSuggestions": [
    "다음 회기에서 다루면 좋을 주제 1",
    "주제 2"
  ],
  "encouragement": "피코치에게 전하는 따뜻한 격려 메시지 (1-2문장)",
  "scoreHint": "점수 변화에 대한 힌트 (예: '오늘 새로운 시도를 했으니 점수를 올려도 좋을 것 같아요')"
}`

  const data = await callAI([{ role: 'user', content: prompt }], { temperature: 0.7, max_tokens: 1500 })
  const content = data.choices[0]?.message?.content || ''

  try {
    let jsonStr = content
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) jsonStr = match[1]
    return JSON.parse(jsonStr.trim())
  } catch {
    return {
      sessionSummary: '대화 내용을 분석하는 데 문제가 발생했습니다.',
      keyMoments: [],
      learnedSuggestions: ['오늘 코칭에서 새롭게 알게 된 것을 적어보세요.'],
      actionPlanSuggestions: [{ action: '작은 한 가지부터 시작해보세요', why: '작은 성공이 큰 변화로 이어져요', howSmall: '5분만 해보기' }],
      nextSessionSuggestions: ['다음에 이야기하고 싶은 주제를 생각해보세요'],
      encouragement: '성찰하는 것 자체가 큰 성장이에요!',
      scoreHint: ''
    }
  }
}

/**
 * 성찰 도우미 - 질문 생성
 * @param {Object} context - 현재 성찰 내용
 */
export async function getReflectionQuestions(context = {}) {
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

  const data = await callAI([{ role: 'user', content: prompt }], { temperature: 0.7, max_tokens: 500 })
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

  const data = await callAI([{ role: 'user', content: prompt }], { temperature: 0.7, max_tokens: 500 })
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
// ============================================
// 코치용 AI 코칭 브리핑
// ============================================

/**
 * 종합 코칭 브리핑 생성
 * @param {Object} coacheeData - 피코치 정보 및 세션 데이터
 * @param {Array} messages - 전체 대화 내역
 * @param {Array} sessionNotes - 세션 노트 목록
 * @param {Array} reflections - 피코치 성찰일지
 * @param {number} currentSessionNumber - 현재 회기
 * @returns {Promise<Object>} 코칭 브리핑 결과
 */
export async function generateCoachingBriefing(coacheeData, messages = [], sessionNotes = [], reflections = [], currentSessionNumber = 1) {
  // 회기별 차별화된 분석 포커스
  const sessionFocus = getSessionFocus(currentSessionNumber)

  const systemPrompt = `당신은 ADHD 코칭 전문가 어시스턴트입니다.
피코치의 모든 데이터를 종합 분석하여 코치에게 전략적 브리핑을 제공합니다.

## 분석 원칙
1. 피코치의 원래 진술과 AI 해석을 명확히 분리
2. 문제의 표면적 증상이 아닌 작동 구조(메커니즘) 분석
3. 강점을 구체적 증거와 함께 제시
4. 코칭 우선순위는 영향력과 실현가능성 고려
5. 작은 실험은 실패해도 배울 수 있도록 설계

## 현재 회기 포커스: ${currentSessionNumber}회기
${sessionFocus}

## JSON 응답 형식
{
  "briefingSummary": {
    "headline": "한 줄 핵심 (코치가 가장 먼저 볼 내용)",
    "keyTakeaways": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
    "sessionProgress": "전체 여정에서 현재 위치 설명"
  },

  "coacheeStatements": {
    "directQuotes": [
      {"quote": "피코치 원문 인용", "context": "어떤 맥락에서", "significance": "왜 중요한지"}
    ],
    "selfDescriptions": {
      "howTheySeeThemselves": "피코치가 자신을 어떻게 설명하는지",
      "statedGoals": "피코치가 직접 말한 목표",
      "expressedDifficulties": "피코치가 표현한 어려움"
    }
  },

  "aiInterpretation": {
    "beyondWords": "피코치가 직접 말하지 않았지만 읽히는 것",
    "discrepancies": "진술과 행동 사이의 불일치",
    "blindSpots": "피코치가 인식하지 못하는 것",
    "underlyingNeeds": "근본적 욕구 추정",
    "confidence": "해석의 확신도 (low/medium/high)"
  },

  "problemStructure": {
    "surfaceIssue": "표면적으로 보이는 문제",
    "triggerPattern": {
      "triggers": ["트리거 1", "트리거 2"],
      "responses": ["반응 패턴 1", "반응 패턴 2"],
      "consequences": ["결과 1", "결과 2"]
    },
    "maintenanceFactors": ["문제를 유지시키는 요인들"],
    "secondaryGains": "문제 행동의 숨겨진 이득 (있다면)",
    "structuralDiagram": "트리거 → 자동사고 → 감정 → 행동 → 결과 의 흐름 요약"
  },

  "strengthsAnalysis": {
    "evidencedStrengths": [
      {"strength": "강점", "evidence": "구체적 증거", "coachingApplication": "코칭에서 활용법"}
    ],
    "emergingStrengths": ["아직 약하지만 발전 가능한 강점"],
    "resourcesAvailable": ["활용 가능한 내외부 자원"]
  },

  "coachingPriorities": {
    "immediateActions": [
      {"action": "즉시 할 것", "rationale": "왜", "expectedOutcome": "기대 결과"}
    ],
    "sessionAgenda": [
      {"topic": "이번 세션 주제", "approach": "접근법", "timeAllocation": "대략적 시간배분"}
    ],
    "avoidThisSession": ["이번 세션에서 피해야 할 것"],
    "strategicDirection": "중장기 코칭 방향"
  },

  "suggestedQuestions": {
    "openingQuestions": ["세션 시작 질문"],
    "explorationQuestions": ["탐색을 위한 질문"],
    "challengingQuestions": ["도전적 질문 (타이밍 주의)"],
    "closingQuestions": ["세션 마무리 질문"]
  },

  "smallExperiments": [
    {
      "experimentName": "실험 이름",
      "description": "무엇을 해보는가",
      "duration": "기간 (예: 3일, 1주)",
      "successCriteria": "성공 기준",
      "failureLearning": "실패해도 배울 수 있는 것",
      "adaptations": "ADHD 맞춤 조정 (예: 알림 설정, 시각화)"
    }
  ],

  "coacheeVersion": {
    "sessionPreview": "이번 세션에서 함께 이야기할 내용 (친근한 톤)",
    "progressCelebration": "지금까지 잘해온 것 인정",
    "simpleNextStep": "다음 단계 한 가지 (명확하고 작게)",
    "encouragement": "격려 메시지"
  },

  "metaAnalysis": {
    "coachingRelationship": "코칭 관계 평가",
    "resistanceLevel": "저항/방어 수준 (low/medium/high)",
    "readinessForChange": "변화 준비도",
    "riskFactors": ["주의해야 할 위험 요소"],
    "supervisorNote": "수퍼비전 시 논의할 점 (있다면)"
  }
}`

  // 데이터 구성
  const analysisData = buildBriefingData(coacheeData, messages, sessionNotes, reflections, currentSessionNumber)

  const data = await callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: analysisData }
  ], { temperature: 0.6, max_tokens: 4000 })

  return parseBriefingResponse(data)
}

/**
 * 회기별 분석 포커스 결정
 */
function getSessionFocus(sessionNumber) {
  const focusMap = {
    1: `1회기 - 관계 형성 & 목표 설정
- 신뢰 구축이 최우선
- 피코치의 언어와 프레임 이해하기
- 현실적이고 동기부여되는 목표 도출
- ADHD 특성과 강점 탐색 시작`,

    2: `2회기 - 실행 환경 설계
- 목표를 구체적 행동으로 전환
- 장애물 예측 및 대비책 수립
- 작은 성공 경험 설계
- 피코치 맞춤 루틴 초안`,

    3: `3회기 - 감정/자기비난/재시작 훈련
- 감정 인식 및 조절 전략
- 자기비난 패턴 탐색 및 재구성
- 중단 후 재시작 기술
- 자기 연민 연습`,

    4: `4회기 - 장애물 분석과 대응
- 예상치 못한 장애물 분석
- 회피/미루기 패턴 이해
- 대안적 대응 전략 수립
- 환경 조정`,

    5: `5회기 - 루틴 점검 및 조정
- 중간 점검
- 작동하는 것과 안 하는 것 구분
- 루틴 미세 조정
- 동기 재점화`,

    6: `6회기 - 중간 점검
- 전반부 성찰
- 목표 재설정 필요 여부 확인
- 코칭 관계 점검
- 후반부 전략 수립`,

    7: `7회기 - 심화 작업
- 핵심 패턴 깊이 탐색
- 도전적 실험 시도
- 자기 효능감 강화
- 독립성 증진`,

    8: `8회기 - 최종 점검 및 마무리
- 전체 여정 성찰
- 성장 인정 및 축하
- 지속 전략 수립
- 종결 준비 / 사후관리 안내`
  }

  return focusMap[sessionNumber] || focusMap[Math.min(sessionNumber, 8)]
}

/**
 * 브리핑 분석용 데이터 구성
 */
function buildBriefingData(coacheeData, messages, sessionNotes, reflections, currentSessionNumber) {
  // 최근 메시지 (토큰 제한 고려)
  const recentMessages = messages.slice(-50)
  const conversationText = recentMessages.map(msg => {
    const role = msg.sender_role === 'coach' ? '코치' : '피코치'
    return `[${role}]: ${msg.content || ''}`
  }).join('\n')

  // 세션 노트 요약
  const notesText = sessionNotes.map((note, idx) => {
    return `[${idx + 1}회기 노트]
주제: ${note.main_topics?.join(', ') || '없음'}
요약: ${note.summary || '없음'}
다음 과제: ${note.next_actions?.join(', ') || '없음'}`
  }).join('\n\n')

  // 성찰일지 요약
  const reflectionsText = reflections.slice(-5).map((ref, idx) => {
    return `[성찰 ${idx + 1}]
날짜: ${ref.date || ''}
기분: ${ref.mood || ''}
내용: ${ref.content?.substring(0, 200) || ''}...`
  }).join('\n\n')

  return `## 피코치 기본 정보
- 이름: ${coacheeData.name || '미상'}
- 패키지: ${coacheeData.packageType || '미상'}
- 현재 회기: ${currentSessionNumber}/${coacheeData.totalSessions || 8}
- 코칭 주제: ${coacheeData.topics?.join(', ') || '미설정'}
- 시작일: ${coacheeData.startDate || '미상'}

## 최근 대화 내역 (최근 ${recentMessages.length}개)
${conversationText || '대화 기록 없음'}

## 세션 노트 기록
${notesText || '세션 노트 없음'}

## 피코치 성찰일지
${reflectionsText || '성찰일지 없음'}

## 분석 요청
위 데이터를 종합하여 ${currentSessionNumber}회기를 앞두고 코치가 참고할 종합 브리핑을 제공해주세요.
피코치의 원래 진술과 AI의 해석을 명확히 구분하고, 구체적이고 실행 가능한 코칭 전략을 제안해주세요.`
}

/**
 * 브리핑 응답 파싱
 */
function parseBriefingResponse(data) {
  try {
    const content = data.choices[0]?.message?.content || ''

    let jsonStr = content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    return JSON.parse(jsonStr.trim())
  } catch (err) {
    console.error('브리핑 응답 파싱 실패:', err)
    return getDefaultBriefing()
  }
}

/**
 * 기본 브리핑 구조 (파싱 실패 시)
 */
function getDefaultBriefing() {
  return {
    briefingSummary: {
      headline: '분석을 위한 데이터가 부족합니다',
      keyTakeaways: ['더 많은 대화가 필요합니다'],
      sessionProgress: '초기 단계'
    },
    coacheeStatements: {
      directQuotes: [],
      selfDescriptions: {
        howTheySeeThemselves: '정보 없음',
        statedGoals: '정보 없음',
        expressedDifficulties: '정보 없음'
      }
    },
    aiInterpretation: {
      beyondWords: '분석 불가',
      discrepancies: '분석 불가',
      blindSpots: '분석 불가',
      underlyingNeeds: '분석 불가',
      confidence: 'low'
    },
    problemStructure: {
      surfaceIssue: '정보 부족',
      triggerPattern: { triggers: [], responses: [], consequences: [] },
      maintenanceFactors: [],
      secondaryGains: '',
      structuralDiagram: ''
    },
    strengthsAnalysis: {
      evidencedStrengths: [],
      emergingStrengths: [],
      resourcesAvailable: []
    },
    coachingPriorities: {
      immediateActions: [],
      sessionAgenda: [],
      avoidThisSession: [],
      strategicDirection: '먼저 라포 형성에 집중'
    },
    suggestedQuestions: {
      openingQuestions: ['오늘 어떤 마음으로 오셨나요?'],
      explorationQuestions: [],
      challengingQuestions: [],
      closingQuestions: ['오늘 이야기 나누면서 어떠셨어요?']
    },
    smallExperiments: [],
    coacheeVersion: {
      sessionPreview: '이번 세션에서 함께 이야기 나눠요',
      progressCelebration: '',
      simpleNextStep: '',
      encouragement: '함께 해나가요!'
    },
    metaAnalysis: {
      coachingRelationship: '형성 중',
      resistanceLevel: 'low',
      readinessForChange: '평가 필요',
      riskFactors: [],
      supervisorNote: ''
    }
  }
}

/**
 * 빠른 세션 준비 브리핑 (간소화 버전)
 */
export async function getQuickSessionBriefing(coacheeData, recentMessages = []) {
  const messagesText = recentMessages.slice(-20).map(msg => {
    const role = msg.sender_role === 'coach' ? '코치' : '피코치'
    return `[${role}]: ${msg.content || ''}`
  }).join('\n')

  const prompt = `ADHD 코칭 세션 빠른 브리핑을 제공하세요.

피코치: ${coacheeData.name || '미상'}
현재 회기: ${coacheeData.currentSession || 1}/${coacheeData.totalSessions || 8}

최근 대화:
${messagesText || '대화 없음'}

JSON 응답:
{
  "headline": "오늘 세션 핵심 포인트 (1문장)",
  "coacheeState": "피코치의 현재 상태 요약",
  "topPriority": "가장 중요한 한 가지",
  "openingQuestion": "세션 시작 질문",
  "caution": "주의할 점 (있으면)"
}`

  const data = await callAI([{ role: 'user', content: prompt }], { temperature: 0.7, max_tokens: 500 })
  const content = data.choices[0]?.message?.content || ''

  try {
    let jsonStr = content
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) jsonStr = match[1]
    return JSON.parse(jsonStr.trim())
  } catch {
    return {
      headline: '세션 준비 완료',
      coacheeState: '정보 부족',
      topPriority: '라포 형성',
      openingQuestion: '오늘 어떻게 지내셨어요?',
      caution: ''
    }
  }
}

/**
 * 코치용 세션 일지 작성 도우미
 * 채팅 내역을 분석하여 세션 일지 필드 제안
 * @param {Array} messages - 채팅 내역
 * @param {Object} coacheeInfo - 피코치 정보
 * @param {number} sessionNumber - 회기 번호
 */
export async function getSessionNoteAssist(messages = [], coacheeInfo = {}, sessionNumber = 1) {
  // 최근 메시지만 분석 (토큰 제한 고려)
  const recentMessages = messages.slice(-50)
  const conversationText = recentMessages.map(msg => {
    const role = msg.sender === 'coach' || msg.sender_role === 'coach' ? '코치' : '피코치'
    return `[${role}]: ${msg.content || ''}`
  }).join('\n')

  const prompt = `당신은 ADHD 코칭 세션 일지 작성을 돕는 전문 어시스턴트입니다.
아래 코칭 대화를 분석하여 코치가 세션 일지를 작성하는 데 도움이 될 내용을 제안해주세요.

## 피코치 정보
- 이름: ${coacheeInfo.name || '미상'}
- 회기: ${sessionNumber}회기
- 코칭 주제: ${coacheeInfo.topics?.join(', ') || '미설정'}

## 대화 내역
${conversationText || '대화 내역 없음'}

## 요청
위 대화를 바탕으로 세션 일지 각 항목에 들어갈 내용을 제안해주세요.
대화에서 직접 확인된 내용만 작성하고, 추측이 필요한 부분은 "~로 보임", "~것 같음" 등으로 표현해주세요.

JSON 응답 형식:
{
  "coachingGoal": "이번 코칭 전체의 목표 (대화에서 확인된 내용)",
  "sessionTopic": "오늘 세션에서 다룬 핵심 주제",
  "mood": "good/normal/difficult 중 하나",
  "emotion": "피코치가 표현한 주요 감정 (불안, 기대, 피로 등)",
  "bodyResponse": "피코치가 언급한 신체 반응 (있으면)",
  "taskReview": "지난 과제 수행 여부와 결과 (대화에서 확인된 내용)",
  "content": "오늘 상담에서 다룬 핵심 내용 요약 (3-5문장)",
  "autoThought": "피코치에게서 관찰된 자동적 사고 패턴",
  "avoidance": "관찰된 회피 행동 패턴",
  "helpfulAction": "피코치에게 효과적이었던 전략이나 행동",
  "achievement": "이번 회기에서 얻은 성과나 진전",
  "desiredResult": "앞으로 기대하는 변화",
  "nextTask": "다음 회기까지 수행할 과제 제안",
  "privateNote": "코치가 참고할 만한 개인 메모 (주의사항, 수퍼비전 필요 여부 등)",
  "confidence": "제안 내용의 신뢰도 (high/medium/low)"
}`

  const data = await callAI([{ role: 'user', content: prompt }], { temperature: 0.6, max_tokens: 2000 })
  const content = data.choices[0]?.message?.content || ''

  try {
    let jsonStr = content
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) jsonStr = match[1]
    return JSON.parse(jsonStr.trim())
  } catch {
    return {
      coachingGoal: '',
      sessionTopic: '',
      mood: '',
      emotion: '',
      bodyResponse: '',
      taskReview: '',
      content: '대화 내용을 분석하는 데 문제가 발생했습니다.',
      autoThought: '',
      avoidance: '',
      helpfulAction: '',
      achievement: '',
      desiredResult: '',
      nextTask: '',
      privateNote: '',
      confidence: 'low'
    }
  }
}

export async function getTaskSupport(task, type = 'encourage') {
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

  const data = await callAI([{ role: 'user', content: prompts[type] || prompts.encourage }], { temperature: 0.8, max_tokens: 400 })
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
