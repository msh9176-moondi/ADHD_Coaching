import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { getActiveUltramindProgram } from '../../lib/ultramindProgramService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { UltramindProgressCard } from '../../components/coachee/UltramindProgressCard'
import { UltramindTodayPlan } from '../../components/coachee/UltramindTodayPlan'
import { UltramindDailyRoutine } from '../../components/coachee/UltramindDailyRoutine'
import { Card, CardContent } from '../../components/common/Card'
import { Brain, Target, ChevronRight, Sparkles, BookOpen } from 'lucide-react'

export function UltramindDashboardPage() {
  const { user } = useStore()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [hasProgram, setHasProgram] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!user?.id || !isSupabaseConfigured()) {
        setIsLoading(false)
        return
      }

      try {
        const programData = await getActiveUltramindProgram(user.id)
        setHasProgram(!!programData)
      } catch (err) {
        console.error('프로그램 확인 실패:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-20 lg:pb-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">울트라마인드</h1>
          <p className="text-sm text-gray-500">6주 맞춤형 뇌 건강 프로그램</p>
        </div>
      </div>

      {/* 프로그램이 없는 경우 */}
      {!hasProgram && (
        <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50">
          <CardContent className="p-6 md:p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-violet-200">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Ultra Mind Solution
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              뇌 건강을 위한 6주 맞춤형 프로그램입니다.
              검사를 통해 나에게 맞는 식단, 영양제, 생활습관을 안내받으세요.
            </p>
            <button
              onClick={() => navigate('/coachee/ultramind/program')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-violet-200 hover:from-violet-700 hover:to-indigo-700 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              프로그램 시작하기
            </button>
          </CardContent>
        </Card>
      )}

      {/* 프로그램 진행 중인 경우 */}
      {hasProgram && (
        <>
          {/* 프로그램 진행 현황 */}
          <UltramindProgressCard />

          {/* 오늘의 맞춤 플랜 */}
          <UltramindTodayPlan />

          {/* 오늘의 루틴 */}
          <UltramindDailyRoutine />

          {/* 상세 프로그램 페이지 링크 */}
          <Card
            className="border-violet-200 hover:border-violet-300 cursor-pointer transition-all"
            onClick={() => navigate('/coachee/ultramind/program')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">전체 프로그램 보기</h3>
                    <p className="text-sm text-gray-500">6주 플랜, 검사 결과, 상세 가이드</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-violet-400" />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* 프로그램 소개 */}
      <Card className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Ultra Mind Solution이란?</h3>
              <p className="text-sm text-violet-100 leading-relaxed">
                마크 하이만 박사의 "The UltraMind Solution"에 기반한 6주 프로그램입니다.
                영양, 생활습관, 호르몬 균형을 통해 뇌 건강을 개선합니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
