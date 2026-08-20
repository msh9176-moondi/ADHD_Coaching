/**
 * 코치 대시보드용 울트라마인드 현황 카드
 * 모든 피코치의 울트라마인드 진행 상태를 한눈에 보여줌
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import {
  Brain, Users, TrendingUp, AlertCircle, ChevronRight,
  Clock, CheckCircle, PlayCircle, XCircle
} from 'lucide-react'

export function UltramindOverviewCard() {
  const navigate = useNavigate()
  const { user } = useStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    completed: 0,
    needsAttention: []
  })

  useEffect(() => {
    loadUltramindStats()
  }, [user?.id])

  const loadUltramindStats = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      // 코치의 피코치 목록 가져오기
      let coachees = []

      if (isSupabaseConfigured()) {
        const { data: coacheeData } = await supabase
          .from('coachee_profiles')
          .select('user_id, users(name)')
          .eq('coach_id', user.id)

        if (coacheeData) {
          coachees = coacheeData.map(c => ({
            userId: c.user_id,
            name: c.users?.name || '이름 없음'
          }))
        }
      }

      // 각 피코치의 울트라마인드 상태 확인
      let notStarted = 0
      let inProgress = 0
      let completed = 0
      const needsAttention = []

      for (const coachee of coachees) {
        // localStorage 확인 (데모용)
        const localProgram = localStorage.getItem(`ultramind_program_${coachee.userId}`)
        let program = null

        if (localProgram) {
          try {
            program = JSON.parse(localProgram)
          } catch (e) {}
        }

        // Supabase 확인
        if (!program && isSupabaseConfigured()) {
          const { data } = await supabase
            .from('ultramind_programs')
            .select('*')
            .eq('user_id', coachee.userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (data) {
            program = data
          }
        }

        if (!program) {
          notStarted++
        } else if (program.status === 'active') {
          inProgress++

          // 주의 필요 체크 (3일 이상 진행 없음)
          const lastUpdated = program.updated_at || program.created_at
          if (lastUpdated) {
            const daysSinceUpdate = Math.floor(
              (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
            )
            if (daysSinceUpdate >= 3) {
              needsAttention.push({
                ...coachee,
                daysSinceUpdate,
                currentWeek: program.current_week || 1
              })
            }
          }
        } else if (program.status === 'completed') {
          completed++
        }
      }

      setStats({
        total: coachees.length,
        notStarted,
        inProgress,
        completed,
        needsAttention: needsAttention.slice(0, 3) // 최대 3명만 표시
      })
    } catch (err) {
      console.error('울트라마인드 통계 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-violet-200">
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-100 rounded w-1/3" />
            <div className="h-16 bg-gray-100 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (stats.total === 0) {
    return null // 피코치가 없으면 표시 안함
  }

  return (
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-500" />
            Ultra Mind 현황
          </CardTitle>
          <span className="text-xs text-gray-500">
            총 {stats.total}명
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 진행 현황 */}
        <div className="grid grid-cols-3 gap-2">
          <StatusBox
            icon={<XCircle className="w-4 h-4" />}
            label="미시작"
            count={stats.notStarted}
            color="gray"
          />
          <StatusBox
            icon={<PlayCircle className="w-4 h-4" />}
            label="진행 중"
            count={stats.inProgress}
            color="violet"
          />
          <StatusBox
            icon={<CheckCircle className="w-4 h-4" />}
            label="완료"
            count={stats.completed}
            color="emerald"
          />
        </div>

        {/* 진행률 바 */}
        {stats.total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>전체 진행률</span>
              <span>{Math.round(((stats.inProgress + stats.completed) / stats.total) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${(stats.completed / stats.total) * 100}%` }}
              />
              <div
                className="h-full bg-violet-500"
                style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 주의 필요 알림 */}
        {stats.needsAttention.length > 0 && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">주의 필요</span>
            </div>
            <div className="space-y-1">
              {stats.needsAttention.map((coachee, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-700">{coachee.name}</span>
                  <span className="text-amber-600">
                    {coachee.daysSinceUpdate}일째 미접속
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 상세 보기 버튼 */}
        <button
          onClick={() => navigate('/coach/coachees')}
          className="w-full py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          피코치별 상세 보기
          <ChevronRight className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  )
}

// 상태 박스 컴포넌트
function StatusBox({ icon, label, count, color }) {
  const colorClasses = {
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  }

  return (
    <div className={`p-2 rounded-lg border text-center ${colorClasses[color]}`}>
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-bold">{count}</p>
    </div>
  )
}

export default UltramindOverviewCard
