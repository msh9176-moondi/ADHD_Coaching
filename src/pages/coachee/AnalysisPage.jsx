import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { getASRSResult, getSurveyResult } from '../../lib/surveyService'
import { getActiveUltramindProgram } from '../../lib/ultramindProgramService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { MyAnalysisResult } from '../../components/coachee/MyAnalysisResult'
import { ResultsVisualization } from '../../components/ultramind/SixWeekProgram'
import { Card, CardContent } from '../../components/common/Card'
import {
  BarChart3, Brain, ClipboardList, FileText, Sparkles
} from 'lucide-react'

export function AnalysisPage() {
  const {
    user,
    asrsResult,
    preSurvey,
    postSurvey,
    setASRSResult,
    setPreSurvey,
    setPostSurvey
  } = useStore()
  const [isLoading, setIsLoading] = useState(true)
  const [ultramindProgram, setUltramindProgram] = useState(null)
  const [activeTab, setActiveTab] = useState('adhd') // 'adhd' | 'ultramind'

  useEffect(() => {
    async function loadData() {
      if (!user?.id || !isSupabaseConfigured()) {
        setIsLoading(false)
        return
      }

      try {
        // ASRS 결과
        const asrsData = await getASRSResult(user.id)
        if (asrsData) {
          setASRSResult({
            totalScore: asrsData.total_score,
            maxScore: asrsData.max_score,
            inattentionScore: asrsData.inattention_score,
            hyperactivityScore: asrsData.hyperactivity_score,
            impulsivityScore: asrsData.impulsivity_score,
            level: asrsData.level,
            interpretation: asrsData.interpretation
          })
        }

        // 사전 설문
        const preSurveyData = await getSurveyResult(user.id, 'pre')
        if (preSurveyData) {
          setPreSurvey({
            answers: preSurveyData.answers,
            categoryScores: preSurveyData.category_scores,
            totalScore: preSurveyData.total_score
          })
        }

        // 사후 설문
        const postSurveyData = await getSurveyResult(user.id, 'post')
        if (postSurveyData) {
          setPostSurvey({
            answers: postSurveyData.answers,
            categoryScores: postSurveyData.category_scores,
            totalScore: postSurveyData.total_score
          })
        }

        // 울트라마인드 프로그램 정보
        const ultramindData = await getActiveUltramindProgram(user.id)
        setUltramindProgram(ultramindData)
      } catch (err) {
        console.error('분석 데이터 로드 실패:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  // 울트라마인드 처방 데이터 추출
  const prescriptions = ultramindProgram?.prescriptions ||
    ultramindProgram?.program_data?.prescriptions || []

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 탭별 콘텐츠 확인
  const hasADHDResult = asrsResult || preSurvey
  const hasUltramindResult = prescriptions.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-20 lg:pb-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">나의 분석</h1>
          <p className="text-sm text-gray-500">검사 결과와 분석 내용을 확인하세요</p>
        </div>
      </div>

      {/* 분석 결과가 없는 경우 */}
      {!hasADHDResult && !hasUltramindResult && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">아직 분석 결과가 없어요</h3>
            <p className="text-sm text-gray-500 mb-6">
              설문과 자가진단을 완료하면 나의 결과를 확인할 수 있어요.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/coachee/asrs-test"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <Brain className="w-4 h-4" />
                ASRS 검사 시작
              </Link>
              <Link
                to="/coachee/survey?type=pre"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                설문 시작
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 탭 네비게이션 (결과가 있을 때만) */}
      {(hasADHDResult || hasUltramindResult) && (
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('adhd')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'adhd'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Brain className="w-4 h-4" />
            ADHD 분석
            {!hasADHDResult && (
              <span className="text-xs text-gray-400">(미완료)</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ultramind')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'ultramind'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            울트라마인드
            {!hasUltramindResult && (
              <span className="text-xs text-gray-400">(미완료)</span>
            )}
          </button>
        </div>
      )}

      {/* ADHD 분석 탭 */}
      {activeTab === 'adhd' && (
        <>
          {hasADHDResult ? (
            <MyAnalysisResult />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ADHD 검사를 완료하세요</h3>
                <p className="text-sm text-gray-500 mb-6">
                  ASRS 검사와 코칭 설문을 완료하면 분석 결과를 확인할 수 있어요.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/coachee/asrs-test"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    <Brain className="w-4 h-4" />
                    ASRS 검사 시작
                  </Link>
                  <Link
                    to="/coachee/survey?type=pre"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <ClipboardList className="w-4 h-4" />
                    설문 시작
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 코칭 리포트 링크 (ADHD 결과가 있을 때만) */}
          {hasADHDResult && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">코칭 리포트</h3>
                      <p className="text-sm text-gray-600">전체 분석 결과를 리포트로 확인</p>
                    </div>
                  </div>
                  <Link
                    to="/coachee/report"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    보기
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* 울트라마인드 분석 탭 */}
      {activeTab === 'ultramind' && (
        <>
          {hasUltramindResult ? (
            <div className="space-y-4">
              {/* 프로그램 진행 상태 */}
              <Card className="border-violet-200 bg-violet-50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">프로그램 진행 현황</h3>
                        <p className="text-sm text-gray-600">
                          {ultramindProgram?.current_week || 1}주차 / 6주 진행 중
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/coachee/today"
                      className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                    >
                      오늘의 플랜
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* ResultsVisualization 컴포넌트 (그래프 버전) */}
              <ResultsVisualization prescriptions={prescriptions} />
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">울트라마인드 검사를 시작하세요</h3>
                <p className="text-sm text-gray-500 mb-6">
                  울트라마인드 체크리스트를 완료하면 맞춤 분석 결과를 확인할 수 있어요.
                </p>
                <Link
                  to="/coachee/ultramind/program"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  검사 시작하기
                </Link>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
