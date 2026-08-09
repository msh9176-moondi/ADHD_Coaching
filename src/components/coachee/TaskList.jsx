import { useState, useEffect, useRef } from 'react'
import { Target } from 'lucide-react'
import { Card, CardContent } from '../common/Card'
import { TaskCard, TaskDetailModal, TaskEditModal, TaskSubmitModal } from './tasks'

export function TaskList({ tasks: propTasks, onTaskUpdate }) {
  const [tasks, setTasks] = useState(propTasks || [])
  const prevTasksRef = useRef()

  // props가 실제로 변경되었을 때만 업데이트
  useEffect(() => {
    const prevTasks = prevTasksRef.current
    const currentTasks = propTasks || []

    // 이전 값과 다를 때만 업데이트
    if (JSON.stringify(prevTasks) !== JSON.stringify(currentTasks)) {
      setTasks(currentTasks)
    }
    prevTasksRef.current = currentTasks
  }, [propTasks])

  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [submittingTask, setSubmittingTask] = useState(null)

  const handleUpdateTask = (taskId, updates) => {
    // 로컬 상태 업데이트
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    ))
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => ({ ...prev, ...updates }))
    }
    // Supabase에 저장
    if (onTaskUpdate) {
      onTaskUpdate(taskId, updates)
    }
  }

  const handleCompleteOne = (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const currentCount = task.completedCount || 0
    const targetCount = task.targetCount || 5

    // 이미 목표에 도달했거나 완료된 경우 무시
    if (currentCount >= targetCount || task.status === 'completed') {
      return
    }

    const newCount = currentCount + 1
    const updates = {
      completedCount: newCount,
      status: newCount >= targetCount ? 'completed' : 'in_progress'
    }

    // 로컬 상태 업데이트
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    ))

    // 모달에 표시된 selectedTask도 업데이트
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => ({ ...prev, ...updates }))
    }

    // Supabase에 저장
    if (onTaskUpdate) {
      onTaskUpdate(taskId, updates)
    }
  }

  const handleSubmitTask = (taskId, submission) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // 제출 데이터 추가 (status는 진행 상태에 따라 결정)
    const completedCount = task.completedCount || 0
    const targetCount = task.targetCount || 1

    // 완료 여부는 횟수로 판단, 제출 여부는 별도 플래그
    const updates = {
      submission: {
        ...submission,
        submittedAt: new Date().toISOString()
      },
      hasSubmission: true,
      // status는 횟수 기반으로 유지 (제출해도 진행 중 상태 유지)
      status: completedCount >= targetCount ? 'completed' : (completedCount > 0 ? 'in_progress' : 'pending')
    }

    // 로컬 상태 업데이트
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    ))

    // Supabase에 저장
    if (onTaskUpdate) {
      onTaskUpdate(taskId, updates)
    }

    setSubmittingTask(null)
    setSelectedTask(null)
  }

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              아직 배정된 과제가 없어요
            </h3>
            <p className="text-gray-600">
              코치님이 채팅에서 과제를 보내면 여기에 표시됩니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => setSelectedTask(task)}
            onComplete={() => handleCompleteOne(task.id)}
          />
        ))
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={() => {
            setEditingTask(selectedTask)
            setSelectedTask(null)
          }}
          onComplete={() => handleCompleteOne(selectedTask.id)}
          onSubmit={() => {
            setSubmittingTask(selectedTask)
            setSelectedTask(null)
          }}
        />
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(updates) => {
            handleUpdateTask(editingTask.id, { ...updates, detailsCompleted: true })
            setEditingTask(null)
          }}
        />
      )}

      {submittingTask && (
        <TaskSubmitModal
          task={submittingTask}
          onClose={() => setSubmittingTask(null)}
          onSubmit={(submission) => handleSubmitTask(submittingTask.id, submission)}
        />
      )}
    </div>
  )
}
