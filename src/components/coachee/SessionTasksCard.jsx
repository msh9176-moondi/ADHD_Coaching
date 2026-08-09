import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { ListChecks, CheckSquare, Square } from 'lucide-react'

export function SessionTasksCard() {
  const { sessionTasks, toggleSessionTask, coachingPackage } = useStore()

  // 미완료 과제만 필터링
  const pendingTasks = sessionTasks.filter((t) => !t.completed)
  const completedTasks = sessionTasks.filter((t) => t.completed)

  if (sessionTasks.length === 0) {
    return null
  }

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-amber-800">
          <ListChecks className="w-4 h-4" />
          다음 회기까지 과제
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* 미완료 과제 */}
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-100"
            >
              <button
                onClick={() => toggleSessionTask(task.id)}
                className="flex-shrink-0 mt-0.5"
              >
                <Square className="w-5 h-5 text-amber-500" />
              </button>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{task.content}</p>
                <span className="text-xs text-amber-600 mt-1 inline-block">
                  {task.sessionNumber}회기 과제
                </span>
              </div>
            </div>
          ))}

          {/* 완료된 과제 */}
          {completedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-amber-100/50"
            >
              <button
                onClick={() => toggleSessionTask(task.id)}
                className="flex-shrink-0 mt-0.5"
              >
                <CheckSquare className="w-5 h-5 text-emerald-500" />
              </button>
              <div className="flex-1">
                <p className="text-sm text-gray-400 line-through">{task.content}</p>
                <span className="text-xs text-gray-400 mt-1 inline-block">
                  {task.sessionNumber}회기 과제
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 완료 현황 */}
        <div className="mt-4 pt-3 border-t border-amber-200/50">
          <p className="text-xs text-amber-700 text-center">
            {completedTasks.length}/{sessionTasks.length}개 완료
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
