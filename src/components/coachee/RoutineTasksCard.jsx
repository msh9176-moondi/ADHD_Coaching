import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { getOrCreateConversation, getMessages, updateMessageMetadata } from '../../lib/messageService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Target, CheckCircle2, Circle, ChevronRight, Loader2 } from 'lucide-react'

export function RoutineTasksCard() {
  const navigate = useNavigate()
  const { user, matchedCoach } = useStore()
  const [routineTasks, setRoutineTasks] = useState([])
  const [loading, setLoading] = useState(true)

  // 루틴 과제 로드
  useEffect(() => {
    async function loadRoutineTasks() {
      if (!user?.id || !matchedCoach?.coachId || !isSupabaseConfigured()) {
        setLoading(false)
        return
      }

      try {
        const conversation = await getOrCreateConversation(matchedCoach.coachId, user.id)
        const messages = await getMessages(conversation.id, 200)

        // 루틴 과제만 필터링
        const taskMessages = messages.filter(m => {
          const taskData = m.metadata?.taskData || {}
          return (m.type === 'task' || m.metadata?.type === 'task') && taskData.taskType === 'routine'
        })

        const tasks = taskMessages.map(m => {
          const taskData = m.metadata?.taskData || {}
          const targetCount = taskData.targetCount || 5
          const completedCount = Math.min(taskData.completedCount || 0, targetCount)
          const isCompleted = completedCount >= targetCount

          return {
            id: m.id,
            title: taskData.title || '과제',
            targetCount,
            completedCount,
            status: isCompleted ? 'completed' : (completedCount > 0 ? 'in_progress' : 'pending'),
            dueDate: taskData.dueDate
          }
        })

        // 미완료 과제만 표시 (최대 3개)
        const pendingTasks = tasks.filter(t => t.status !== 'completed').slice(0, 3)
        setRoutineTasks(pendingTasks)
      } catch (err) {
        console.error('루틴 과제 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRoutineTasks()
  }, [user?.id, matchedCoach?.coachId])

  // 1회 완료 처리
  const handleCompleteOne = async (taskId) => {
    const task = routineTasks.find(t => t.id === taskId)
    if (!task || task.completedCount >= task.targetCount) return

    const newCount = task.completedCount + 1
    const newStatus = newCount >= task.targetCount ? 'completed' : 'in_progress'

    // 로컬 상태 업데이트
    setRoutineTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, completedCount: newCount, status: newStatus }
        : t
    ).filter(t => t.status !== 'completed')) // 완료되면 목록에서 제거

    // Supabase 저장
    if (isSupabaseConfigured()) {
      try {
        await updateMessageMetadata(taskId, {
          type: 'task',
          taskData: {
            ...task,
            completedCount: newCount,
            status: newStatus
          }
        })
      } catch (err) {
        console.error('과제 업데이트 실패:', err)
      }
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    )
  }

  if (routineTasks.length === 0) {
    return null
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-blue-800">
            <Target className="w-4 h-4" />
            오늘의 루틴
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/coachee/tasks')}
            className="text-blue-600 hover:text-blue-700 -mr-2"
          >
            전체보기
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {routineTasks.map((task) => {
          const progress = Math.round((task.completedCount / task.targetCount) * 100)

          return (
            <div
              key={task.id}
              className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                <span className="text-xs text-blue-600 font-medium">
                  {task.completedCount}/{task.targetCount}회
                </span>
              </div>

              {/* 진행률 바 */}
              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* 체크 버튼들 */}
              <div className="flex items-center gap-1">
                {Array.from({ length: task.targetCount }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => i === task.completedCount && handleCompleteOne(task.id)}
                    disabled={i !== task.completedCount}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      i < task.completedCount
                        ? 'bg-blue-500 text-white'
                        : i === task.completedCount
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
                        : 'bg-gray-100 text-gray-300'
                    }`}
                  >
                    {i < task.completedCount ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
