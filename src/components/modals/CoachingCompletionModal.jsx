import { useNavigate } from 'react-router-dom'
import { Modal } from '../common/Modal'
import { Trophy, Sparkles, Calendar, ArrowRight, Heart, Brain, Leaf } from 'lucide-react'

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

  const handleUltramind = () => {
    onClose()
    navigate('/coachee/ultramind')
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

        {/* 다음 단계 선택 */}
        <p className="text-sm text-gray-500 mb-4">다음 단계를 선택하세요</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* 구독 옵션 */}
          <button
            onClick={handleSubscribe}
            className="group p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-left transition-all border-2 border-transparent hover:border-emerald-300"
          >
            <div className="w-10 h-10 bg-emerald-100 group-hover:bg-emerald-200 rounded-lg flex items-center justify-center mb-3 transition-colors">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">사후관리 구독</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {coachName || '담당 코치'}님과 매월 세션을 이어가세요
            </p>
            <div className="mt-3 flex items-center text-emerald-600 text-xs font-medium">
              시작하기 <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </button>

          {/* 울트라마인드 옵션 */}
          <button
            onClick={handleUltramind}
            className="group p-4 bg-violet-50 hover:bg-violet-100 rounded-xl text-left transition-all border-2 border-transparent hover:border-violet-300"
          >
            <div className="w-10 h-10 bg-violet-100 group-hover:bg-violet-200 rounded-lg flex items-center justify-center mb-3 transition-colors">
              <Brain className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">Ultra Mind</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              6주 맞춤형 건강 프로그램으로 뇌 최적화
            </p>
            <div className="mt-3 flex items-center text-violet-600 text-xs font-medium">
              알아보기 <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </button>
        </div>

        {/* 프로그램 비교 */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Leaf className="w-3 h-3" />
            <span>두 프로그램을 함께 진행할 수도 있어요</span>
          </div>
        </div>

        {/* 나중에 버튼 */}
        <button
          onClick={handleLater}
          className="w-full px-6 py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm"
        >
          나중에 결정할게요
        </button>
      </div>
    </Modal>
  )
}
