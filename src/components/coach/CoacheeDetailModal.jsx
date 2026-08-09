import { useMemo } from 'react'
import { Modal } from '../common/Modal'
import { Card, CardContent } from '../common/Card'
import { ADHD_TYPES, analyzeADHDType, analyzeCoachingPriorities } from '../../data/coachData'
import { SURVEY_CATEGORIES } from '../../data/surveyData'
import {
  X, Brain, ClipboardList, Target, TrendingUp, User,
  Phone, Mail, Calendar, CheckCircle, AlertTriangle, Zap, Layers
} from 'lucide-react'

const TYPE_ICONS = {
  inattention: Brain,
  hyperactivity: Zap,
  impulsivity: AlertTriangle,
  combined: Layers
}

const TYPE_COLORS = {
  inattention: 'purple',
  hyperactivity: 'orange',
  impulsivity: 'red',
  combined: 'blue'
}

export function CoacheeDetailModal({ isOpen, onClose, coachee }) {
  if (!coachee) return null

  const { asrsResult, preSurvey, user: coacheeUser } = coachee

  // 분석 결과 계산
  const adhdTypeResult = useMemo(() => {
    if (!asrsResult) return null
    return analyzeADHDType(asrsResult)
  }, [asrsResult])

  const coachingPriorities = useMemo(() => {
    if (!preSurvey?.categoryScores) return []
    return analyzeCoachingPriorities(preSurvey.categoryScores)
  }, [preSurvey])

  const primaryType = adhdTypeResult?.primaryType
  const typeInfo = primaryType ? ADHD_TYPES[primaryType] : null
  const TypeIcon = primaryType ? TYPE_ICONS[primaryType] : Brain
  const typeColor = primaryType ? TYPE_COLORS[primaryType] : 'blue'

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="relative">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{coacheeUser?.name || '피코치'}</h2>
              <p className="text-sm text-gray-500">피코치 상세 정보</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                기본 정보
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {coacheeUser?.email || '-'}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {coacheeUser?.phone || '-'}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  가입일: {coacheeUser?.createdAt ? new Date(coacheeUser.createdAt).toLocaleDateString() : '-'}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  ADHD 상태: {coacheeUser?.adhdStatus === 'diagnosed' ? '진단받음' :
                            coacheeUser?.adhdStatus === 'suspected' ? '의심됨' : '확인 중'}
                </div>
              </div>

              {coacheeUser?.difficulties?.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm text-gray-500 block mb-2">주요 어려움</span>
                  <div className="flex flex-wrap gap-1.5">
                    {coacheeUser.difficulties.map((diff, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {diff}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ADHD 자가진단 결과 */}
          {asrsResult ? (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  ADHD 자가진단 결과
                </h3>

                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-${typeColor}-100 flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className={`w-6 h-6 text-${typeColor}-600`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{typeInfo?.name || 'ADHD 특성'}</h4>
                    <p className="text-sm text-gray-600">{asrsResult.interpretation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{asrsResult.inattentionScore}</div>
                    <div className="text-xs text-gray-500">주의력</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{asrsResult.hyperactivityScore}</div>
                    <div className="text-xs text-gray-500">과잉행동</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">{asrsResult.impulsivityScore}</div>
                    <div className="text-xs text-gray-500">충동성</div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">총점</span>
                    <span className="font-semibold">{asrsResult.totalScore} / {asrsResult.maxScore}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-gray-500">
                <Brain className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                ADHD 자가진단을 아직 완료하지 않았습니다.
              </CardContent>
            </Card>
          )}

          {/* 코칭 설문 결과 */}
          {preSurvey ? (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-emerald-500" />
                  코칭 설문 결과
                </h3>

                <div className="space-y-3">
                  {SURVEY_CATEGORIES.map(cat => {
                    const score = preSurvey.categoryScores?.[cat.id]?.average || 0
                    const percentage = (score / 5) * 100

                    return (
                      <div key={cat.id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">{cat.name}</span>
                          <span className="text-sm font-medium">{score.toFixed(1)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-${cat.color}-500 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-medium text-gray-700">전체 평균</span>
                  <span className="text-xl font-bold text-emerald-600">
                    {preSurvey.categoryScores?.total?.toFixed(1) || '-'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-gray-500">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                코칭 설문을 아직 완료하지 않았습니다.
              </CardContent>
            </Card>
          )}

          {/* 코칭 우선순위 영역 */}
          {coachingPriorities.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-500" />
                  코칭 필요 영역 (우선순위)
                </h3>

                <div className="space-y-3">
                  {coachingPriorities.slice(0, 3).map((area, idx) => (
                    <div
                      key={area.id}
                      className={`p-3 rounded-lg border ${
                        idx === 0 ? 'border-red-200 bg-red-50' :
                        idx === 1 ? 'border-amber-200 bg-amber-50' :
                        'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          {idx + 1}. {area.name}
                        </span>
                        <span className={`text-sm font-medium ${
                          idx === 0 ? 'text-red-600' :
                          idx === 1 ? 'text-amber-600' : 'text-gray-600'
                        }`}>
                          {area.score.toFixed(1)}점
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{area.lowScoreMessage}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 추천 코칭 방향 */}
          {typeInfo && (
            <Card className="bg-emerald-50 border-emerald-100">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  추천 코칭 방향
                </h3>
                <p className="text-sm text-blue-800 mb-3">{typeInfo.coachingDirection}</p>
                <div className="space-y-1">
                  {typeInfo.recommendedActions.slice(0, 3).map((action, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle className="w-3 h-3" />
                      {action}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Modal>
  )
}
