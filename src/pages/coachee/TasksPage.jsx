import { useState, useEffect } from 'react'
import { TaskList } from '../../components/coachee/TaskList'
import { PageHeader } from '../../components/common/PageHeader'
import { useStore } from '../../store/useStore'
import { getOrCreateConversation, getMessages, updateMessageMetadata } from '../../lib/messageService'
import { isSupabaseConfigured } from '../../lib/supabase'

export function TasksPage() {
  const { user, matchedCoach } = useStore()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTasks() {
      if (!user?.id || !matchedCoach?.coachId || !isSupabaseConfigured()) {
        setLoading(false)
        return
      }

      try {
        // 대화방에서 과제 메시지 로드
        const conversation = await getOrCreateConversation(matchedCoach.coachId, user.id)
        const messages = await getMessages(conversation.id, 200)

        // task 타입 메시지에서 과제 데이터 추출
        const taskMessages = messages.filter(m => m.type === 'task' || m.metadata?.type === 'task')

        // task_submission 메시지에서 제출 상태 확인
        const submissionMessages = messages.filter(m =>
          m.type === 'task_submission' || m.metadata?.type === 'task_submission'
        )

        const taskList = taskMessages.map(m => {
          const taskData = m.metadata?.taskData || {}
          const taskType = taskData.taskType || 'routine'

          // 해당 과제의 제출물 찾기
          const submission = submissionMessages.find(sm => {
            const subData = sm.metadata?.submissionData || {}
            return subData.taskId === m.id
          })
          const submissionData = submission?.metadata?.submissionData
          const hasSubmission = !!submissionData || !!taskData.hasSubmission || !!taskData.submission

          // completedCount가 targetCount를 초과하지 않도록 보정
          const targetCount = taskData.targetCount || 5
          const completedCount = Math.min(taskData.completedCount || 0, targetCount)

          // 상태 결정: 타입별로 다르게 처리
          let status = taskData.status || 'pending'
          if (taskType === 'record') {
            // 기록 과제: 제출하면 완료
            status = hasSubmission ? 'completed' : 'pending'
          } else {
            // 루틴 과제: 횟수 기반
            if (completedCount >= targetCount) {
              status = 'completed'
            } else if (completedCount > 0) {
              status = 'in_progress'
            }
          }

          return {
            id: m.id,
            ...taskData,
            taskType,
            completedCount,
            hasSubmission,
            status,
            submission: submissionData || taskData.submission,
            createdAt: m.created_at
          }
        })

        // 루틴 과제만 필터링 (기록 과제는 채팅으로 제출)
        const routineTasks = taskList.filter(t => t.taskType === 'routine')
        setTasks(routineTasks)
      } catch (err) {
        console.error('과제 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [user?.id, matchedCoach?.coachId])

  // 과제 업데이트 핸들러 (Supabase에 저장)
  const handleTaskUpdate = async (taskId, updates) => {
    // 현재 task 찾기 (업데이트 전 상태)
    const task = tasks.find(t => t.id === taskId)

    // 로컬 상태 업데이트
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    ))

    // Supabase에 저장
    if (isSupabaseConfigured() && task) {
      try {
        const updatedTaskData = { ...task, ...updates }
        // id, createdAt 제외하고 taskData로 저장
        const { id, createdAt, ...taskDataToSave } = updatedTaskData
        await updateMessageMetadata(taskId, {
          type: 'task',  // 메시지 타입 유지
          taskData: taskDataToSave
        })
      } catch (err) {
        console.error('과제 업데이트 저장 실패:', err)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="실행 과제"
        description="코치가 배정한 과제를 확인하고 실행 결과를 기록하세요."
      />
      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : (
        <TaskList tasks={tasks} onTaskUpdate={handleTaskUpdate} />
      )}
    </div>
  )
}
