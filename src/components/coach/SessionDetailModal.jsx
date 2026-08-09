import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import {
  FileText, Calendar, Target, MessageCircle,
  TrendingUp, CheckCircle, AlertTriangle, Edit3, X
} from 'lucide-react'

export function SessionDetailModal({ isOpen, onClose, coachee, session, onEdit }) {
  if (!isOpen || !session) return null

  const conditionLabels = {
    excellent: { label: '매우 좋음', color: 'bg-green-100 text-green-700' },
    good: { label: '좋음', color: 'bg-emerald-100 text-emerald-700' },
    normal: { label: '보통', color: 'bg-gray-100 text-gray-700' },
    tired: { label: '지침', color: 'bg-yellow-100 text-yellow-700' },
    difficult: { label: '어려움', color: 'bg-red-100 text-red-700' }
  }

  const condition = conditionLabels[session.coacheeCondition] || conditionLabels.normal

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-emerald-600">{session.session}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{session.session}회기</h2>
                <Badge variant="primary">{session.topic}</Badge>
              </div>
              <p className="text-sm text-gray-500">
                {coachee?.name} · {session.date}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(session)}>
                <Edit3 className="w-4 h-4 mr-1" />
                수정
              </Button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="space-y-5">
          {/* 세션 요약 */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              세션 요약
            </h4>
            <p className="text-gray-700 leading-relaxed">
              {session.note || session.summary || '작성된 요약이 없습니다.'}
            </p>
          </div>

          {/* 진전 사항 */}
          {session.progress && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                진전 사항
              </h4>
              <p className="text-gray-700 leading-relaxed">{session.progress}</p>
            </div>
          )}

          {/* 실행 과제 */}
          {session.nextActions && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                다음 실행 과제
              </h4>
              <p className="text-gray-700 leading-relaxed">{session.nextActions}</p>
            </div>
          )}

          {/* 상태 정보 */}
          <div className="grid grid-cols-3 gap-4">
            {/* 피코치 컨디션 */}
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-2">피코치 컨디션</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${condition.color}`}>
                {condition.label}
              </span>
            </div>

            {/* 점수 변화 */}
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-2">점수 변화</p>
              {session.scoreChange !== undefined ? (
                <span className={`text-lg font-bold ${
                  session.scoreChange > 0 ? 'text-green-600' :
                  session.scoreChange < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {session.scoreChange > 0 ? '+' : ''}{session.scoreChange}점
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>

            {/* 날짜 */}
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-2">세션 일자</p>
              <span className="text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 inline mr-1" />
                {session.date}
              </span>
            </div>
          </div>

          {/* 주의 사항 */}
          {session.warnings && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <h4 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                주의 사항
              </h4>
              <p className="text-amber-800 leading-relaxed">{session.warnings}</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </Modal>
  )
}
