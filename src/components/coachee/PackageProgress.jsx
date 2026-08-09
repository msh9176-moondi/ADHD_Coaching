import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { CheckCircle, Circle, PlayCircle, Edit3, Check, X } from 'lucide-react'
import { updateCoacheeProfile } from '../../lib/coacheeService'
import { isSupabaseConfigured } from '../../lib/supabase'

const PACKAGE_INFO = {
  starter: { name: '스타터', sessions: 3, description: '빠른 문제 해결' },
  basic: { name: '베이직', sessions: 5, description: '루틴 정착' },
  premium: { name: '프리미엄', sessions: 10, description: '심화 코칭' },
}

export function PackageProgress() {
  const { user, coachingPackage, setCoachingPackage } = useStore()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedType, setSelectedType] = useState(coachingPackage?.type || 'basic')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pkg = PACKAGE_INFO[coachingPackage?.type] || PACKAGE_INFO.basic
  const { completedSessions = 0, currentSession = 1, totalSessions = 5 } = coachingPackage || {}
  // 완료된 회기 수: completedSessions 또는 currentSession - 1 중 큰 값 사용
  const actualCompleted = Math.max(completedSessions, currentSession - 1)
  const percent = Math.round((actualCompleted / totalSessions) * 100)

  // 회기 배열 생성
  const sessionsArray = Array.from({ length: totalSessions }, (_, i) => i + 1)

  const handleChangePackage = async () => {
    if (selectedType === coachingPackage?.type) {
      setIsEditing(false)
      return
    }

    setIsSubmitting(true)
    try {
      const newPkg = PACKAGE_INFO[selectedType]

      if (isSupabaseConfigured() && user?.id) {
        await updateCoacheeProfile(user.id, {
          package_type: selectedType,
          total_sessions: newPkg.sessions
        })
      }

      setCoachingPackage({
        type: selectedType,
        totalSessions: newPkg.sessions,
        completedSessions: coachingPackage?.completedSessions || 0,
        currentSession: coachingPackage?.currentSession || 1
      })

      setIsEditing(false)
    } catch (err) {
      console.error('패키지 변경 실패:', err)
      alert('패키지 변경에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedType(coachingPackage?.type || 'basic')
    setIsEditing(false)
  }

  // 패키지 변경 모드
  if (isEditing) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">패키지 변경</span>
            <button onClick={handleCancel} className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(PACKAGE_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                selectedType === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold">{info.name}</span>
                <span className="text-sm opacity-70">{info.sessions}회기</span>
              </div>
              {selectedType === key && <Check className="w-5 h-5" />}
              {key === coachingPackage?.type && selectedType !== key && (
                <span className="text-xs opacity-60">현재</span>
              )}
            </button>
          ))}
          <Button
            onClick={handleChangePackage}
            disabled={isSubmitting || selectedType === coachingPackage?.type}
            className="w-full mt-2"
          >
            {isSubmitting ? '변경 중...' : selectedType === coachingPackage?.type ? '현재 패키지입니다' : '변경하기'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
              {pkg.name} 패키지
            </span>
            <span className="text-xs text-white/60">{pkg.description}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              변경
            </button>
            <div className="text-2xl font-black">
              {actualCompleted}/{totalSessions}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 진행바 */}
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* 회기 표시 */}
        <div className="flex justify-between">
          {sessionsArray.map((n) => {
            const isDone = n < currentSession
            const isActive = n === currentSession

            return (
              <div key={n} className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${isDone ? 'bg-emerald-500' : isActive ? 'bg-amber-400 text-amber-900 animate-pulse' : 'bg-white/20'}
                  `}
                >
                  {isDone ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : isActive ? (
                    <PlayCircle className="w-4 h-4" />
                  ) : (
                    n
                  )}
                </div>
                <span className="text-[10px] text-white/60">{n}회기</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
