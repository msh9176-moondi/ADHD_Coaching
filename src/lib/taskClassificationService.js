/**
 * 태스크 분류 및 실행 도우미 AI 서비스
 * ADHD 대처기술에 기반한 태스크 관리
 */

import { chatWithAI, isAIConfigured } from './aiService'

/**
 * 브레인 덤프 내용을 일일/포괄 실행목록으로 분류
 * @param {string} dumpText - 사용자가 입력한 브레인 덤프 텍스트
 * @returns {Promise<{daily: string[], comprehensive: string[]}>}
 */
export async function classifyTasks(dumpText) {
  // AI가 설정되어 있으면 AI 사용
  if (isAIConfigured()) {
    try {
      const prompt = `당신은 ADHD 코칭 전문가입니다. 사용자가 브레인 덤프한 내용을 분석하여 두 가지 카테고리로 분류해주세요.

[분류 기준]
1. 일일 실행목록: 오늘 당장 할 수 있는 구체적인 행동. 30분 이내로 완료 가능한 것.
   - 예: "엄마한테 전화하기", "약 먹기", "장보기 목록 작성", "이메일 1개 답장"

2. 포괄 실행목록: 여러 단계가 필요하거나 장기적인 목표. 하루에 끝내기 어려운 것.
   - 예: "세금 신고하기", "이사 준비", "자격증 공부", "프로젝트 완성"

[사용자 입력]
${dumpText}

[응답 형식]
반드시 아래 JSON 형식으로만 응답하세요:
{
  "daily": ["일일 태스크1", "일일 태스크2"],
  "comprehensive": ["포괄 태스크1", "포괄 태스크2"]
}

큰 태스크는 가능하면 작은 단위로 나눠서 일일 목록에 넣어주세요.
모호한 표현은 구체적인 행동으로 바꿔주세요.`

      const response = await chatWithAI(prompt, [], { systemPrompt: true })

      // JSON 파싱 시도
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          daily: parsed.daily || [],
          comprehensive: parsed.comprehensive || []
        }
      }
    } catch (err) {
      console.error('AI 분류 실패, 폴백 사용:', err)
    }
  }

  // 폴백: 간단한 규칙 기반 분류
  return classifyTasksFallback(dumpText)
}

/**
 * 폴백 분류 (AI 없을 때)
 */
function classifyTasksFallback(dumpText) {
  const tasks = dumpText
    .split(/[,\n،;]/)
    .map(t => t.trim())
    .filter(t => t.length > 0)

  const daily = []
  const comprehensive = []

  // 간단한 키워드 기반 분류
  const comprehensiveKeywords = [
    '프로젝트', '준비', '공부', '계획', '정리', '청소',
    '신고', '신청', '이사', '취업', '자격증', '시험',
    '다이어트', '운동 시작', '습관', '목표'
  ]

  tasks.forEach(task => {
    const isComprehensive = comprehensiveKeywords.some(keyword =>
      task.includes(keyword)
    ) || task.length > 20

    if (isComprehensive) {
      comprehensive.push(task)
    } else {
      daily.push(task)
    }
  })

  return { daily, comprehensive }
}

/**
 * 태스크에 대한 AI 예시 생성
 * @param {string} taskText - 태스크 내용
 * @returns {Promise<Object>}
 */
export async function generateTaskExamples(taskText) {
  // AI가 설정되어 있으면 AI 사용
  if (isAIConfigured()) {
    try {
      const prompt = `당신은 ADHD 코칭 전문가입니다. 다음 태스크에 대해 실행을 도울 수 있는 예시를 생성해주세요.

[태스크]
${taskText}

[응답 형식]
반드시 아래 JSON 형식으로만 응답하세요:
{
  "firstStep": "이 태스크를 시작하기 위한 가장 작고 구체적인 첫 번째 행동 (5분 이내)",
  "negativeExample": "이 일을 미루게 만드는 전형적인 감정이나 생각 예시",
  "positiveExample": "이 일을 완수했을 때 느낄 수 있는 긍정적인 감정이나 이점",
  "ifThenExample": {
    "if": "예상되는 방해요소나 어려움",
    "then": "그 상황에서 할 수 있는 대응 행동"
  }
}

예시는 구체적이고 공감할 수 있게 작성해주세요.
firstStep은 정말 작아서 "이 정도는 할 수 있어"라고 느낄 수 있는 수준으로 만들어주세요.`

      const response = await chatWithAI(prompt, [], { systemPrompt: true })

      // JSON 파싱 시도
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (err) {
      console.error('AI 예시 생성 실패, 폴백 사용:', err)
    }
  }

  // 폴백: 태스크 유형에 따른 기본 예시
  return generateExamplesFallback(taskText)
}

/**
 * 폴백 예시 생성
 */
function generateExamplesFallback(taskText) {
  const text = taskText.toLowerCase()

  // 전화/연락 관련
  if (text.includes('전화') || text.includes('연락') || text.includes('통화')) {
    return {
      firstStep: '핸드폰을 손에 들기',
      negativeExample: '뭐라고 말해야 할지 모르겠음, 통화가 길어질까봐 걱정',
      positiveExample: '연락해서 마음이 가벼워질 거야, 상대방도 기뻐할 거야',
      ifThenExample: {
        if: '상대방이 바쁘다고 하면',
        then: '언제 다시 전화해도 될지 물어볼 거야'
      }
    }
  }

  // 정리/청소 관련
  if (text.includes('정리') || text.includes('청소') || text.includes('치우')) {
    return {
      firstStep: '정리할 공간 앞에 서기',
      negativeExample: '너무 많아서 막막함, 어디서부터 해야 할지 모르겠음',
      positiveExample: '깔끔해진 공간을 보면 기분이 좋아질 거야',
      ifThenExample: {
        if: '중간에 다른 물건이 눈에 들어오면',
        then: '일단 무시하고 지금 하는 구역만 끝낼 거야'
      }
    }
  }

  // 공부/학습 관련
  if (text.includes('공부') || text.includes('학습') || text.includes('읽기') || text.includes('책')) {
    return {
      firstStep: '책상에 앉아서 책/자료 펴기',
      negativeExample: '지루할 것 같음, 집중이 안 될 것 같음',
      positiveExample: '조금이라도 하면 뿌듯할 거야, 실력이 늘 거야',
      ifThenExample: {
        if: '집중이 안 되면',
        then: '5분만 쉬고 다시 10분 더 해볼 거야'
      }
    }
  }

  // 운동 관련
  if (text.includes('운동') || text.includes('헬스') || text.includes('달리기') || text.includes('산책')) {
    return {
      firstStep: '운동복으로 갈아입기',
      negativeExample: '피곤함, 귀찮음, 시간이 없을 것 같음',
      positiveExample: '운동 후 개운한 느낌, 건강해지는 느낌',
      ifThenExample: {
        if: '몸이 피곤하면',
        then: '가벼운 스트레칭이라도 5분만 할 거야'
      }
    }
  }

  // 업무/과제 관련
  if (text.includes('보고서') || text.includes('문서') || text.includes('작성') || text.includes('업무')) {
    return {
      firstStep: '컴퓨터 켜고 해당 파일 열기',
      negativeExample: '어디서부터 시작해야 할지 막막함, 완벽하게 해야 할 것 같은 부담',
      positiveExample: '끝내면 마음이 편해질 거야, 진척이 생기면 뿌듯할 거야',
      ifThenExample: {
        if: '완벽하게 해야 한다는 생각이 들면',
        then: '일단 초안만 작성하고 나중에 수정할 거야'
      }
    }
  }

  // 기본 폴백
  return {
    firstStep: `"${taskText}"를 하기 위해 필요한 물건 준비하기`,
    negativeExample: '하기 싫음, 귀찮음, 나중에 해도 될 것 같음',
    positiveExample: '완료하면 뿌듯할 거야, 미뤄둔 짐을 덜 수 있어',
    ifThenExample: {
      if: '하기 싫은 마음이 들면',
      then: '일단 10분만 시도해보고 다시 결정할 거야'
      }
  }
}

/**
 * 브레인 덤프 내용을 분석하여 원본 보존 + AI 변환 + 분류 수행
 * 카드뉴스 검수 UI용
 * @param {string} dumpText - 사용자가 입력한 브레인 덤프 텍스트
 * @returns {Promise<{items: Array}>}
 */
export async function classifyTasksWithReview(dumpText) {
  // 원본 텍스트를 개별 항목으로 분리
  const originalItems = dumpText
    .split(/[,\n،;]/)
    .map(t => t.trim())
    .filter(t => t.length > 0)

  if (originalItems.length === 0) {
    return { items: [] }
  }

  // AI가 설정되어 있으면 AI 사용
  if (isAIConfigured()) {
    try {
      const prompt = `당신은 ADHD 코칭 전문가입니다. 사용자가 브레인 덤프한 각 항목을 분석해주세요.

[분류 기준]
1. daily (일일): 오늘 당장 할 수 있는 구체적인 행동. 30분 이내 완료 가능.
2. comprehensive (포괄): 여러 단계가 필요하거나 장기적인 목표.

[변환 원칙]
- 모호한 표현 → 구체적인 행동용어로 변환
- 광범위한 과제 → 작고 실행 가능한 첫 단계로 변환
- "~하기"로 끝나는 명확한 동사형으로

[사용자 입력 항목들]
${originalItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}

[응답 형식]
반드시 아래 JSON 형식으로만 응답하세요:
{
  "items": [
    {
      "original": "사용자가 입력한 원본 그대로",
      "transformed": "AI가 행동용어로 변환한 문장",
      "category": "daily 또는 comprehensive",
      "priority": 1-5 (1이 가장 높음),
      "aiNote": "왜 이렇게 분류/변환했는지 간단한 설명"
    }
  ]
}`

      const response = await chatWithAI(prompt, [], { systemPrompt: true })

      // JSON 파싱 시도
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          items: parsed.items || []
        }
      }
    } catch (err) {
      console.error('AI 분류 실패, 폴백 사용:', err)
    }
  }

  // 폴백: 원본 유지 + 간단한 분류
  return classifyWithReviewFallback(originalItems)
}

/**
 * 폴백 분류 (원본 보존 버전)
 */
function classifyWithReviewFallback(originalItems) {
  const comprehensiveKeywords = [
    '프로젝트', '준비', '공부', '계획', '정리', '청소',
    '신고', '신청', '이사', '취업', '자격증', '시험',
    '다이어트', '운동 시작', '습관', '목표'
  ]

  const items = originalItems.map((original, index) => {
    const isComprehensive = comprehensiveKeywords.some(keyword =>
      original.includes(keyword)
    ) || original.length > 20

    return {
      original,
      transformed: original, // 폴백에서는 변환 없음
      category: isComprehensive ? 'comprehensive' : 'daily',
      priority: index + 1,
      aiNote: isComprehensive
        ? '여러 단계가 필요해 보여서 포괄 목록으로 분류했습니다.'
        : '바로 실행 가능해 보여서 일일 목록으로 분류했습니다.'
    }
  })

  return { items }
}

/**
 * 우선순위 조언 생성 (ADHD 대처기술 기반)
 * @param {Array} tasks - 태스크 목록
 * @returns {Promise<string>}
 */
export async function generatePriorityAdvice(tasks) {
  const dailyTasks = tasks.filter(t => t.category === 'daily')

  if (dailyTasks.length === 0) {
    return '오늘 할 일일 목록이 없습니다.'
  }

  if (isAIConfigured()) {
    try {
      const taskList = dailyTasks.map((t, i) => `${i + 1}. ${t.text || t.transformed}`).join('\n')

      const prompt = `당신은 ADHD 코칭 전문가입니다. 다음 일일 실행목록에 대해 우선순위 조언을 해주세요.

[ADHD 우선순위 원칙]
- 자기 관리 시간(운동, 휴식 등)을 다른 일정보다 우선
- 우선순위가 높은 일을 먼저 완료하고 보상
- 즐거운 활동은 과제 수행 보상으로 활용
- 회피하고 있는 과제는 가장 작은 단계로 분해

[일일 실행목록]
${taskList}

위 목록의 최적 실행 순서와 그 이유를 간결하게 조언해주세요. (200자 이내)`

      const response = await chatWithAI(prompt, [], { systemPrompt: true })
      return response
    } catch (err) {
      console.error('우선순위 조언 생성 실패:', err)
    }
  }

  // 폴백 조언
  return `💡 우선순위 팁: 가장 에너지가 높은 시간에 어려운 일을 먼저 처리하세요.
자기 관리(운동, 휴식)는 다른 일정보다 우선순위를 높게 두세요.
큰 일은 "10분만 해보기"로 시작하면 부담이 줄어듭니다.`
}

export default {
  classifyTasks,
  classifyTasksWithReview,
  generateTaskExamples,
  generatePriorityAdvice
}
