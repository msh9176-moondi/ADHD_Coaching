// ===== 패키지 데이터 =====
export const PACKAGES = {
  starter: {
    id: 'starter',
    name: '스타터',
    sessions: 3,
    icon: '🚀',
    description: '빠른 문제 해결이 필요할 때',
    features: ['단일 주제 집중', '격일 진행', '1주 완성'],
    recommended: false
  },
  basic: {
    id: 'basic',
    name: '베이직',
    sessions: 5,
    icon: '⭐',
    description: '루틴 정착과 습관 형성',
    features: ['1~2개 주제 집중', '주 3회 격일 진행', '2주 완성'],
    recommended: true
  },
  premium: {
    id: 'premium',
    name: '프리미엄',
    sessions: 10,
    icon: '💎',
    description: '깊이 있는 변화와 성장',
    features: ['3개 주제 모두 다룸', '주 3회 격일 진행', '4주 완성'],
    recommended: false
  }
}

export function getPackage(id) {
  return PACKAGES[id]
}

// ===== 유형 분석 데이터 =====
export const ADHD_TYPES = {
  inattention: {
    id: 'inattention',
    name: '주의력 결핍형',
    icon: 'Brain',
    color: 'purple',
    description: '집중을 유지하거나 세부사항에 주의를 기울이는 것이 어려운 유형입니다.',
    characteristics: [
      '업무나 과제에서 부주의한 실수가 잦음',
      '대화 중 딴생각을 하거나 듣지 못한 것처럼 보임',
      '물건을 자주 잃어버리거나 약속을 잊음',
      '체계적인 정리나 순서대로 일하는 것이 어려움'
    ],
    coachingDirection: '작은 단위로 과제를 나누고, 외부 알림과 체크리스트를 활용하는 전략이 효과적입니다.',
    recommendedActions: [
      '하루 3가지 핵심 할 일만 정하기',
      '타이머를 활용한 집중 시간 설정',
      '물건 지정석 만들기',
      '메모 습관 들이기'
    ]
  },
  hyperactivity: {
    id: 'hyperactivity',
    name: '과잉행동형',
    icon: 'Zap',
    color: 'orange',
    description: '가만히 있기 어렵고 끊임없이 움직이거나 활동해야 하는 유형입니다.',
    characteristics: [
      '오래 앉아 있기가 힘들고 자꾸 움직이고 싶음',
      '쉬는 시간에도 편하게 쉬지 못함',
      '손이나 발을 계속 움직이거나 만지작거림',
      '에너지가 넘치고 뭔가를 하지 않으면 답답함'
    ],
    coachingDirection: '에너지를 생산적으로 발산할 수 있는 루틴과 활동을 설계합니다.',
    recommendedActions: [
      '업무 사이 짧은 신체 활동 삽입',
      '스탠딩 데스크나 운동 도구 활용',
      '에너지 발산용 취미 활동 찾기',
      '명상이나 호흡 연습으로 진정하기'
    ]
  },
  impulsivity: {
    id: 'impulsivity',
    name: '충동형',
    icon: 'AlertTriangle',
    color: 'red',
    description: '생각하기 전에 행동하거나 말하는 경향이 있는 유형입니다.',
    characteristics: [
      '말이 끝나기 전에 끼어들거나 대답함',
      '차례를 기다리기 어려움',
      '결과를 생각하지 않고 즉흥적으로 결정',
      '감정 조절이 어려울 때가 있음'
    ],
    coachingDirection: '멈추고 생각하는 습관과 감정 조절 전략을 함께 연습합니다.',
    recommendedActions: [
      '결정 전 10초 멈추기 연습',
      '중요한 결정은 하루 뒤로 미루기',
      '감정 일기 쓰기',
      '대화 중 메모하며 듣기'
    ]
  },
  combined: {
    id: 'combined',
    name: '복합형',
    icon: 'Layers',
    color: 'blue',
    description: '주의력 결핍, 과잉행동, 충동성이 복합적으로 나타나는 유형입니다.',
    characteristics: [
      '여러 영역에서 고르게 어려움을 경험',
      '상황에 따라 다른 특성이 더 강하게 나타남',
      '일상생활 전반에 영향을 미침'
    ],
    coachingDirection: '가장 힘든 영역을 우선 파악하고, 단계적으로 전략을 적용해 나갑니다.',
    recommendedActions: [
      '가장 어려운 영역 1개 선택해 집중',
      '작은 성공 경험 쌓기',
      '자신만의 대처 전략 발견하기',
      '정기적인 점검과 조정'
    ]
  }
}

// 설문 결과 기반 코칭 영역 분석
export const COACHING_AREAS = {
  execution: {
    name: '실행력',
    lowScoreMessage: '시작하는 것이 가장 어려운 부분이네요.',
    direction: '작은 행동부터 시작하고, 시작의 장벽을 낮추는 전략을 함께 만들어갑니다.',
    tips: ['2분 규칙 적용하기', '시작 의식 만들기', '환경 미리 세팅하기']
  },
  routine: {
    name: '루틴',
    lowScoreMessage: '일정한 생활 패턴을 유지하기 어려우시군요.',
    direction: '무너져도 다시 시작할 수 있는 유연한 루틴을 설계합니다.',
    tips: ['최소 루틴 정하기', '앵커 습관 활용하기', '완벽하지 않아도 OK']
  },
  time: {
    name: '시간관리',
    lowScoreMessage: '시간 감각이나 우선순위 정리가 어려우시네요.',
    direction: '시간 추정 연습과 외부 도구를 활용한 관리 전략을 익힙니다.',
    tips: ['시간 추정 후 실제 비교하기', '타임 블로킹', '버퍼 시간 넣기']
  },
  efficacy: {
    name: '자기효능감',
    lowScoreMessage: '스스로에 대한 믿음이 낮아진 상태예요.',
    direction: '작은 성공 경험을 쌓아 자신감을 회복해 나갑니다.',
    tips: ['할 수 있는 것부터 시작', '성공 기록 남기기', '자기 대화 바꾸기']
  },
  career: {
    name: '커리어/삶의 방향',
    lowScoreMessage: '앞으로의 방향에 대한 고민이 있으시네요.',
    direction: '강점을 발견하고 의미 있는 목표를 함께 탐색합니다.',
    tips: ['강점 탐색하기', '가치관 정리하기', '작은 실험해보기']
  }
}

// ASRS 점수로 주요 유형 판별
export function analyzeADHDType(asrsScores) {
  if (!asrsScores) return null

  const { inattentionScore, hyperactivityScore, impulsivityScore, totalScore, maxScore } = asrsScores

  // 점수 비율 계산
  const inattentionRatio = inattentionScore / (maxScore * 0.5) // 주의력 문항 비율
  const hyperactivityRatio = hyperactivityScore / (maxScore * 0.28)
  const impulsivityRatio = impulsivityScore / (maxScore * 0.22)

  // 가장 높은 영역 찾기
  const scores = [
    { type: 'inattention', score: inattentionRatio },
    { type: 'hyperactivity', score: hyperactivityRatio },
    { type: 'impulsivity', score: impulsivityRatio }
  ]

  const sorted = scores.sort((a, b) => b.score - a.score)

  // 복합형 판단: 두 영역 이상이 비슷하게 높을 경우
  if (sorted[0].score > 0.4 && sorted[1].score > 0.35) {
    return {
      primaryType: 'combined',
      subTypes: sorted.slice(0, 2).map(s => s.type),
      scores: { inattentionRatio, hyperactivityRatio, impulsivityRatio }
    }
  }

  return {
    primaryType: sorted[0].type,
    subTypes: [],
    scores: { inattentionRatio, hyperactivityRatio, impulsivityRatio }
  }
}

// 설문 점수로 코칭 우선순위 영역 분석
export function analyzeCoachingPriorities(categoryScores) {
  if (!categoryScores) return []

  console.log('categoryScores 원본:', categoryScores)

  const areas = Object.entries(categoryScores)
    .filter(([key]) => key !== 'total')
    .map(([key, value]) => {
      const coachingArea = COACHING_AREAS[key] || {}
      console.log(`key: ${key}, value:`, value, 'coachingArea:', coachingArea)
      return {
        id: key,
        score: value.average,
        ...coachingArea,
        // name은 COACHING_AREAS에서 우선 사용, 없으면 value.name 사용
        name: coachingArea.name || value.name || key
      }
    })
    .sort((a, b) => a.score - b.score) // 낮은 점수가 더 필요한 영역

  console.log('최종 areas:', areas)
  return areas
}
