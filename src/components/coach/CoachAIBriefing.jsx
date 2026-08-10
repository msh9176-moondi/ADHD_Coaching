import { useState, useEffect } from 'react'
import {
  Brain,
  Target,
  Lightbulb,
  MessageSquare,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Quote,
  Sparkles,
  Loader2,
  RefreshCw,
  User,
  TrendingUp,
  Shield,
  Beaker,
  ClipboardList,
  Eye,
  Heart
} from 'lucide-react'
import { Button } from '../common/Button'
import { generateCoachingBriefing, getQuickSessionBriefing, isAIConfigured } from '../../lib/aiService'

/**
 * 코치용 AI 코칭 브리핑 패널
 */
export function CoachAIBriefing({
  coacheeData,
  messages = [],
  sessionNotes = [],
  reflections = [],
  currentSessionNumber = 1,
  mode = 'full' // 'full' | 'quick'
}) {
  const [briefing, setBriefing] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    statements: false,
    interpretation: false,
    problemStructure: false,
    strengths: false,
    priorities: true,
    questions: true,
    experiments: false,
    coacheeVersion: false,
    meta: false
  })
  const [showCoacheeVersion, setShowCoacheeVersion] = useState(false)

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const generateBriefing = async () => {
    if (!isAIConfigured()) {
      setError('OpenAI API 키가 설정되지 않았습니다.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      let result
      if (mode === 'quick') {
        result = await getQuickSessionBriefing(coacheeData, messages)
      } else {
        result = await generateCoachingBriefing(
          coacheeData,
          messages,
          sessionNotes,
          reflections,
          currentSessionNumber
        )
      }
      setBriefing(result)
    } catch (err) {
      console.error('브리핑 생성 실패:', err)
      setError(err.message || '브리핑 생성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 빠른 브리핑 모드일 때 자동 생성
  useEffect(() => {
    if (mode === 'quick' && !briefing && !isLoading && coacheeData) {
      generateBriefing()
    }
  }, [mode, coacheeData])

  if (!isAIConfigured()) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">AI 기능을 사용하려면 OpenAI API 키 설정이 필요합니다.</p>
      </div>
    )
  }

  // 빠른 브리핑 모드 UI
  if (mode === 'quick') {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-900">빠른 세션 브리핑</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateBriefing}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="ml-2 text-emerald-700">분석 중...</span>
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : briefing ? (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-emerald-800 font-medium">{briefing.headline}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">피코치 상태</p>
                <p className="text-sm text-gray-700">{briefing.coacheeState}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">최우선 포인트</p>
                <p className="text-sm text-gray-700">{briefing.topPriority}</p>
              </div>
            </div>
            <div className="bg-emerald-100 rounded-lg p-3">
              <p className="text-xs text-emerald-600 mb-1">세션 시작 질문</p>
              <p className="text-sm text-emerald-800 font-medium">"{briefing.openingQuestion}"</p>
            </div>
            {briefing.caution && (
              <div className="bg-amber-50 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{briefing.caution}</p>
              </div>
            )}
          </div>
        ) : (
          <Button onClick={generateBriefing} className="w-full">
            <Brain className="w-4 h-4 mr-2" />
            브리핑 생성
          </Button>
        )}
      </div>
    )
  }

  // 풀 브리핑 모드 UI
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI 코칭 브리핑</h2>
              <p className="text-emerald-100 text-sm">
                {coacheeData?.name} · {currentSessionNumber}회기 준비
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCoacheeVersion(!showCoacheeVersion)}
              className="text-white hover:bg-white/20"
            >
              {showCoacheeVersion ? <Eye className="w-4 h-4 mr-1" /> : <User className="w-4 h-4 mr-1" />}
              {showCoacheeVersion ? '코치용' : '피코치용'}
            </Button>
            <button
              onClick={generateBriefing}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-white text-emerald-700 font-medium rounded-lg hover:bg-emerald-50 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {briefing ? '다시 분석' : '브리핑 생성'}
            </button>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">AI가 데이터를 분석하고 있습니다...</p>
          <p className="text-gray-400 text-sm mt-1">최대 30초 정도 소요될 수 있습니다</p>
        </div>
      )}

      {/* 피코치용 버전 */}
      {showCoacheeVersion && briefing?.coacheeVersion && (
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">피코치에게 보여줄 내용</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">이번 세션 미리보기</p>
              <p className="text-gray-800">{briefing.coacheeVersion.sessionPreview}</p>
            </div>
            {briefing.coacheeVersion.progressCelebration && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-600 mb-2">지금까지 잘해온 것</p>
                <p className="text-yellow-800">{briefing.coacheeVersion.progressCelebration}</p>
              </div>
            )}
            {briefing.coacheeVersion.simpleNextStep && (
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-sm text-emerald-600 mb-2">다음 단계</p>
                <p className="text-emerald-800 font-medium">{briefing.coacheeVersion.simpleNextStep}</p>
              </div>
            )}
            <div className="bg-purple-50 rounded-lg p-4 flex items-start gap-3">
              <Heart className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <p className="text-purple-800">{briefing.coacheeVersion.encouragement}</p>
            </div>
          </div>
        </div>
      )}

      {/* 코치용 풀 브리핑 */}
      {!showCoacheeVersion && briefing && (
        <div className="p-6 space-y-4">

          {/* 1. 브리핑 요약 */}
          <CollapsibleSection
            title="한눈에 보는 브리핑"
            icon={<Target className="w-5 h-5" />}
            isOpen={expandedSections.summary}
            onToggle={() => toggleSection('summary')}
            highlight
          >
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-emerald-800 font-semibold text-lg">
                  {briefing.briefingSummary?.headline}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">핵심 포인트</p>
                <ul className="space-y-2">
                  {briefing.briefingSummary?.keyTakeaways?.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <strong>진행 상황:</strong> {briefing.briefingSummary?.sessionProgress}
              </div>
            </div>
          </CollapsibleSection>

          {/* 2. 피코치 진술 */}
          <CollapsibleSection
            title="피코치의 직접 진술"
            icon={<Quote className="w-5 h-5" />}
            isOpen={expandedSections.statements}
            onToggle={() => toggleSection('statements')}
          >
            <div className="space-y-4">
              {briefing.coacheeStatements?.directQuotes?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">주요 인용</p>
                  <div className="space-y-2">
                    {briefing.coacheeStatements.directQuotes.map((q, idx) => (
                      <div key={idx} className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                        <p className="text-blue-900 font-medium">"{q.quote}"</p>
                        <p className="text-blue-700 text-sm mt-1">{q.context}</p>
                        <p className="text-blue-600 text-xs mt-1">→ {q.significance}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InfoCard
                  label="자기 인식"
                  value={briefing.coacheeStatements?.selfDescriptions?.howTheySeeThemselves}
                />
                <InfoCard
                  label="진술한 목표"
                  value={briefing.coacheeStatements?.selfDescriptions?.statedGoals}
                />
                <InfoCard
                  label="표현한 어려움"
                  value={briefing.coacheeStatements?.selfDescriptions?.expressedDifficulties}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* 3. AI 해석 */}
          <CollapsibleSection
            title="AI 해석 (코치 참고용)"
            icon={<Brain className="w-5 h-5" />}
            isOpen={expandedSections.interpretation}
            onToggle={() => toggleSection('interpretation')}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  briefing.aiInterpretation?.confidence === 'high'
                    ? 'bg-green-100 text-green-700'
                    : briefing.aiInterpretation?.confidence === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  확신도: {briefing.aiInterpretation?.confidence || 'low'}
                </span>
              </div>
              <InfoCard
                label="말하지 않은 것"
                value={briefing.aiInterpretation?.beyondWords}
                variant="subtle"
              />
              <InfoCard
                label="불일치 감지"
                value={briefing.aiInterpretation?.discrepancies}
                variant="warning"
              />
              <InfoCard
                label="사각지대"
                value={briefing.aiInterpretation?.blindSpots}
                variant="subtle"
              />
              <InfoCard
                label="근본적 욕구"
                value={briefing.aiInterpretation?.underlyingNeeds}
                variant="info"
              />
            </div>
          </CollapsibleSection>

          {/* 4. 문제 작동 구조 */}
          <CollapsibleSection
            title="문제 작동 구조"
            icon={<TrendingUp className="w-5 h-5" />}
            isOpen={expandedSections.problemStructure}
            onToggle={() => toggleSection('problemStructure')}
          >
            <div className="space-y-4">
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-sm text-red-600 mb-1">표면적 문제</p>
                <p className="text-red-800">{briefing.problemStructure?.surfaceIssue}</p>
              </div>

              {briefing.problemStructure?.triggerPattern && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-xs text-orange-600 mb-1">트리거</p>
                    <ul className="text-sm text-orange-800">
                      {briefing.problemStructure.triggerPattern.triggers?.map((t, i) => (
                        <li key={i}>• {t}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs text-yellow-600 mb-1">반응</p>
                    <ul className="text-sm text-yellow-800">
                      {briefing.problemStructure.triggerPattern.responses?.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-red-600 mb-1">결과</p>
                    <ul className="text-sm text-red-800">
                      {briefing.problemStructure.triggerPattern.consequences?.map((c, i) => (
                        <li key={i}>• {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {briefing.problemStructure?.structuralDiagram && (
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-700 font-mono">
                    {briefing.problemStructure.structuralDiagram}
                  </p>
                </div>
              )}

              {briefing.problemStructure?.maintenanceFactors?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">문제 유지 요인</p>
                  <div className="flex flex-wrap gap-2">
                    {briefing.problemStructure.maintenanceFactors.map((f, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* 5. 강점 분석 */}
          <CollapsibleSection
            title="강점 분석"
            icon={<Sparkles className="w-5 h-5" />}
            isOpen={expandedSections.strengths}
            onToggle={() => toggleSection('strengths')}
          >
            <div className="space-y-4">
              {briefing.strengthsAnalysis?.evidencedStrengths?.map((s, idx) => (
                <div key={idx} className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-emerald-800">{s.strength}</p>
                      <p className="text-sm text-emerald-700 mt-1">
                        <strong>증거:</strong> {s.evidence}
                      </p>
                      <p className="text-sm text-teal-700 mt-1">
                        <strong>활용법:</strong> {s.coachingApplication}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {briefing.strengthsAnalysis?.emergingStrengths?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">발전 가능한 강점</p>
                  <div className="flex flex-wrap gap-2">
                    {briefing.strengthsAnalysis.emergingStrengths.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* 6. 코칭 우선순위 */}
          <CollapsibleSection
            title="코칭 우선순위"
            icon={<ClipboardList className="w-5 h-5" />}
            isOpen={expandedSections.priorities}
            onToggle={() => toggleSection('priorities')}
            highlight
          >
            <div className="space-y-4">
              {briefing.coachingPriorities?.immediateActions?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">즉시 실행</p>
                  {briefing.coachingPriorities.immediateActions.map((a, idx) => (
                    <div key={idx} className="bg-emerald-50 rounded-lg p-3 mb-2">
                      <p className="font-medium text-emerald-800">{a.action}</p>
                      <p className="text-sm text-emerald-700 mt-1">왜: {a.rationale}</p>
                      <p className="text-sm text-emerald-600 mt-1">기대 결과: {a.expectedOutcome}</p>
                    </div>
                  ))}
                </div>
              )}

              {briefing.coachingPriorities?.sessionAgenda?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">세션 아젠다</p>
                  <div className="space-y-2">
                    {briefing.coachingPriorities.sessionAgenda.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                        <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.topic}</p>
                          <p className="text-sm text-gray-600">{item.approach}</p>
                          {item.timeAllocation && (
                            <span className="text-xs text-gray-500">{item.timeAllocation}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {briefing.coachingPriorities?.avoidThisSession?.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-700 mb-2">이번 세션에서 피할 것</p>
                  <ul className="text-sm text-red-600">
                    {briefing.coachingPriorities.avoidThisSession.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-600 mb-1">중장기 방향</p>
                <p className="text-blue-800">{briefing.coachingPriorities?.strategicDirection}</p>
              </div>
            </div>
          </CollapsibleSection>

          {/* 7. 질문 제안 */}
          <CollapsibleSection
            title="질문 제안"
            icon={<MessageSquare className="w-5 h-5" />}
            isOpen={expandedSections.questions}
            onToggle={() => toggleSection('questions')}
            highlight
          >
            <div className="space-y-4">
              <QuestionBlock
                title="시작 질문"
                questions={briefing.suggestedQuestions?.openingQuestions}
                color="emerald"
              />
              <QuestionBlock
                title="탐색 질문"
                questions={briefing.suggestedQuestions?.explorationQuestions}
                color="blue"
              />
              <QuestionBlock
                title="도전 질문"
                questions={briefing.suggestedQuestions?.challengingQuestions}
                color="amber"
                note="타이밍 주의"
              />
              <QuestionBlock
                title="마무리 질문"
                questions={briefing.suggestedQuestions?.closingQuestions}
                color="purple"
              />
            </div>
          </CollapsibleSection>

          {/* 8. 작은 실험 */}
          <CollapsibleSection
            title="작은 실험 제안"
            icon={<Beaker className="w-5 h-5" />}
            isOpen={expandedSections.experiments}
            onToggle={() => toggleSection('experiments')}
          >
            <div className="space-y-4">
              {briefing.smallExperiments?.map((exp, idx) => (
                <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-purple-800">{exp.experimentName}</h4>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {exp.duration}
                    </span>
                  </div>
                  <p className="text-purple-700 mt-2">{exp.description}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/50 rounded-lg p-2">
                      <p className="text-purple-600 text-xs">성공 기준</p>
                      <p className="text-purple-800">{exp.successCriteria}</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <p className="text-purple-600 text-xs">실패해도 배울 것</p>
                      <p className="text-purple-800">{exp.failureLearning}</p>
                    </div>
                  </div>
                  {exp.adaptations && (
                    <div className="mt-2 text-sm bg-white/50 rounded-lg p-2">
                      <p className="text-purple-600 text-xs">ADHD 맞춤 조정</p>
                      <p className="text-purple-800">{exp.adaptations}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* 9. 메타 분석 */}
          <CollapsibleSection
            title="메타 분석 (코치 전용)"
            icon={<Shield className="w-5 h-5" />}
            isOpen={expandedSections.meta}
            onToggle={() => toggleSection('meta')}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <InfoCard
                  label="코칭 관계"
                  value={briefing.metaAnalysis?.coachingRelationship}
                />
                <InfoCard
                  label="변화 준비도"
                  value={briefing.metaAnalysis?.readinessForChange}
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">저항/방어 수준:</span>
                <LevelBadge level={briefing.metaAnalysis?.resistanceLevel} />
              </div>
              {briefing.metaAnalysis?.riskFactors?.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm text-red-600 font-medium mb-2">주의 요소</p>
                  <ul className="text-sm text-red-700">
                    {briefing.metaAnalysis.riskFactors.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {briefing.metaAnalysis?.supervisorNote && (
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <strong>수퍼비전 메모:</strong> {briefing.metaAnalysis.supervisorNote}
                  </p>
                </div>
              )}
            </div>
          </CollapsibleSection>

        </div>
      )}

      {/* 초기 상태 */}
      {!isLoading && !briefing && !showCoacheeVersion && (
        <div className="p-12 text-center">
          <Brain className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">AI 코칭 브리핑</h3>
          <p className="text-gray-500">
            피코치의 대화, 세션 노트, 성찰일지를 종합 분석하여<br />
            세션 준비를 도와드립니다.
          </p>
          <p className="text-sm text-emerald-600 mt-4">
            위의 "브리핑 생성" 버튼을 클릭하세요
          </p>
        </div>
      )}
    </div>
  )
}

// 접이식 섹션 컴포넌트
function CollapsibleSection({ title, icon, isOpen, onToggle, highlight, children }) {
  return (
    <div className={`border rounded-lg ${highlight ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={highlight ? 'text-emerald-600' : 'text-gray-600'}>
            {icon}
          </span>
          <span className={`font-medium ${highlight ? 'text-emerald-800' : 'text-gray-800'}`}>
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}

// 정보 카드 컴포넌트
function InfoCard({ label, value, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-50',
    subtle: 'bg-gray-50 border border-gray-100',
    warning: 'bg-amber-50 border border-amber-100',
    info: 'bg-blue-50 border border-blue-100'
  }

  return (
    <div className={`rounded-lg p-3 ${variants[variant]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-700">{value || '정보 없음'}</p>
    </div>
  )
}

// 질문 블록 컴포넌트
function QuestionBlock({ title, questions, color, note }) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800'
  }

  if (!questions || questions.length === 0) return null

  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{title}</p>
        {note && <span className="text-xs opacity-75">{note}</span>}
      </div>
      <ul className="space-y-2">
        {questions.map((q, idx) => (
          <li key={idx} className="text-sm flex items-start gap-2">
            <span className="opacity-50">•</span>
            <span>"{q}"</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// 레벨 배지 컴포넌트
function LevelBadge({ level }) {
  const config = {
    low: { bg: 'bg-green-100', text: 'text-green-700', label: '낮음' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '보통' },
    high: { bg: 'bg-red-100', text: 'text-red-700', label: '높음' }
  }

  const cfg = config[level] || config.low

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}
