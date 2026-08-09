import { PartyPopper, TrendingUp, TrendingDown, Minus, BookOpen, Award } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function SessionSummaryCard({ message, userRole }) {
  const navigate = useNavigate()
  const metadata = message.metadata || {}
  const { sessionNumber, summary, scoreChanges = [], isLastSession } = metadata

  const handleReflectionClick = () => {
    if (userRole === 'coachee') {
      navigate('/coachee/reflections')
    }
  }

  const handleReportClick = () => {
    if (userRole === 'coachee') {
      navigate('/coachee/report')
    }
  }

  return (
    <div className={`w-72 rounded-xl border-2 overflow-hidden text-sm ${
      isLastSession ? 'border-yellow-300 bg-gradient-to-b from-yellow-50 to-orange-50' : 'border-blue-200 bg-white'
    }`}>
      {/* 헤더 */}
      <div className={`px-3 py-2 flex items-center justify-between ${
        isLastSession ? 'bg-gradient-to-r from-yellow-100 to-orange-100' : 'bg-blue-50'
      }`}>
        <div className="flex items-center gap-1.5">
          {isLastSession ? (
            <Award className="w-4 h-4 text-yellow-600" />
          ) : (
            <PartyPopper className="w-4 h-4 text-blue-600" />
          )}
          <span className={`font-medium ${isLastSession ? 'text-yellow-800' : 'text-blue-800'}`}>
            {isLastSession ? '코칭 완료!' : `${sessionNumber}회기 종료`}
          </span>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
          isLastSession ? 'bg-yellow-200 text-yellow-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {sessionNumber}회기
        </span>
      </div>

      {/* 내용 */}
      <div className="p-3 space-y-3">
        {/* 세션 요약 */}
        {summary && (
          <div>
            <p className="text-xs text-gray-500 mb-1">오늘의 주제</p>
            <p className="text-gray-800 font-medium">{summary}</p>
          </div>
        )}

        {/* 점수 변화 */}
        {scoreChanges.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-2 space-y-1.5">
            <p className="text-xs text-gray-500 mb-1">점수 변화</p>
            {scoreChanges.map((change, idx) => {
              const diff = change.newScore - change.previousScore
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 truncate flex-1">{change.title}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">{change.previousScore}</span>
                    <span className="text-gray-300">→</span>
                    <span className={`font-semibold ${
                      diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {change.newScore}
                    </span>
                    {diff > 0 && <TrendingUp className="w-3 h-3 text-green-500" />}
                    {diff < 0 && <TrendingDown className="w-3 h-3 text-red-500" />}
                    {diff === 0 && <Minus className="w-3 h-3 text-gray-400" />}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 액션 버튼 (피코치만) */}
        {userRole === 'coachee' && (
          <div className="space-y-1.5 pt-1">
            <button
              onClick={handleReflectionClick}
              className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              성찰일지 작성하기
            </button>

            {isLastSession && (
              <button
                onClick={handleReportClick}
                className="w-full py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg text-xs font-medium hover:from-yellow-600 hover:to-orange-600 transition-colors flex items-center justify-center gap-1"
              >
                <Award className="w-3.5 h-3.5" />
                결과 보고서 보기
              </button>
            )}
          </div>
        )}

        {/* 코치용 안내 */}
        {userRole === 'coach' && (
          <p className="text-xs text-gray-500 text-center pt-1">
            피코치에게 회기 종료 안내가 전송되었습니다.
          </p>
        )}
      </div>
    </div>
  )
}
