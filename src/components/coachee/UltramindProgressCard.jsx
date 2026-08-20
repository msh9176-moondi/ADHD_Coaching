/**
 * Ultra Mind 프로그램 진행 현황 카드
 * 대시보드에서 현재 프로그램 상태를 한눈에 보여줌
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { Card, CardContent } from '../common/Card'
import {
  Brain, Calendar, Target, TrendingUp, ChevronRight,
  Sparkles, CheckCircle, Clock, Flame
} from 'lucide-react'
import {
  getActiveUltramindProgram,
  calculateCurrentWeek,
  calculateProgramProgress,
  getCurrentPhase
} from '../../lib/ultramindProgramService'

export function UltramindProgressCard() {
  const { user } = useStore()
  const navigate = useNavigate()
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProgram() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const data = await getActiveUltramindProgram(user.id)
        setProgram(data)
      } catch (err) {
        console.error('프로그램 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProgram()
  }, [user?.id])

  if (loading) {
    return (
      <Card className="border-2 border-violet-100">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 프로그램이 없으면 시작 유도 카드 표시
  if (!program) {
    return (
      <Card
        className="overflow-hidden border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 cursor-pointer hover:border-violet-300 transition-all"
        onClick={() => navigate('/coachee/ultramind')}
      >
        <CardContent className="p-4 md:p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-200">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-gray-900">Ultra Mind Solution</h3>
                <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded">NEW</span>
              </div>
              <p className="text-sm text-gray-600">6주 맞춤형 뇌 건강 프로그램을 시작해보세요</p>
            </div>
            <ChevronRight className="w-5 h-5 text-violet-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // 프로그램 진행 중
  const programData = program.program_data
  const currentWeek = calculateCurrentWeek(program.start_date)
  const progress = calculateProgramProgress(program.start_date, program.end_date)
  const currentPhase = getCurrentPhase(programData, currentWeek)

  // 남은 일수 계산
  const endDate = new Date(program.end_date)
  const now = new Date()
  const remainingDays = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)))

  return (
    <Card
      className="overflow-hidden border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 cursor-pointer hover:border-violet-300 transition-all"
      onClick={() => navigate('/coachee/ultramind')}
    >
      <CardContent className="p-4 md:p-5">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Ultra Mind Solution</h3>
              <p className="text-sm text-violet-600 font-medium">
                {currentWeek}주차 진행 중
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-violet-100 rounded-full">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-violet-700">{progress}%</span>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="mb-4">
          <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-gray-500">
            <span>시작</span>
            <span>{remainingDays}일 남음</span>
          </div>
        </div>

        {/* 현재 페이즈 */}
        {currentPhase && (
          <div className="p-3 bg-white/70 rounded-xl border border-violet-100 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-semibold text-gray-800">
                {currentPhase.title}
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">
              {currentPhase.focus}
            </p>
          </div>
        )}

        {/* 주요 목표 영역 */}
        {programData?.userSummary?.mainFocusAreas?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {programData.userSummary.mainFocusAreas.slice(0, 3).map((area, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full"
              >
                {area}
              </span>
            ))}
          </div>
        )}

        {/* 하단 액션 */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-violet-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {currentWeek}/6주
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              D-{remainingDays}
            </span>
          </div>
          <span className="flex items-center gap-1 text-sm font-medium text-violet-600">
            자세히 보기
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default UltramindProgressCard
