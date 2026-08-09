import { ClipboardList, Clock, CheckCircle, Send, FileText } from 'lucide-react'

export function TaskCard({ message, userRole, onComplete, onSubmit }) {
  const { taskData } = message

  // taskData가 없으면 렌더링하지 않음
  if (!taskData) {
    return null
  }

  const { title, description, dueDate, status, submission } = taskData

  const isCompleted = status === 'completed'
  const hasSubmission = !!submission
  const isCoachee = userRole === 'coachee'

  // 기한 표시
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return '오늘'
    if (date.toDateString() === tomorrow.toDateString()) return '내일'
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const dueDateText = formatDueDate(dueDate)
  const isPastDue = dueDate && new Date(dueDate) < new Date() && !isCompleted

  return (
    <div className={`w-64 rounded-xl border-2 overflow-hidden text-sm ${
      isCompleted ? 'border-green-200 bg-green-50' : isPastDue ? 'border-red-200 bg-red-50' : 'border-teal-200 bg-white'
    }`}>
      {/* 헤더 */}
      <div className={`px-3 py-2 flex items-center justify-between ${
        isCompleted ? 'bg-green-100' : isPastDue ? 'bg-red-100' : 'bg-teal-50'
      }`}>
        <div className="flex items-center gap-1.5">
          <ClipboardList className={`w-4 h-4 ${
            isCompleted ? 'text-green-600' : isPastDue ? 'text-red-600' : 'text-teal-600'
          }`} />
          <span className={`font-medium ${
            isCompleted ? 'text-green-800' : isPastDue ? 'text-red-800' : 'text-teal-800'
          }`}>과제</span>
        </div>
        {dueDateText && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
            isCompleted ? 'bg-green-200 text-green-700' : isPastDue ? 'bg-red-200 text-red-700' : 'bg-teal-100 text-teal-700'
          }`}>
            <Clock className="w-3 h-3" />
            {dueDateText}
          </span>
        )}
      </div>

      {/* 내용 */}
      <div className="p-3 space-y-2">
        <p className={`font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
          {title}
        </p>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}

        {/* 제출된 내용 미리보기 */}
        {hasSubmission && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
              <FileText className="w-3 h-3" />
              제출 완료
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">{submission.content}</p>
            {submission.images?.length > 0 && (
              <p className="text-xs text-blue-500 mt-1">
                + 이미지 {submission.images.length}개
              </p>
            )}
          </div>
        )}

        {/* 과제 제출 버튼 (피코치만, 미완료 상태일 때) */}
        {isCoachee && !isCompleted && (
          <div className="space-y-1.5 mt-2">
            <button
              onClick={() => onSubmit && onSubmit(message.id)}
              className="w-full py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              과제 제출하기
            </button>
            {!hasSubmission && (
              <button
                onClick={onComplete}
                className="w-full py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                제출 없이 완료
              </button>
            )}
          </div>
        )}

        {/* 완료 상태 */}
        {isCompleted && (
          <div className="flex items-center justify-center gap-1 text-green-600 text-xs pt-1">
            <CheckCircle className="w-3 h-3" /> 완료
          </div>
        )}
      </div>
    </div>
  )
}
