import { useNavigate } from 'react-router-dom'
import { Modal } from '../common/Modal'
import { Trophy, Sparkles, Calendar, ArrowRight, Heart } from 'lucide-react'

export function CoachingCompletionModal({
  isOpen,
  onClose,
  coacheeName,
  completedSessions,
  coachName
}) {
  const navigate = useNavigate()

  const handleSubscribe = () => {
    onClose()
    navigate('/coachee/subscribe')
  }

  const handleLater = () => {
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center py-4">
        {/* 축하 아이콘 */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-emerald-500 rounded-full animate-pulse" />
          <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-500" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-amber-400" />
        </div>

        {/* 축하 메시지 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          코칭 프로그램 완료!
        </h2>
        <p className="text-gray-600 mb-6">
          {coacheeName || '회원'}님, {completedSessions}회 세션을 모두 마치셨습니다.
          <br />
          함께한 여정에 감사드립니다!
        </p>

        {/* 성과 요약 카드 */}
        <div className="bg-gradient-to-r from-emerald-50 to-amber-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{completedSessions}</div>
              <div className="text-gray-500">완료 세션</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                <Heart className="w-6 h-6 inline" />
              </div>
              <div className="text-gray-500">성장 완료</div>
            </div>
          </div>
        </div>

        {/* 구독 안내 */}
        <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-left">
          <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            사후관리 구독으로 성장을 이어가세요
          </h3>
          <ul className="text-sm text-emerald-700 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              매월 2회 사후관리 세션
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              {coachName || '담당 코치'}님과 계속 함께합니다
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              목표 달성 상태 점검 및 유지
            </li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="space-y-3">
          <button
            onClick={handleSubscribe}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-200"
          >
            구독 시작하기
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleLater}
            className="w-full px-6 py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            나중에 결정할게요
          </button>
        </div>
      </div>
    </Modal>
  )
}
