/**
 * Ultra Mind Solution 분석 서비스
 * 코치-피코치 대화를 분석하여 7 Keys 카테고리 기반 체크리스트 추천
 */

import { symptomToChecklistMap, checklistCategories, ultramindChecklists } from '../data/ultramindChecklists'

// 7 Keys 카테고리별 증상 키워드 매핑
const categorySymptomMap = {
  nutrition: [
    '집중력', '집중', 'adhd', '우울', '무기력', '에너지', '수면', '불면', '불안', '긴장',
    '기억력', '건망증', '피부건조', '탈모', '손톱', '관절', '비타민', '영양', '보충제'
  ],
  hormone: [
    '호르몬', '갑상선', '인슐린', '혈당', '당뇨', '생리', '월경', 'pms', '갱년기', '폐경',
    '성욕', '발기', '체중증가', '살찜', '추위', '더위', '땀', '불임'
  ],
  inflammation: [
    '염증', '알레르기', '알러지', '관절염', '아토피', '자가면역', '통증', '부종', '두통', '편두통'
  ],
  gut: [
    '소화', '위장', '복통', '변비', '설사', '가스', '더부룩', '복부팽만', '장', '과민성대장',
    '속쓰림', '역류', '헛배', '잦은방귀'
  ],
  toxicity: [
    '독소', '해독', '디톡스', '화학물질', '중금속', '수은', '아말감', '환경', '피로', '두통',
    '집중력저하', '기억력저하'
  ],
  energy: [
    '피로', '피곤', '만성피로', '에너지부족', '활력', '지침', '무기력', '기력', '미토콘드리아',
    '산화', '노화', '근육약화'
  ],
  stress: [
    '스트레스', '불안', '걱정', '긴장', '공황', '트라우마', '번아웃', '과로', '수면장애',
    '불면', '악몽', '예민', '신경과민', '부신'
  ]
}

// 증상 키워드 매핑 (한국어 → 영어 키)
const koreanSymptomKeywords = {
  // 집중력/ADHD 관련
  '집중': 'concentration',
  '집중력': 'concentration',
  '산만': 'concentration',
  '주의력': 'concentration',
  'adhd': 'adhd',
  '과잉행동': 'adhd',

  // 피로/에너지
  '피로': 'fatigue',
  '피곤': 'fatigue',
  '무기력': 'fatigue',
  '에너지': 'energy',
  '활력': 'energy',
  '지침': 'fatigue',

  // 수면
  '수면': 'sleep',
  '불면': 'sleep',
  '잠': 'sleep',
  '숙면': 'sleep',

  // 기분/우울
  '우울': 'depression',
  '우울감': 'depression',
  '기분': 'mood',
  '감정': 'mood',
  '짜증': 'irritability',
  '분노': 'irritability',

  // 불안
  '불안': 'anxiety',
  '걱정': 'anxiety',
  '긴장': 'anxiety',
  '초조': 'anxiety',
  '스트레스': 'stress',

  // 기억력
  '기억': 'memory',
  '기억력': 'memory',
  '건망증': 'memory',
  '인지': 'cognition',

  // 소화
  '소화': 'digestion',
  '위장': 'digestion',
  '복통': 'digestion',
  '변비': 'digestion',
  '설사': 'digestion',
  '가스': 'digestion',
  '더부룩': 'digestion',

  // 체중
  '체중': 'weight',
  '살': 'weight',
  '다이어트': 'weight',
  '비만': 'weight',

  // 두통
  '두통': 'headache',
  '머리아픔': 'headache',
  '편두통': 'headache',

  // 피부
  '피부': 'skin',
  '여드름': 'skin',
  '습진': 'skin',
  '가려움': 'skin',

  // 알레르기/면역
  '알레르기': 'allergies',
  '알러지': 'allergies',
  '면역': 'immunity',
  '감기': 'immunity',

  // 관절/근육
  '관절': 'joints',
  '근육': 'muscle',
  '통증': 'pain',

  // 갑상선/호르몬
  '갑상선': 'thyroid',
  '호르몬': 'hormones',
  '생리': 'menstrual',
  '월경': 'menstrual',
  'pms': 'menstrual',
  '갱년기': 'menopause',

  // 혈당
  '혈당': 'bloodSugar',
  '당뇨': 'bloodSugar',
  '인슐린': 'bloodSugar',

  // 독소/해독
  '독소': 'toxins',
  '해독': 'detox',
  '디톡스': 'detox'
}

/**
 * 대화 내용에서 증상 키워드 추출
 */
export function extractSymptoms(conversationText) {
  const text = conversationText.toLowerCase()
  const foundSymptoms = new Set()

  for (const [korean, english] of Object.entries(koreanSymptomKeywords)) {
    if (text.includes(korean.toLowerCase())) {
      foundSymptoms.add(english)
    }
  }

  return Array.from(foundSymptoms)
}

/**
 * 대화 내용에서 7 Keys 카테고리 추천
 * @returns {Array} 카테고리별 점수와 추천 이유
 */
export function recommendCategories(conversationText) {
  const text = conversationText.toLowerCase()
  const categoryScores = {}

  // 각 카테고리별로 매칭되는 키워드 수 계산
  for (const [categoryId, keywords] of Object.entries(categorySymptomMap)) {
    const matchedKeywords = keywords.filter(keyword =>
      text.includes(keyword.toLowerCase())
    )

    if (matchedKeywords.length > 0) {
      categoryScores[categoryId] = {
        score: matchedKeywords.length,
        matchedKeywords,
        category: checklistCategories[categoryId]
      }
    }
  }

  // 점수순 정렬
  const sorted = Object.entries(categoryScores)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([id, data]) => ({
      categoryId: id,
      categoryName: data.category?.name || id,
      icon: data.category?.icon || '📋',
      description: data.category?.description || '',
      score: data.score,
      matchedKeywords: data.matchedKeywords,
      checklists: data.category?.checklists || []
    }))

  return sorted
}

/**
 * 카테고리 내 세부 체크리스트 추천
 */
export function recommendChecklistsInCategory(categoryId, conversationText) {
  const category = checklistCategories[categoryId]
  if (!category) return []

  const text = conversationText.toLowerCase()
  const recommendations = []

  for (const checklistId of category.checklists) {
    const checklist = ultramindChecklists[checklistId]
    if (!checklist) continue

    // 관련 증상 키워드 매칭
    const relatedSymptoms = checklist.relatedSymptoms || []
    const matchedSymptoms = relatedSymptoms.filter(symptom =>
      text.includes(symptom.toLowerCase())
    )

    recommendations.push({
      checklistId,
      name: checklist.name,
      description: checklist.description,
      matchScore: matchedSymptoms.length,
      matchedSymptoms,
      questionCount: checklist.questions?.length || 0
    })
  }

  // 매칭 점수순 정렬
  return recommendations.sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * 증상에 따른 체크리스트 추천
 */
export function recommendChecklists(symptoms) {
  const recommendations = new Map() // checklistId -> { score, reasons }

  for (const symptom of symptoms) {
    const checklistIds = symptomToChecklistMap[symptom] || []
    for (const id of checklistIds) {
      if (!recommendations.has(id)) {
        recommendations.set(id, { score: 0, reasons: [] })
      }
      const rec = recommendations.get(id)
      rec.score += 1
      rec.reasons.push(symptom)
    }
  }

  // 점수순 정렬
  const sorted = Array.from(recommendations.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .map(([id, data]) => ({
      checklistId: id,
      checklist: ultramindChecklists[id],
      score: data.score,
      reasons: data.reasons
    }))

  return sorted
}

/**
 * AI 분석을 위한 시스템 프롬프트 생성 (7 Keys 카테고리 기반)
 */
export function generateAnalysisPrompt(conversationHistory) {
  const categorySummary = Object.entries(checklistCategories)
    .map(([id, cat]) => `- ${id}: ${cat.icon} ${cat.name} - ${cat.description} (체크리스트: ${cat.checklists.join(', ')})`)
    .join('\n')

  return `당신은 Ultra Mind Solution 7 Keys 기반의 건강 분석 전문가입니다.
코치와 피코치 간의 대화를 분석하여 피코치에게 필요한 건강 평가 카테고리를 추천해주세요.

## Ultra Mind Solution 7 Keys 카테고리:
${categorySummary}

## 분석 지침:
1. 대화에서 언급된 신체적, 정신적 증상을 파악하세요
2. 생활습관, 식습관, 스트레스 요인을 확인하세요
3. 7 Keys 카테고리 중 관련성이 높은 것을 우선순위에 따라 추천하세요
4. 최소 1개, 최대 3개의 카테고리를 추천하세요

## 대화 내용:
${conversationHistory}

## 응답 형식 (JSON):
{
  "analysis": {
    "mainSymptoms": ["주요 증상 목록"],
    "lifestyleFactors": ["생활습관 요인"],
    "stressFactors": ["스트레스 요인"]
  },
  "recommendedCategories": [
    {
      "categoryId": "카테고리 ID (nutrition/hormone/inflammation/gut/toxicity/energy/stress)",
      "priority": 1,
      "reason": "추천 이유"
    }
  ],
  "summary": "전반적인 분석 요약 (2-3문장)"
}`
}

/**
 * 대화 내용을 분석하여 7 Keys 카테고리 추천 (로컬 분석)
 * AI API 없이 키워드 기반으로 분석
 */
export function analyzeConversationLocal(messages) {
  // 모든 메시지 텍스트 합치기
  const allText = messages
    .map(m => typeof m === 'string' ? m : m.content)
    .join(' ')

  // 7 Keys 카테고리 추천
  const categories = recommendCategories(allText)

  // 상위 3개 카테고리
  const topCategories = categories.slice(0, 3)

  // 각 카테고리별 세부 체크리스트 추천
  const categoryWithChecklists = topCategories.map(cat => ({
    ...cat,
    recommendedChecklists: recommendChecklistsInCategory(cat.categoryId, allText)
  }))

  // 증상 추출 (기존 호환성)
  const symptoms = extractSymptoms(allText)

  return {
    symptoms,
    recommendedCategories: categoryWithChecklists,
    // 기존 호환성을 위해 recommendations도 유지
    recommendations: categoryWithChecklists.flatMap(cat =>
      cat.recommendedChecklists.map(cl => ({
        checklistId: cl.checklistId,
        checklist: ultramindChecklists[cl.checklistId],
        score: cl.matchScore,
        reasons: cl.matchedSymptoms
      }))
    ).slice(0, 5),
    analysisType: 'local'
  }
}

/**
 * AI API를 통한 대화 분석 (Ollama 또는 외부 API)
 */
export async function analyzeConversationWithAI(messages, aiEndpoint = null) {
  const conversationText = messages
    .map(m => {
      const role = m.sender_role || m.sender || 'unknown'
      const content = m.content || ''
      return `[${role}]: ${content}`
    })
    .join('\n')

  const prompt = generateAnalysisPrompt(conversationText)

  // AI 엔드포인트가 없으면 로컬 분석으로 폴백
  if (!aiEndpoint) {
    console.log('[UltramindAnalysis] AI 엔드포인트 없음, 로컬 분석으로 진행')
    return analyzeConversationLocal(messages)
  }

  try {
    const response = await fetch(aiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`AI 응답 오류: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.response || data.message?.content || ''

    // JSON 파싱 시도
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        ...parsed,
        analysisType: 'ai'
      }
    }

    // JSON 파싱 실패 시 로컬 분석으로 폴백
    return analyzeConversationLocal(messages)

  } catch (error) {
    console.error('[UltramindAnalysis] AI 분석 실패:', error)
    return analyzeConversationLocal(messages)
  }
}

/**
 * 체크리스트 결과에 따른 처방 생성
 */
export function generatePrescription(checklistResults) {
  const prescriptions = []

  for (const result of checklistResults) {
    const checklist = ultramindChecklists[result.checklistId]
    if (!checklist) continue

    const { score, maxScore } = result
    const percentage = (score / maxScore) * 100

    // 심각도 판단
    let severity = 'low'
    if (percentage >= 70) severity = 'high'
    else if (percentage >= 40) severity = 'medium'

    // 자가 관리 추천 추출
    const selfCare = checklist.selfCare || {}

    prescriptions.push({
      checklistId: result.checklistId,
      checklistName: checklist.name || result.checklistName || result.checklistId,
      category: checklist.category,
      score,
      maxScore,
      percentage: Math.round(percentage),
      severity,
      recommendations: {
        diet: selfCare.foods || selfCare.diet || [],
        supplements: severity !== 'low' ? (selfCare.supplements || []) : [],
        lifestyle: selfCare.lifestyle || [],
        avoidances: selfCare.avoidances || selfCare.caution ? [selfCare.caution] : []
      }
    })
  }

  return prescriptions
}

/**
 * 6주 프로그램 생성 (Ultra Mind Solution 기반)
 * 검사 결과를 분석하여 개인 맞춤형 6주 프로그램 생성
 * @param {Array} prescriptions - 처방 목록
 * @param {Object} userProfile - 사용자 프로필 (hasCoachAccess, tdeeData 등)
 */
export function generate6WeekProgram(prescriptions, userProfile = {}) {
  // TDEE 데이터 추출
  const tdeeData = userProfile.tdeeData || null
  // 심각도별 분류
  const highSeverity = prescriptions.filter(rx => rx.severity === 'high')
  const mediumSeverity = prescriptions.filter(rx => rx.severity === 'medium')
  const allIssues = [...highSeverity, ...mediumSeverity]

  // 카테고리별 분류
  const categoryIssues = {
    nutrition: prescriptions.filter(rx => ['fattyAcids', 'vitaminD', 'magnesium', 'zinc', 'methylation'].includes(rx.checklistId)),
    neurotransmitter: prescriptions.filter(rx => ['dopamine', 'serotonin', 'gaba', 'acetylcholine'].includes(rx.checklistId)),
    hormone: prescriptions.filter(rx => ['insulin', 'thyroid', 'sexHormonesFemale', 'sexHormonesMale'].includes(rx.checklistId)),
    gut: prescriptions.filter(rx => rx.checklistId === 'gutHealth'),
    inflammation: prescriptions.filter(rx => rx.checklistId === 'inflammation'),
    toxicity: prescriptions.filter(rx => rx.checklistId === 'toxicity'),
    energy: prescriptions.filter(rx => ['energy', 'oxidativeStress'].includes(rx.checklistId)),
    stress: prescriptions.filter(rx => rx.checklistId === 'stress')
  }

  // === 기본 보충제 (모든 사람에게 권장) ===
  const baseSupplements = [
    '종합비타민 & 미네랄 (아침/저녁 식사와 함께)',
    '칼슘 600-800mg + 마그네슘 400-600mg',
    '비타민 D3 2,000IU (아침)',
    '오메가-3 지방산 1,000mg (아침/저녁)',
    '프로바이오틱스 (공복 또는 식사와 함께)'
  ]

  // === 맞춤 보충제 추가 ===
  const customSupplements = []

  // 메틸화 문제
  if (categoryIssues.nutrition.some(rx => rx.checklistId === 'methylation' && rx.severity !== 'low')) {
    customSupplements.push('엽산 800ug (활성형 5-MTHF 400ug 포함)')
    customSupplements.push('비타민 B6 50mg + B12 1,000ug (메틸코발라민)')
  }

  // 마그네슘 부족
  if (categoryIssues.nutrition.some(rx => rx.checklistId === 'magnesium' && rx.severity === 'high')) {
    customSupplements.push('마그네슘 글리시네이트 추가 200mg (취침 전)')
  }

  // 신경전달물질 불균형
  if (categoryIssues.neurotransmitter.some(rx => rx.severity === 'high')) {
    customSupplements.push('L-테아닌 200mg (스트레스 시)')
  }

  // === 개인 맞춤 식단 권장사항 ===
  const dietRecommendations = {
    mustEat: [
      '유기농 비가공 자연식품',
      '천연색 과일과 채소 (하루 5-9회)',
      '오메가-3 풍부한 생선 (연어, 정어리, 청어)',
      '견과류와 씨앗 (아몬드, 호두, 아마씨)',
      '콩류 (렌즈콩, 이집트콩, 에다마메)'
    ],
    mustAvoid: [
      '글루텐 (밀, 보리, 호밀) - 6주간 완전 제거',
      '유제품 (우유, 치즈, 요구르트) - 6주간 완전 제거',
      '설탕 및 고과당 옥수수시럽',
      '가공식품, 인스턴트 식품',
      '트랜스지방, 경화유',
      '카페인 (서서히 줄이기)',
      '알코올'
    ],
    specific: []
  }

  // 카테고리별 맞춤 식단 추가
  if (categoryIssues.neurotransmitter.some(rx => rx.checklistId === 'dopamine' && rx.severity !== 'low')) {
    dietRecommendations.specific.push('도파민: 단백질 풍부한 아침 (달걀, 생선), 바나나, 아보카도')
  }
  if (categoryIssues.neurotransmitter.some(rx => rx.checklistId === 'serotonin' && rx.severity !== 'low')) {
    dietRecommendations.specific.push('세로토닌: 트립토판 식품 (칠면조, 닭고기, 견과류), 복합 탄수화물')
  }
  if (categoryIssues.gut.length > 0 && categoryIssues.gut[0].severity !== 'low') {
    dietRecommendations.specific.push('장건강: 발효식품 (김치, 사우어크라우트), 섬유질 30-50g/일')
  }
  if (categoryIssues.inflammation.length > 0 && categoryIssues.inflammation[0].severity !== 'low') {
    dietRecommendations.specific.push('항염증: 심황, 생강, 베리류, 녹색잎채소, 다크초콜릿(70%)')
  }

  // === 준비 주간 (시작 전 1주) ===
  const preparationWeek = {
    title: '준비 주간',
    subtitle: '몸과 마음을 6주 여정에 준비시키는 시간',
    duration: '프로그램 시작 1주 전',
    goals: [
      '카페인 섭취량 절반으로 줄이기',
      '설탕, 가공식품 서서히 줄이기',
      '글루텐, 유제품 줄이기 시작',
      '물 하루 6-8잔 마시기 습관들이기'
    ],
    warnings: [
      '두통, 피로감, 짜증 등 금단 증상이 나타날 수 있음',
      '이는 독소가 배출되는 좋은 신호',
      '충분한 수분 섭취로 증상 완화 가능'
    ]
  }

  // === 6주 프로그램 단계별 구성 ===
  const phases = [
    {
      week: '1주차',
      title: '해독과 정화',
      focus: '독소 제거 및 알레르기 음식 완전 차단',
      goals: [
        '글루텐 & 유제품 100% 제거',
        '설탕, 카페인, 알코올 완전 차단',
        '기본 보충제 루틴 시작',
        '하루 30분 걷기 시작'
      ],
      tasks: [
        { category: '식단', items: ['아침: 단백질 쉐이크 또는 오메가-3 달걀', '글루텐 프리 식단으로 전환', '가공식품 완전 제거'] },
        { category: '보충제', items: baseSupplements.slice(0, 3) },
        { category: '생활습관', items: ['복식호흡 하루 5회', '30분 걷기', '취침 전 목욕'] }
      ],
      dailyChecklist: [
        '글루텐/유제품 섭취하지 않음',
        '물 6잔 이상 마심',
        '30분 걷기 완료',
        '복식호흡 5회 실시'
      ]
    },
    {
      week: '2주차',
      title: '영양 기초 세우기',
      focus: '필수 영양소 보충 및 식단 안정화',
      goals: [
        '전체 보충제 루틴 확립',
        '4시간마다 규칙적인 식사',
        '단백질 매 식사 포함',
        '수면 루틴 개선'
      ],
      tasks: [
        { category: '식단', items: ['매 식사 단백질 포함', '오전/오후 건강한 간식', '저녁 7시 이전 식사 완료'] },
        { category: '보충제', items: [...baseSupplements, ...customSupplements.slice(0, 2)] },
        { category: '생활습관', items: ['수면 시간 일정하게', '취침 2시간 전 음식 금지', '전자기기 1시간 전 차단'] }
      ],
      dailyChecklist: [
        '4시간마다 식사/간식',
        '모든 보충제 복용',
        '취침 시간 준수',
        '복식호흡 5회'
      ]
    },
    {
      week: '3주차',
      title: '운동과 이완',
      focus: '신체 활동 강화 및 스트레스 관리',
      goals: [
        '운동 강도 높이기 (유산소 + 근력)',
        '명상/이완 시간 늘리기',
        '뇌 훈련 시작',
        '사우나/목욕으로 해독 촉진'
      ],
      tasks: [
        { category: '운동', items: ['유산소 운동 주 5회', '근력 운동 주 2-3회', '저녁 식전 30분 걷기'] },
        { category: '이완', items: ['명상 또는 깊은 이완 30분', '뜨거운 목욕 (미네랄 소금 + 라벤더)', '뇌 훈련 (퍼즐, 새로운 학습)'] },
        { category: '해독', items: ['사우나 주 2회', '피부 브러싱', '충분한 수분 섭취'] }
      ],
      dailyChecklist: [
        '30분 이상 신체 활동',
        '이완/명상 실천',
        '뇌 훈련 활동',
        '충분한 수분'
      ]
    },
    {
      week: '4주차',
      title: '심화 치유',
      focus: '개인별 핵심 문제 집중 해결',
      goals: [
        '고심각도 영역 집중 관리',
        '맞춤 보충제 최적화',
        '식단 미세 조정',
        '생활 패턴 점검'
      ],
      tasks: generateWeek4Tasks(highSeverity, customSupplements),
      dailyChecklist: [
        '핵심 영역 관리 실천',
        '증상 변화 기록',
        '에너지 레벨 체크',
        '수면 질 평가'
      ]
    },
    {
      week: '5주차',
      title: '통합과 강화',
      focus: '모든 습관 통합 및 효과 극대화',
      goals: [
        '모든 건강 습관 일상화',
        '에너지와 집중력 최적화',
        '스트레스 대응력 강화',
        '전반적인 웰빙 향상'
      ],
      tasks: [
        { category: '통합 관리', items: ['모든 루틴 자동화 수준으로', '증상 개선 점검', '필요시 보충제 조정'] },
        { category: '최적화', items: ['최적의 수면 시간 찾기', '가장 효과적인 운동 패턴 확립', '스트레스 트리거 파악 및 대응'] },
        { category: '강화', items: ['사회적 연결 강화', '즐거운 활동 늘리기', '자연 속 시간 늘리기'] }
      ],
      dailyChecklist: [
        '전체 루틴 완료',
        '기분/에너지 평가',
        '긍정적 활동 1가지',
        '감사 일기'
      ]
    },
    {
      week: '6주차',
      title: '안정화와 유지',
      focus: '장기 유지 계획 수립 및 평가',
      goals: [
        '6주 성과 종합 평가',
        '장기 유지 계획 수립',
        '글루텐/유제품 재도입 여부 결정',
        '다음 단계 설정'
      ],
      tasks: [
        { category: '평가', items: ['초기 증상과 현재 비교', '체크리스트 재실시', '개선점과 유지점 정리'] },
        { category: '계획', items: ['평생 유지할 핵심 습관 선정', '선택적 음식 재도입 계획', '월간 점검 일정 설정'] },
        { category: '다음 단계', items: ['필요시 전문가 상담', '지속적인 학습 계획', '지원 시스템 구축'] }
      ],
      dailyChecklist: [
        '성취 기록',
        '유지 계획 검토',
        '다음 목표 설정',
        '자기 격려'
      ]
    }
  ]

  // === 일일 루틴 (시간대별) ===
  const dailyRoutine = {
    wakeUp: {
      time: '기상 직후',
      tasks: [
        '복식호흡 5회',
        '물 한 잔 마시기',
        '가벼운 스트레칭 10분'
      ]
    },
    morning: {
      time: '오전 7-9시',
      tasks: [
        '아침 식사 (단백질 필수)',
        '보충제 복용 (종합비타민, 칼슘/마그네슘, 비타민D, 오메가-3)',
        '복식호흡',
        '햇볕 쬐기 20분'
      ]
    },
    midMorning: {
      time: '오전 10-11시',
      tasks: [
        '건강한 간식 (견과류, 과일)',
        '물 마시기',
        '짧은 휴식'
      ]
    },
    lunch: {
      time: '정오-오후 1시',
      tasks: [
        '점심 식사 (채소 2컵 + 단백질 + 현미)',
        '복식호흡',
        '10분 산책'
      ]
    },
    afternoon: {
      time: '오후 2-3시',
      tasks: [
        '오후 간식',
        '물 마시기',
        '뇌 훈련 활동'
      ]
    },
    preDinner: {
      time: '저녁 식사 전',
      tasks: [
        '30분 걷기 또는 유산소 운동',
        '복식호흡'
      ]
    },
    dinner: {
      time: '오후 5-7시',
      tasks: [
        '저녁 식사 (가볍게, 채소 중심)',
        '보충제 복용 (종합비타민, 칼슘/마그네슘, 오메가-3)',
        '식후 가벼운 산책'
      ]
    },
    evening: {
      time: '취침 1-2시간 전',
      tasks: [
        '전자기기 차단',
        '따뜻한 목욕 20분',
        '이완 활동 (독서, 명상, 음악)',
        '마그네슘 복용 (필요시)'
      ]
    },
    bedtime: {
      time: '취침 직전',
      tasks: [
        '복식호흡 5회',
        '감사 일기 또는 긍정적 생각',
        '일정한 시간에 취침'
      ]
    }
  }

  // === 주간 체크리스트 ===
  const weeklyChecklist = {
    exercise: [
      '유산소 운동 5회 (각 30분)',
      '근력 운동 2-3회',
      '매일 걷기'
    ],
    nutrition: [
      '글루텐/유제품 제로',
      '설탕/가공식품 제로',
      '채소 매일 5회 이상',
      '물 하루 6-8잔'
    ],
    supplements: [
      '모든 보충제 매일 복용',
      '공복/식후 타이밍 준수'
    ],
    lifestyle: [
      '복식호흡 매일 5회',
      '충분한 수면 (7-8시간)',
      '이완 시간 매일 30분'
    ],
    mindset: [
      '스트레스 관리',
      '긍정적 사고',
      '사회적 연결'
    ]
  }

  // === 맞춤 식단 생성 (TDEE 적용) ===
  const mealPlan = generatePersonalizedMealPlan(prescriptions, categoryIssues, dietRecommendations, tdeeData)

  // === 맞춤 보충제 시간표 ===
  const supplementSchedule = generateSupplementSchedule(baseSupplements, customSupplements, categoryIssues)

  // === 전체 프로그램 반환 ===
  return {
    duration: '6주',
    startDate: null,

    // 사용자 상태 요약
    userSummary: {
      totalIssues: prescriptions.length,
      highPriority: highSeverity.length,
      mediumPriority: mediumSeverity.length,
      mainFocusAreas: highSeverity.map(rx => rx.checklistName || rx.checklistId).slice(0, 3)
    },

    // 준비 주간
    preparationWeek,

    // 6주 단계
    phases,

    // 일일 루틴 (구버전 호환)
    dailyRoutine: {
      morning: dailyRoutine.morning.tasks,
      afternoon: [...dailyRoutine.lunch.tasks.slice(0, 2), ...dailyRoutine.afternoon.tasks.slice(0, 1)],
      evening: dailyRoutine.evening.tasks
    },

    // 상세 일일 루틴
    detailedDailyRoutine: dailyRoutine,

    // 식단 권장사항 (기존)
    dietRecommendations,

    // ★ 구체적인 맞춤 식단 ★
    mealPlan,

    // 보충제 권장사항 (기존)
    supplements: {
      base: baseSupplements.map(s => ({ name: s, timing: s.includes('아침') ? '아침 식후' : s.includes('저녁') ? '저녁 식후' : s.includes('공복') ? '공복' : '식후' })),
      custom: customSupplements.map(s => ({ name: s, timing: s.includes('취침') ? '취침 전' : s.includes('아침') ? '아침' : '식후' })),
      timing: {
        morning: ['종합비타민', '칼슘/마그네슘', '비타민 D3', '오메가-3'],
        evening: ['종합비타민', '칼슘/마그네슘', '오메가-3'],
        bedtime: customSupplements.filter(s => s.includes('마그네슘') || s.includes('취침'))
      }
    },

    // ★ 구체적인 보충제 시간표 ★
    supplementSchedule,

    // 주간 체크리스트
    weeklyChecklist,

    // 코치 지원
    weeklyCheckins: true,
    coachSupport: userProfile.hasCoachAccess || false
  }
}

/**
 * 맞춤 식단 생성 (TDEE 기반 분량 포함)
 * @param {Array} prescriptions - 처방 목록
 * @param {Object} categoryIssues - 카테고리별 이슈
 * @param {Object} dietRecommendations - 식단 권장사항
 * @param {Object} tdeeData - TDEE 데이터 (선택)
 */
function generatePersonalizedMealPlan(prescriptions, categoryIssues, dietRecommendations, tdeeData = null) {
  // 모든 권장 식품 수집
  const allRecommendedFoods = new Set()
  const allAvoidFoods = new Set()

  prescriptions.forEach(rx => {
    if (rx.recommendations?.diet) {
      rx.recommendations.diet.forEach(f => allRecommendedFoods.add(f))
    }
    if (rx.recommendations?.avoid) {
      rx.recommendations.avoid.forEach(f => allAvoidFoods.add(f))
    }
  })

  // 기본 피해야 할 음식 추가
  dietRecommendations.mustAvoid?.forEach(f => allAvoidFoods.add(f))

  // 식품 카테고리별 분류
  const proteins = ['연어', '고등어', '정어리', '청어', '달걀', '닭가슴살', '칠면조', '소간', '굴', '새우']
  const vegetables = ['시금치', '케일', '브로콜리', '아스파라거스', '양배추', '당근', '비트', '고구마', '호박', '버섯']
  const fruits = ['바나나', '아보카도', '베리류', '오렌지', '레몬', '파파야', '사과']
  const nuts = ['호두', '아몬드', '캐슈넛', '브라질너트', '해바라기씨', '호박씨', '아마씨', '치아씨']
  const fermented = ['김치', '사우어크라우트', '미소', '된장', '낫토', '콤부차']
  const grains = ['현미', '퀴노아', '귀리', '메밀']
  const herbs = ['심황', '강황', '생강', '마늘', '양파']

  // 권장 식품 중 카테고리별 필터링
  const recommendedProteins = proteins.filter(p => allRecommendedFoods.has(p) || prescriptions.some(rx => rx.recommendations?.diet?.some(d => d.includes(p))))
  const recommendedVeggies = vegetables.filter(v => allRecommendedFoods.has(v) || prescriptions.some(rx => rx.recommendations?.diet?.some(d => d.includes(v))))
  const recommendedFruits = fruits.filter(f => allRecommendedFoods.has(f))
  const recommendedNuts = nuts.filter(n => allRecommendedFoods.has(n))

  // 부족하면 기본값 추가
  if (recommendedProteins.length < 3) recommendedProteins.push('연어', '달걀', '닭가슴살')
  if (recommendedVeggies.length < 3) recommendedVeggies.push('시금치', '브로콜리', '당근')
  if (recommendedNuts.length < 2) recommendedNuts.push('호두', '아몬드')

  // === TDEE 기반 분량 계산 ===
  const tdee = tdeeData?.tdee || 2000 // 기본값 2000kcal
  const portions = tdeeData?.portions || null

  // 칼로리 기반 분량 결정
  const getProteinPortion = (mealType) => {
    if (!portions) {
      // TDEE 없으면 기본값
      return mealType === 'breakfast' ? '100g' : mealType === 'lunch' ? '120g' : '100g'
    }
    return portions.portions.protein[mealType]
  }

  const getRicePortion = (mealType) => {
    if (!portions) {
      return mealType === 'breakfast' ? '1/2공기' : mealType === 'lunch' ? '2/3공기' : '1/2공기'
    }
    return portions.portions.rice[mealType]
  }

  const getSnackCalories = () => {
    if (!portions) return '약 150kcal'
    return `약 ${portions.snackCalories}kcal`
  }

  // 개인 맞춤 포인트
  const personalNotes = []

  // TDEE 정보 추가
  if (tdeeData) {
    personalNotes.push(`일일 권장 칼로리: ${tdee}kcal (아침 ${portions?.mealCalories?.breakfast || 500}, 점심 ${portions?.mealCalories?.lunch || 700}, 저녁 ${portions?.mealCalories?.dinner || 600})`)
  }

  if (categoryIssues.neurotransmitter?.some(rx => rx.checklistId === 'dopamine' && rx.severity !== 'low')) {
    personalNotes.push('도파민 지원: 아침에 단백질 위주로 섭취')
  }
  if (categoryIssues.neurotransmitter?.some(rx => rx.checklistId === 'serotonin' && rx.severity !== 'low')) {
    personalNotes.push('세로토닌 지원: 트립토판 식품(칠면조, 바나나) + 복합탄수화물')
  }
  if (categoryIssues.gut?.some(rx => rx.severity !== 'low')) {
    personalNotes.push('장 건강: 발효식품 매일 섭취, 섬유질 30g 이상')
  }
  if (categoryIssues.inflammation?.some(rx => rx.severity !== 'low')) {
    personalNotes.push('항염증: 심황, 생강, 베리류 매일 섭취')
  }

  return {
    // TDEE 정보
    tdeeInfo: tdeeData ? {
      tdee,
      bmr: tdeeData.bmr,
      mealCalories: portions?.mealCalories,
      summary: portions?.summary
    } : null,

    // 오늘의 추천 식품 (체크리스트용)
    todaysFoods: [...new Set([...recommendedProteins.slice(0, 3), ...recommendedVeggies.slice(0, 4), ...recommendedFruits.slice(0, 2), ...recommendedNuts.slice(0, 2)])],

    // 피해야 할 음식
    avoidFoods: Array.from(allAvoidFoods).slice(0, 8),

    // 구체적인 식단 메뉴 (분량 포함)
    meals: {
      breakfast: {
        title: '아침 식사 (7-9시)',
        calories: portions?.mealCalories?.breakfast || 450,
        mainDish: `${recommendedProteins[0] || '달걀'} ${getProteinPortion('breakfast')} + ${recommendedVeggies[0] || '시금치'} 샐러드 1컵`,
        sideDish: `${recommendedFruits[0] || '아보카도'} 반개`,
        drink: '따뜻한 레몬물 또는 녹차',
        tip: '단백질 위주로, 설탕 음료 금지'
      },
      morningSnack: {
        title: '오전 간식 (10-11시)',
        calories: Math.round((portions?.mealCalories?.snacks || 200) / 2),
        options: [
          `${recommendedNuts[0] || '호두'} 한 줌 (15-20개, 약 100kcal)`,
          `${recommendedFruits[1] || '사과'} 1개 (약 80kcal)`,
          '삶은 달걀 1개 (약 80kcal)'
        ]
      },
      lunch: {
        title: '점심 식사 (12-1시)',
        calories: portions?.mealCalories?.lunch || 600,
        mainDish: `${recommendedProteins[1] || '닭가슴살'} ${getProteinPortion('lunch')} + ${grains[0] || '현미밥'} ${getRicePortion('lunch')}`,
        sideDish: `${recommendedVeggies[1] || '브로콜리'}, ${recommendedVeggies[2] || '당근'} 등 채소 2컵`,
        drink: '물 또는 허브차',
        tip: '채소를 먼저, 탄수화물은 적게'
      },
      afternoonSnack: {
        title: '오후 간식 (3-4시)',
        calories: Math.round((portions?.mealCalories?.snacks || 200) / 2),
        options: [
          `${recommendedNuts[1] || '아몬드'} 10개 + 다크초콜릿 2조각 (약 120kcal)`,
          `${recommendedVeggies[3] || '당근'} 스틱 + 후무스 2스푼 (약 100kcal)`,
          '그릭요거트 100g (무설탕, 약 100kcal)'
        ]
      },
      dinner: {
        title: '저녁 식사 (5-7시)',
        calories: portions?.mealCalories?.dinner || 550,
        mainDish: `${recommendedProteins[2] || '생선'} ${getProteinPortion('dinner')} 구이`,
        sideDish: `${recommendedVeggies.slice(0, 3).join(', ')} 등 채소 샐러드 2컵`,
        rice: `${grains[0] || '현미밥'} ${getRicePortion('dinner')} (선택)`,
        drink: '물 또는 허브차',
        tip: '가볍게, 취침 3시간 전까지 완료'
      },
      eveningSnack: {
        title: '저녁 간식 (선택, 배고플 때만)',
        calories: 100,
        options: [
          '캐모마일 차 (0kcal)',
          `${recommendedNuts[0] || '호두'} 5개 (약 50kcal)`,
          '바나나 반개 (약 50kcal)'
        ]
      }
    },

    // 맞춤 포인트
    personalNotes,

    // 주간 식단 팁
    weeklyTips: [
      `생선(${recommendedProteins.filter(p => ['연어', '고등어', '정어리', '청어'].includes(p)).join(', ') || '연어, 고등어'}) 주 3회 이상`,
      `발효식품(${fermented.slice(0, 2).join(', ')}) 매일 섭취`,
      '채소 하루 5-9회 (다양한 색상)',
      '물 하루 8잔 (2L) 이상',
      tdeeData ? `일일 총 칼로리 ${tdee}kcal 내외 유지` : ''
    ].filter(Boolean),

    // 장보기 리스트
    shoppingList: {
      proteins: recommendedProteins.slice(0, 5),
      vegetables: recommendedVeggies.slice(0, 6),
      fruits: recommendedFruits.slice(0, 4),
      nuts: recommendedNuts.slice(0, 4),
      fermented: fermented.slice(0, 3),
      grains: grains.slice(0, 2),
      herbs: herbs.slice(0, 3)
    }
  }
}

/**
 * 보충제 시간표 생성
 */
function generateSupplementSchedule(baseSupplements, customSupplements, categoryIssues) {
  const schedule = {
    wakeUp: {
      time: '기상 직후 (공복)',
      items: [
        { name: '물 한 잔', dosage: '250ml', note: '레몬 한 조각 추가 권장' }
      ]
    },
    breakfast: {
      time: '아침 식사 직후',
      items: [
        { name: '종합비타민 & 미네랄', dosage: '1정', note: '음식과 함께 흡수율 향상' },
        { name: '비타민 D3', dosage: '2,000 IU', note: '지용성, 지방과 함께' },
        { name: '오메가-3 (EPA/DHA)', dosage: '1,000mg', note: '냉장 보관' }
      ]
    },
    midMorning: {
      time: '오전 10-11시',
      items: []
    },
    lunch: {
      time: '점심 식사 직후',
      items: [
        { name: '프로바이오틱스', dosage: '1캡슐', note: '장 건강 지원' }
      ]
    },
    dinner: {
      time: '저녁 식사 직후',
      items: [
        { name: '칼슘 + 마그네슘', dosage: '칼슘 300mg / 마그네슘 200mg', note: '흡수율 위해 분리 복용' },
        { name: '오메가-3 (EPA/DHA)', dosage: '1,000mg', note: '' }
      ]
    },
    bedtime: {
      time: '취침 30분 전',
      items: [
        { name: '마그네슘 글리시네이트', dosage: '200-400mg', note: '수면과 이완에 도움' }
      ]
    }
  }

  // 맞춤 보충제 추가
  if (categoryIssues.nutrition?.some(rx => rx.checklistId === 'methylation' && rx.severity !== 'low')) {
    schedule.breakfast.items.push(
      { name: '활성형 엽산 (5-MTHF)', dosage: '400-800ug', note: '메틸화 지원' },
      { name: '비타민 B12 (메틸코발라민)', dosage: '1,000ug', note: '설하 복용 권장' }
    )
  }

  if (categoryIssues.nutrition?.some(rx => rx.checklistId === 'zinc' && rx.severity !== 'low')) {
    schedule.dinner.items.push(
      { name: '아연', dosage: '15-30mg', note: '공복 피하기, 구리와 균형' }
    )
  }

  if (categoryIssues.neurotransmitter?.some(rx => rx.checklistId === 'gaba' && rx.severity !== 'low')) {
    schedule.bedtime.items.push(
      { name: 'L-테아닌', dosage: '200mg', note: '이완과 수면 지원' }
    )
  }

  if (categoryIssues.neurotransmitter?.some(rx => rx.checklistId === 'serotonin' && rx.severity !== 'low')) {
    schedule.dinner.items.push(
      { name: '5-HTP', dosage: '50-100mg', note: '세로토닌 전구체, 저녁 복용' }
    )
  }

  // 오전 간식에 아무것도 없으면 제거
  if (schedule.midMorning.items.length === 0) {
    delete schedule.midMorning
  }

  return schedule
}

// 4주차 맞춤 태스크 생성 헬퍼 함수
function generateWeek4Tasks(highSeverityRx, customSupplements) {
  const tasks = []

  if (highSeverityRx.length === 0) {
    tasks.push({
      category: '유지 관리',
      items: ['현재 루틴 유지', '미세 조정 필요시 적용', '전반적인 웰빙 점검']
    })
  } else {
    // 고심각도 영역별 맞춤 태스크
    for (const rx of highSeverityRx.slice(0, 3)) {
      const items = []
      if (rx.recommendations?.diet?.length > 0) {
        items.push(...rx.recommendations.diet.slice(0, 2))
      }
      if (rx.recommendations?.lifestyle?.length > 0) {
        items.push(...rx.recommendations.lifestyle.slice(0, 1))
      }
      if (items.length > 0) {
        tasks.push({
          category: `${rx.checklistName || rx.checklistId} 집중 관리`,
          items
        })
      }
    }
  }

  if (customSupplements.length > 0) {
    tasks.push({
      category: '맞춤 보충제',
      items: customSupplements
    })
  }

  return tasks
}

/**
 * 전체 분석 파이프라인 실행 (7 Keys 카테고리 기반)
 */
export async function runFullAnalysis(messages, aiEndpoint = null) {
  // 1. 대화 분석
  const analysis = await analyzeConversationWithAI(messages, aiEndpoint)

  // 2. 추천 카테고리 및 체크리스트 반환
  const recommendedCategories = analysis.recommendedCategories || []

  // AI 분석 결과에서 카테고리 정보 추출
  const categories = recommendedCategories.map((cat, idx) => {
    const categoryInfo = checklistCategories[cat.categoryId]
    return {
      id: cat.categoryId,
      name: categoryInfo?.name || cat.categoryId,
      icon: categoryInfo?.icon || '📋',
      description: categoryInfo?.description || '',
      reason: cat.reason || cat.matchedKeywords?.join(', '),
      priority: cat.priority || idx + 1,
      checklists: categoryInfo?.checklists || []
    }
  })

  // 기존 호환성을 위한 체크리스트 목록도 생성
  const recommendedChecklists = categories.flatMap(cat =>
    cat.checklists.map(checklistId => ({
      id: checklistId,
      name: ultramindChecklists[checklistId]?.name,
      category: cat.id,
      categoryName: cat.name,
      reason: cat.reason
    }))
  )

  return {
    analysis,
    recommendedCategories: categories,
    recommendedChecklists,
    summary: analysis.summary || '대화 분석을 완료했습니다.',
    nextStep: 'select_category' // 다음 단계: 카테고리 선택
  }
}

export default {
  extractSymptoms,
  recommendCategories,
  recommendChecklistsInCategory,
  recommendChecklists,
  analyzeConversationLocal,
  analyzeConversationWithAI,
  generatePrescription,
  generate6WeekProgram,
  runFullAnalysis
}
