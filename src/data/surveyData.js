// ===== ASRS 자가진단 질문 (WHO 기반) =====
export const ASRS_QUESTIONS = [
  { id: 1, text: '어떤 일의 가장 어려운 부분은 끝냈는데, 마무리를 짓지 못해서 일을 완성하지 못한 적이 얼마나 자주 있습니까?', category: 'inattention' },
  { id: 2, text: '체계적으로 해야 하는 일을 할 때, 순서대로 진행하는 것이 얼마나 자주 어렵습니까?', category: 'inattention' },
  { id: 3, text: '약속이나 할 일을 잊어버리는 것이 얼마나 자주 있습니까?', category: 'inattention' },
  { id: 4, text: '생각을 많이 해야 하는 일을 피하거나 미루는 것이 얼마나 자주 있습니까?', category: 'inattention' },
  { id: 5, text: '오래 앉아 있어야 할 때, 손을 만지작거리거나 발을 꼼지락거리는 것이 얼마나 자주 있습니까?', category: 'hyperactivity' },
  { id: 6, text: '마치 모터가 달린 것처럼 지나치게 활동적이거나 뭔가를 하지 않고는 못 견디는 느낌이 얼마나 자주 있습니까?', category: 'hyperactivity' },
  { id: 7, text: '세부사항에 주의를 기울이지 못하거나, 학업/업무에서 부주의한 실수를 하는 것이 얼마나 자주 있습니까?', category: 'inattention' },
  { id: 8, text: '직장이나 가정에서 지루하거나 반복적인 일을 할 때 집중을 유지하기 어려운 것이 얼마나 자주 있습니까?', category: 'inattention' },
  { id: 9, text: '다른 사람이 직접 말을 걸고 있는데도 잘 듣지 못하는 것처럼 보이는 것이 얼마나 자주 있습니까?', category: 'inattention' },
  { id: 10, text: '집이나 직장에서 물건을 잘못 놓거나 찾기 어려운 것이 얼마나 자주 있습니까?', category: 'inattention' },
  { id: 11, text: '주위의 활동이나 소음에 주의가 흐트러지는 것이 얼마나 자주 있습니까?', category: 'inattention' },
  { id: 12, text: '회의나 다른 상황에서 가만히 앉아있기 어려운 것이 얼마나 자주 있습니까?', category: 'hyperactivity' },
  { id: 13, text: '안절부절못하거나 가만히 있기 어려운 느낌이 얼마나 자주 있습니까?', category: 'hyperactivity' },
  { id: 14, text: '여유시간이 있을 때 편하게 쉬거나 긴장을 푸는 것이 얼마나 자주 어렵습니까?', category: 'hyperactivity' },
  { id: 15, text: '사회적인 상황에서 너무 많이 말하는 것이 얼마나 자주 있습니까?', category: 'impulsivity' },
  { id: 16, text: '대화 중에 상대방의 말이 끝나기 전에 말을 가로채는 것이 얼마나 자주 있습니까?', category: 'impulsivity' },
  { id: 17, text: '차례를 기다려야 할 때 기다리기 어려운 것이 얼마나 자주 있습니까?', category: 'impulsivity' },
  { id: 18, text: '다른 사람이 바쁠 때 방해하는 것이 얼마나 자주 있습니까?', category: 'impulsivity' },
]

export const ASRS_OPTIONS = [
  { value: 0, label: '전혀 그렇지 않다' },
  { value: 1, label: '거의 그렇지 않다' },
  { value: 2, label: '가끔 그렇다' },
  { value: 3, label: '자주 그렇다' },
  { value: 4, label: '매우 자주 그렇다' },
]

// ===== 코칭 효과 측정 설문 (사전/사후) =====
export const SURVEY_CATEGORIES = [
  {
    id: 'execution',
    name: '실행력',
    icon: 'Zap',
    color: 'blue',
    questions: [
      { id: 'e1', text: '나는 해야 할 일을 시작하는 데 어려움을 느낀다.', reverseScore: true },
      { id: 'e2', text: '나는 작은 일도 미루다가 커지게 만드는 경우가 많다.', reverseScore: true },
      { id: 'e3', text: '나는 계획한 일을 실제 행동으로 옮기는 데 어려움이 있다.', reverseScore: true },
    ]
  },
  {
    id: 'routine',
    name: '루틴',
    icon: 'RefreshCw',
    color: 'green',
    questions: [
      { id: 'r1', text: '나는 일정한 수면/기상 루틴을 유지하기 어렵다.', reverseScore: true },
      { id: 'r2', text: '나는 하루 계획을 세워도 자주 무너진다.', reverseScore: true },
      { id: 'r3', text: '나는 반복되는 생활 습관을 유지하기 어렵다.', reverseScore: true },
    ]
  },
  {
    id: 'time',
    name: '시간관리',
    icon: 'Clock',
    color: 'amber',
    questions: [
      { id: 't1', text: '나는 시간이 얼마나 걸릴지 예측하기 어렵다.', reverseScore: true },
      { id: 't2', text: '나는 약속이나 마감 시간을 자주 놓친다.', reverseScore: true },
      { id: 't3', text: '나는 해야 할 일을 우선순위대로 정리하기 어렵다.', reverseScore: true },
    ]
  },
  {
    id: 'efficacy',
    name: '자기효능감',
    icon: 'Star',
    color: 'purple',
    questions: [
      { id: 'ef1', text: '나는 작은 목표를 달성할 수 있다는 믿음이 있다.', reverseScore: false },
      { id: 'ef2', text: '나는 실패해도 다시 시작할 수 있다고 느낀다.', reverseScore: false },
      { id: 'ef3', text: '나는 나에게 맞는 실행 방법을 찾아갈 수 있다고 느낀다.', reverseScore: false },
    ]
  },
  {
    id: 'career',
    name: '커리어/삶의 방향',
    icon: 'Compass',
    color: 'rose',
    questions: [
      { id: 'c1', text: '나는 앞으로 어떤 방향으로 가야 할지 어느 정도 알고 있다.', reverseScore: false },
      { id: 'c2', text: '나는 내 강점과 약점을 설명할 수 있다.', reverseScore: false },
      { id: 'c3', text: '나는 지금 내 삶에서 가장 중요한 목표를 말할 수 있다.', reverseScore: false },
    ]
  }
]

// 사후 설문 추가 문항
export const POST_SURVEY_EXTRA = [
  { id: 'p1', text: '이번 코칭이 나의 실행력에 도움이 되었다.' },
  { id: 'p2', text: '코치와의 관계가 안전하고 신뢰롭게 느껴졌다.' },
  { id: 'p3', text: '다음에도 유료로 참여할 의향이 있다.' },
  { id: 'p4', text: '다른 사람에게 추천할 의향이 있다.' },
]

// ===== 점수 계산 유틸리티 =====
export function calcScore(raw, reverse) {
  return reverse ? (6 - raw) : raw
}

export function calcCategoryScores(answers) {
  const result = {}
  SURVEY_CATEGORIES.forEach(cat => {
    const scores = cat.questions.map(q => calcScore(answers[q.id] || 3, q.reverseScore))
    result[cat.id] = {
      name: cat.name,
      average: scores.reduce((a, b) => a + b, 0) / scores.length
    }
  })
  const all = Object.values(result).map(c => c.average)
  result.total = all.reduce((a, b) => a + b, 0) / all.length
  return result
}

export function calcASRSScores(answers, testMode = 'full') {
  const questionsToUse = testMode === 'quick' ? ASRS_QUESTIONS.slice(0, 6) : ASRS_QUESTIONS
  let totalScore = 0
  let inattentionScore = 0
  let hyperactivityScore = 0
  let impulsivityScore = 0

  questionsToUse.forEach((q) => {
    const answer = answers[q.id]
    if (answer !== undefined) {
      totalScore += answer
      if (q.category === 'inattention') inattentionScore += answer
      else if (q.category === 'hyperactivity') hyperactivityScore += answer
      else if (q.category === 'impulsivity') impulsivityScore += answer
    }
  })

  const maxScore = questionsToUse.length * 4
  let level, interpretation

  if (testMode === 'quick') {
    const highCount = Object.values(answers).filter(v => v >= 2).length
    if (highCount >= 4) {
      level = 'high'
      interpretation = 'ADHD 가능성이 높습니다'
    } else if (highCount >= 2) {
      level = 'medium'
      interpretation = 'ADHD 가능성이 있습니다'
    } else {
      level = 'low'
      interpretation = 'ADHD 가능성이 낮습니다'
    }
  } else {
    const percentage = (totalScore / maxScore) * 100
    if (percentage >= 50) {
      level = 'high'
      interpretation = 'ADHD 가능성이 높습니다'
    } else if (percentage >= 30) {
      level = 'medium'
      interpretation = 'ADHD 가능성이 있습니다'
    } else {
      level = 'low'
      interpretation = 'ADHD 가능성이 낮습니다'
    }
  }

  return {
    totalScore,
    maxScore,
    inattentionScore,
    hyperactivityScore,
    impulsivityScore,
    level,
    interpretation
  }
}
