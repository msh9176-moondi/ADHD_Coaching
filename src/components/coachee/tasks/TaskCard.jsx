import { CheckCircle2, Circle, Clock, MapPin, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '../../common/Card'
import { Badge } from '../../common/Badge'

export function TaskCard({ task, onClick, onComplete }) {
  const progress = task.targetCount > 0
    ? (task.completedCount / task.targetCount) * 100
    : 0
  // 완료 또는 제출완료 상태 모두 완료로 표시
  const isCompleted = task.status === 'completed' || task.status === 'submitted'
  const isSubmitted = task.status === 'submitted'
  const needsDetails = !task.detailsCompleted && !task.minAction && !isCompleted

  const getDueDateStatus = () => {
    if (!task.dueDate) return null
    const due = new Date(task.dueDate)
    const today = new Date()
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: '기한 지남', color: 'text-red-600 bg-red-50' }
    if (diffDays === 0) return { text: '오늘까지', color: 'text-amber-600 bg-amber-50' }
    if (diffDays === 1) return { text: '내일까지', color: 'text-amber-600 bg-amber-50' }
    return { text: `${diffDays}일 남음`, color: 'text-gray-600 bg-gray-100' }
  }
  const dueStatus = getDueDateStatus()

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${isCompleted ? 'bg-green-50' : ''}`}
      onClick={onClick}
    >
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!isCompleted) onComplete()
            }}
            className={`p-2 rounded-full transition-colors ${
              isCompleted
                ? 'bg-green-100'
                : 'bg-blue-100 hover:bg-blue-200'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Circle className="w-5 h-5 text-blue-600" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className={`font-medium truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {task.title}
              </h4>
              {task.targetCount > 0 && (
                <Badge variant={isCompleted ? 'success' : 'primary'}>
                  {task.completedCount}/{task.targetCount}
                </Badge>
              )}
              {isSubmitted && (
                <Badge variant="success" className="text-xs">
                  제출완료
                </Badge>
              )}
              {needsDetails && (
                <Badge variant="warning" className="text-xs">
                  상세설정 필요
                </Badge>
              )}
            </div>

            {task.description && (
              <p className="text-sm text-gray-500 mb-2 line-clamp-1">{task.description}</p>
            )}

            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              {dueStatus && (
                <span className={`px-2 py-0.5 rounded-full ${dueStatus.color}`}>
                  {dueStatus.text}
                </span>
              )}
              {task.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {task.location}
                </span>
              )}
              {task.signal && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.signal}
                </span>
              )}
            </div>

            {task.targetCount > 0 && (
              <div className="mt-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCompleted ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}
