import { CheckCircle2, X, Lightbulb, Edit3, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../common/Card'
import { Button } from '../../common/Button'
import { AITaskSupportButton } from '../AITaskSupporter'
import { FIELD_GUIDES, COLOR_MAP } from '../../../data/taskFieldGuides'

function DetailItem({ guide, value }) {
  const Icon = guide.icon
  const colorClass = `${COLOR_MAP[guide.color].bg} ${COLOR_MAP[guide.color].text}`

  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <span className="text-sm font-medium text-gray-700">{guide.title}</span>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export function TaskDetailModal({ task, onClose, onEdit, onComplete, onSubmit }) {
  // 완료 또는 제출완료 상태 모두 완료로 표시
  const isCompleted = task.status === 'completed' || task.status === 'submitted'
  const isSubmitted = task.status === 'submitted'
  const needsDetails = !task.detailsCompleted && !task.minAction && !isCompleted

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className={isCompleted ? 'line-through text-gray-500' : ''}>
              {task.title}
            </CardTitle>
            {task.description && (
              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4">
          {needsDetails && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">실행 계획을 세워보세요</h4>
                  <p className="text-sm text-amber-700">
                    구체적인 실행 계획이 있으면 시작하기가 훨씬 쉬워집니다.
                    아래 버튼을 눌러 상세 설정을 추가해보세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {task.targetCount > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">진행 상황</span>
                <span className="text-sm text-gray-500">
                  {task.completedCount} / {task.targetCount}회
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isCompleted ? 'bg-green-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(task.completedCount / task.targetCount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {task.minAction && <DetailItem guide={FIELD_GUIDES.minAction} value={task.minAction} />}
          {task.location && <DetailItem guide={FIELD_GUIDES.location} value={task.location} />}
          {task.signal && <DetailItem guide={FIELD_GUIDES.signal} value={task.signal} />}
          {task.fallback && <DetailItem guide={FIELD_GUIDES.fallback} value={task.fallback} />}
          {task.returnAction && <DetailItem guide={FIELD_GUIDES.returnAction} value={task.returnAction} />}

          {isSubmitted && task.submission && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-800">제출 완료</span>
              </div>
              <p className="text-sm text-gray-600">{task.submission.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(task.submission.submittedAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* AI 서포터 - 미완료 과제에만 표시 */}
          {!isCompleted && !isSubmitted && (
            <AITaskSupportButton task={task} />
          )}

          <div className="flex gap-3 pt-4 border-t">
            {!isSubmitted && (
              <Button variant="outline" onClick={onEdit} className="flex-1">
                <Edit3 className="w-4 h-4 mr-2" />
                {needsDetails ? '상세 설정하기' : '수정하기'}
              </Button>
            )}
            {!isCompleted && !isSubmitted && (
              <>
                <Button variant="outline" onClick={onComplete} className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  완료 체크
                </Button>
                <Button onClick={onSubmit} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  제출하기
                </Button>
              </>
            )}
            {isSubmitted && (
              <Button variant="outline" onClick={onClose} className="flex-1">
                닫기
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
