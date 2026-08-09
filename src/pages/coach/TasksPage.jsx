import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '../../components/common/Card'
import { Avatar } from '../../components/common/Avatar'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { StatCard } from '../../components/common/StatCard'
import { SearchInput } from '../../components/common/SearchInput'
import { LoadingContainer } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { PACKAGES } from '../../data/coachData'
import { useStore } from '../../store/useStore'
import { useCollapsibleList } from '../../hooks'
import { coacheeService } from '../../lib'
import { getOrCreateConversation, getMessages, sendMessage } from '../../lib/messageService'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  Plus, CheckCircle, Clock, AlertCircle,
  ChevronDown, ChevronRight, FileText, MessageCircle,
  Calendar, X, Send, User, Target, ClipboardList, Loader2
} from 'lucide-react'

// 패키지 색상 설정
const packageColors = {
  starter: 'bg-green-100 text-green-700',
  basic: 'bg-emerald-100 text-emerald-700',
  premium: 'bg-purple-100 text-purple-700'
}

export function TasksPage() {
  const { user } = useStore()
  const [coachees, setCoachees] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [preselectedCoacheeId, setPreselectedCoacheeId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  // useCollapsibleList 훅 사용
  const {
    isExpanded,
    toggle: toggleCoachee,
    expandAll: expandAllCoachees,
    collapseAll
  } = useCollapsibleList([])

  // 피코치 데이터 및 과제 로드
  useEffect(() => {
    async function loadCoacheesAndTasks() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await coacheeService.getCoachCoachees(user.id)
        const formatted = data.map(c => ({
          id: c.id,
          userId: c.user_id,  // 실제 사용자 ID (대화방용)
          name: c.name,
          email: c.email,
          packageType: c.package_type,
          currentSession: c.current_session || 0,
          totalSessions: c.total_sessions || 5,
          coachingGoal: c.coaching_goal,
          tasks: []
        }))
        setCoachees(formatted)

        // 각 피코치와의 대화에서 과제 메시지 로드
        if (isSupabaseConfigured()) {
          const allTasks = []

          for (const coachee of formatted) {
            // user_id가 없으면 스킵
            if (!coachee.userId) continue

            try {
              // user_id로 대화방 조회 (profile id가 아님)
              const conversation = await getOrCreateConversation(user.id, coachee.userId)
              const messages = await getMessages(conversation.id, 200)

              // task 타입 메시지에서 과제 추출
              const taskMessages = messages.filter(m =>
                m.type === 'task' || m.metadata?.type === 'task'
              )

              // task_submission 메시지로 제출 상태 확인
              const submissionMessages = messages.filter(m =>
                m.type === 'task_submission' || m.metadata?.type === 'task_submission'
              )

              taskMessages.forEach(msg => {
                const taskData = msg.metadata?.taskData || msg.taskData || {}
                const taskId = msg.id

                // 1. 먼저 taskData 내부의 submission 확인 (피코치가 제출 시 여기에 저장)
                let submissionData = taskData.submission || null

                // 2. 별도의 task_submission 메시지도 확인 (대체 방식)
                if (!submissionData) {
                  const submission = submissionMessages.find(sm => {
                    const subData = sm.metadata?.submissionData || sm.submissionData
                    return subData?.taskId === taskId
                  })
                  submissionData = submission?.metadata?.submissionData || submission?.submissionData || null
                }

                // 과제 타입
                const taskType = taskData.taskType || 'routine'
                const completedCount = taskData.completedCount || 0
                const targetCount = taskData.targetCount || 1
                const hasSubmission = !!submissionData || !!taskData.hasSubmission

                // 상태 결정: 타입별로 다르게 처리
                let status = 'not_started'
                if (taskType === 'record') {
                  // 기록 과제: 제출하면 완료
                  if (hasSubmission) {
                    status = 'completed'
                  }
                } else {
                  // 루틴 과제: 횟수 기반
                  if (taskData.status === 'completed' || completedCount >= targetCount) {
                    status = 'completed'
                  } else if (taskData.status === 'in_progress' || completedCount > 0) {
                    status = 'in_progress'
                  }
                }

                allTasks.push({
                  id: taskId,
                  title: taskData.title || '과제',
                  description: taskData.description || '',
                  dueDate: taskData.dueDate || '',
                  taskType: taskType,
                  status: status,
                  hasSubmission: hasSubmission,
                  completedCount: completedCount,
                  targetCount: targetCount,
                  submission: submissionData ? {
                    content: submissionData.content,
                    images: submissionData.images,
                    submittedAt: submissionData.submittedAt,
                    feedback: submissionData.feedback
                  } : null,
                  coacheeId: coachee.id,
                  coacheeName: coachee.name,
                  createdAt: msg.created_at
                })
              })
            } catch (err) {
              console.warn(`${coachee.name} 과제 로드 실패:`, err)
            }
          }

          setTasks(allTasks)
        }
      } catch (err) {
        console.warn('피코치 로드 실패:', err)
        setCoachees([])
      } finally {
        setLoading(false)
      }
    }
    loadCoacheesAndTasks()
  }, [user?.id])

  // 피코치별로 과제 그룹화
  const coacheesWithTasks = useMemo(() => {
    return coachees.map(coachee => {
      const coacheeTasks = tasks.filter(t => t.coacheeId === coachee.id)
      return {
        ...coachee,
        tasks: coacheeTasks,
        pendingCount: coacheeTasks.filter(t => t.status !== 'completed').length,
        completedCount: coacheeTasks.filter(t => t.status === 'completed').length,
        submittedCount: coacheeTasks.filter(t => t.hasSubmission && t.status !== 'completed').length
      }
    })
  }, [coachees, tasks])

  // 검색 필터링
  const filteredCoachees = coacheesWithTasks.filter(coachee =>
    !searchQuery || coachee.name.includes(searchQuery)
  )

  // 전체 통계
  const totalStats = useMemo(() => {
    return {
      totalCoachees: coacheesWithTasks.length,
      totalTasks: tasks.length,
      pending: tasks.filter(t => t.status !== 'completed').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      submitted: tasks.filter(t => t.hasSubmission && t.status !== 'completed').length
    }
  }, [tasks, coacheesWithTasks])

  const expandAll = () => {
    expandAllCoachees(coacheesWithTasks.map(c => c.id))
  }

  const handleAssignTask = async (newTask) => {
    // 선택한 피코치 찾기
    const coachee = coachees.find(c => c.id === newTask.coacheeId)
    if (!coachee?.userId || !user?.id || !isSupabaseConfigured()) {
      // Supabase 없으면 로컬 상태만 업데이트
      setTasks(prev => [...prev, {
        ...newTask,
        id: `t-${Date.now()}`,
        status: 'not_started'
      }])
      setIsAssignModalOpen(false)
      return
    }

    try {
      // 대화방 조회 또는 생성
      const conversation = await getOrCreateConversation(user.id, coachee.userId)

      // 과제 타입에 따른 메시지 생성
      const taskTypeLabel = newTask.taskType === 'routine' ? '🔄 루틴 과제' : '📝 기록 과제'
      const countInfo = newTask.taskType === 'routine' ? `\n🎯 목표: ${newTask.targetCount}회` : ''
      const taskMessage = `${taskTypeLabel}가 부여되었습니다!\n\n**${newTask.title}**${newTask.description ? `\n\n${newTask.description}` : ''}${countInfo}\n\n📅 마감일: ${newTask.dueDate}`

      const taskData = {
        title: newTask.title,
        description: newTask.description || '',
        dueDate: newTask.dueDate,
        taskType: newTask.taskType || 'routine',
        targetCount: newTask.targetCount || 1,
        completedCount: 0,
        status: 'not_started'
      }

      // 채팅으로 과제 메시지 전송
      await sendMessage(
        conversation.id,
        user.id,
        'coach',
        taskMessage,
        'task',
        { type: 'task', taskData }
      )

      // 과제 목록 새로고침을 위해 페이지 데이터 리로드
      const data = await coacheeService.getCoachCoachees(user.id)
      const formatted = data.map(c => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        email: c.email,
        packageType: c.package_type,
        currentSession: c.current_session || 0,
        totalSessions: c.total_sessions || 5,
        coachingGoal: c.coaching_goal,
        tasks: []
      }))

      // 각 피코치의 과제 다시 로드
      const allTasks = []
      for (const coacheeItem of formatted) {
        if (!coacheeItem.userId) continue
        try {
          const conv = await getOrCreateConversation(user.id, coacheeItem.userId)
          const messages = await getMessages(conv.id, 200)

          const taskMessages = messages.filter(m =>
            m.type === 'task' || m.metadata?.type === 'task'
          )

          const submissionMessages = messages.filter(m =>
            m.type === 'task_submission' || m.metadata?.type === 'task_submission'
          )

          taskMessages.forEach(msg => {
            const tData = msg.metadata?.taskData || msg.taskData || {}
            const taskId = msg.id

            // 1. taskData 내부의 submission 확인
            let submissionData = tData.submission || null

            // 2. 별도의 task_submission 메시지도 확인
            if (!submissionData) {
              const submission = submissionMessages.find(sm => {
                const subData = sm.metadata?.submissionData || sm.submissionData
                return subData?.taskId === taskId
              })
              submissionData = submission?.metadata?.submissionData || submission?.submissionData || null
            }

            // 과제 타입
            const taskType = tData.taskType || 'routine'
            const completedCount = tData.completedCount || 0
            const targetCount = tData.targetCount || 1
            const hasSubmission = !!submissionData || !!tData.hasSubmission

            // 상태 결정: 타입별로 다르게 처리
            let status = 'not_started'
            if (taskType === 'record') {
              // 기록 과제: 제출하면 완료
              if (hasSubmission) {
                status = 'completed'
              }
            } else {
              // 루틴 과제: 횟수 기반
              if (tData.status === 'completed' || completedCount >= targetCount) {
                status = 'completed'
              } else if (tData.status === 'in_progress' || completedCount > 0) {
                status = 'in_progress'
              }
            }

            allTasks.push({
              id: taskId,
              title: tData.title || '과제',
              description: tData.description || '',
              dueDate: tData.dueDate || '',
              taskType: taskType,
              status: status,
              hasSubmission: hasSubmission,
              completedCount: completedCount,
              targetCount: targetCount,
              submission: submissionData ? {
                content: submissionData.content,
                images: submissionData.images,
                submittedAt: submissionData.submittedAt,
              } : null,
              coacheeId: coacheeItem.id,
              coacheeName: coacheeItem.name
            })
          })
        } catch (err) {
          console.warn(`과제 로드 실패 (${coacheeItem.name}):`, err)
        }
      }

      setCoachees(formatted)
      setTasks(allTasks)
      setIsAssignModalOpen(false)

      alert('과제가 부여되었습니다. 피코치에게 채팅으로 알림이 전송되었습니다.')
    } catch (err) {
      console.error('과제 부여 실패:', err)
      alert('과제 부여에 실패했습니다.')
    }
  }

  const handleCompleteTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // 로컬 상태 업데이트
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'completed', completedCount: t.targetCount } : t
    ))

    // Supabase에 저장
    if (isSupabaseConfigured()) {
      try {
        const { updateMessageMetadata } = await import('../../lib/messageService')
        await updateMessageMetadata(taskId, {
          type: 'task',
          taskData: {
            ...task,
            status: 'completed',
            completedCount: task.targetCount
          }
        })
      } catch (err) {
        console.error('과제 완료 저장 실패:', err)
      }
    }

    return true // 성공 반환
  }

  // 리마인더 전송 (채팅 메시지로)
  const handleSendReminder = async (coacheeUserId, taskTitle) => {
    if (!user?.id || !coacheeUserId || !isSupabaseConfigured()) {
      alert('리마인더 전송에 실패했습니다.')
      return
    }

    try {
      const conversation = await getOrCreateConversation(user.id, coacheeUserId)
      const reminderMessage = `⏰ 과제 리마인더\n\n"${taskTitle}" 과제를 확인해주세요!\n\n코치가 과제 진행 상황을 기다리고 있어요.`

      await sendMessage(
        conversation.id,
        user.id,
        'coach',
        reminderMessage,
        'system',
        { type: 'task_reminder', taskTitle }
      )

      alert('리마인더가 전송되었습니다.')
    } catch (err) {
      console.error('리마인더 전송 실패:', err)
      alert('리마인더 전송에 실패했습니다.')
    }
  }

  if (loading) {
    return <LoadingContainer text="과제 데이터를 불러오는 중..." />
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">과제 관리</h1>
          <p className="text-gray-600">
            피코치별로 과제 현황을 확인하고 새로운 과제를 부여하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            전체 펼치기
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            전체 접기
          </Button>
          <Button onClick={() => {
            setPreselectedCoacheeId(null)
            setIsAssignModalOpen(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            과제 부여
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          icon={User}
          label="피코치"
          value={totalStats.totalCoachees}
          color="blue"
        />
        <StatCard
          icon={ClipboardList}
          label="전체 과제"
          value={totalStats.totalTasks}
          color="gray"
        />
        <StatCard
          icon={Clock}
          label="진행 중"
          value={totalStats.pending}
          color="yellow"
        />
        <StatCard
          icon={Send}
          label="제출됨"
          value={totalStats.submitted}
          color="purple"
        />
        <StatCard
          icon={CheckCircle}
          label="완료"
          value={totalStats.completed}
          color="green"
        />
      </div>

      {/* 검색 */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="피코치 이름으로 검색..."
        className="max-w-md"
      />

      {/* 피코치별 서랍형 과제 목록 */}
      <div className="space-y-3">
        {filteredCoachees.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={User}
                title="해당하는 피코치가 없습니다"
                description={searchQuery ? "다른 검색어로 시도해보세요." : undefined}
              />
            </CardContent>
          </Card>
        ) : (
          filteredCoachees.map((coachee) => (
            <CoacheeDrawer
              key={coachee.id}
              coachee={coachee}
              isExpanded={isExpanded(coachee.id)}
              onToggle={() => toggleCoachee(coachee.id)}
              onCompleteTask={handleCompleteTask}
              onAssignTask={() => {
                setPreselectedCoacheeId(coachee.id)
                setIsAssignModalOpen(true)
              }}
              onSendReminder={handleSendReminder}
            />
          ))
        )}
      </div>

      {/* 과제 부여 모달 */}
      {isAssignModalOpen && (
        <TaskAssignModal
          coachees={coachees}
          preselectedCoacheeId={preselectedCoacheeId}
          onClose={() => {
            setIsAssignModalOpen(false)
            setPreselectedCoacheeId(null)
          }}
          onAssign={handleAssignTask}
        />
      )}
    </div>
  )
}

function CoacheeDrawer({ coachee, isExpanded, onToggle, onCompleteTask, onAssignTask, onSendReminder }) {
  const hasOverdue = coachee.tasks.some(t => {
    if (t.status === 'completed') return false
    const dueDate = new Date(t.dueDate)
    return dueDate < new Date()
  })

  return (
    <Card className={`overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
      {/* 피코치 헤더 */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* 펼침/접힘 아이콘 */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          isExpanded ? 'bg-emerald-100' : 'bg-gray-100'
        }`}>
          {isExpanded ? (
            <ChevronDown className={`w-5 h-5 ${isExpanded ? 'text-emerald-600' : 'text-gray-500'}`} />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
        </div>

        {/* 피코치 정보 */}
        <Avatar name={coachee.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{coachee.name}</h3>
            {coachee.packageType && PACKAGES[coachee.packageType] && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${packageColors[coachee.packageType] || 'bg-gray-100 text-gray-700'}`}>
                {PACKAGES[coachee.packageType].icon} {PACKAGES[coachee.packageType].name}
              </span>
            )}
            {hasOverdue && (
              <Badge variant="danger" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                마감 초과
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">
            {coachee.coachingGoal?.goal || '목표 미설정'}
          </p>
        </div>

        {/* 과제 통계 */}
        <div className="flex items-center gap-4">
          {coachee.submittedCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-purple-600 font-medium">{coachee.submittedCount}개 검토 대기</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-gray-600">{coachee.pendingCount}개 진행 중</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-gray-600">{coachee.completedCount}개 완료</span>
          </div>
        </div>
      </button>

      {/* 과제 목록 */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50">
          {coachee.tasks.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              아직 부여된 과제가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {coachee.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  coacheeUserId={coachee.userId}
                  onComplete={() => onCompleteTask(task.id)}
                  onSendReminder={onSendReminder}
                />
              ))}
            </div>
          )}

          {/* 새 과제 부여 버튼 */}
          <div className="p-3 bg-white border-t border-gray-100">
            <Button variant="outline" size="sm" className="w-full" onClick={onAssignTask}>
              <Plus className="w-4 h-4 mr-2" />
              {coachee.name}님에게 과제 부여
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

function TaskRow({ task, coacheeUserId, onComplete, onSendReminder }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)

  const handleSendReminder = () => {
    if (onSendReminder && coacheeUserId) {
      onSendReminder(coacheeUserId, task.title)
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await onComplete()
      setJustCompleted(true)
      setTimeout(() => setJustCompleted(false), 2000) // 2초 후 상태 초기화
    } catch (err) {
      console.error('완료 처리 실패:', err)
    } finally {
      setIsCompleting(false)
    }
  }

  const isRoutine = task.taskType !== 'record'

  const statusConfig = {
    completed: { label: '완료', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    in_progress: { label: '진행 중', color: 'bg-emerald-100 text-emerald-700', icon: Clock },
    not_started: { label: isRoutine ? '시작 전' : '미제출', color: 'bg-gray-100 text-gray-600', icon: AlertCircle }
  }

  const config = statusConfig[task.status] || statusConfig.not_started
  const StatusIcon = config.icon

  // 진행률 계산 (루틴 과제용)
  const completedCount = task.completedCount || 0
  const targetCount = task.targetCount || 1
  const progressPercent = Math.round((completedCount / targetCount) * 100)

  // 마감일 체크
  const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date()

  return (
    <div className="bg-white">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-4 p-4 pl-16 hover:bg-emerald-50 cursor-pointer transition-colors"
      >
        {/* 펼침 아이콘 */}
        <div className="w-6 h-6 flex items-center justify-center">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {/* 과제 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {/* 과제 타입 */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isRoutine ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
            }`}>
              {isRoutine ? '🔄 루틴' : '📝 기록'}
            </span>
            {/* 상태 */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
            {/* 진행률 표시 (루틴 과제만) */}
            {isRoutine && (
              <span className="text-xs text-gray-500">
                ({completedCount}/{targetCount}회)
              </span>
            )}
            <span className="font-medium text-gray-900">{task.title}</span>
            {/* 제출 여부 표시 (루틴 과제에서 제출도 있을 경우) */}
            {isRoutine && task.hasSubmission && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                <Send className="w-3 h-3" />
                제출됨
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
              <Calendar className="w-3 h-3" />
              마감: {task.dueDate}
              {isOverdue && ' (초과)'}
            </span>
            {/* 진행률 바 (루틴 과제만) */}
            {isRoutine && targetCount > 1 && (
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-emerald-500'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs">{progressPercent}%</span>
              </div>
            )}
          </div>
        </div>

        {/* 검토 필요 알림 (제출됨 + 미완료) */}
        {task.hasSubmission && task.status !== 'completed' && (
          <Badge variant="primary" className="animate-pulse">
            검토 필요
          </Badge>
        )}
      </div>

      {/* 확장 영역 - 제출물 및 액션 */}
      {isExpanded && (
        <div className="px-4 pb-4 pl-20">
          <div className="p-4 bg-gray-50 rounded-lg">
            {task.description && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">과제 설명</h4>
                <p className="text-sm text-gray-600">{task.description}</p>
              </div>
            )}

            {task.submission ? (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">제출물</h4>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.submission.content}</p>
                  {task.submission.images?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.submission.images.map((img, idx) => (
                        img.url ? (
                          <img
                            key={idx}
                            src={img.url}
                            alt={img.name || `이미지 ${idx + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                            onClick={() => window.open(img.url, '_blank')}
                          />
                        ) : (
                          <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                            {img.name || `이미지 ${idx + 1}`}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    제출: {new Date(task.submission.submittedAt).toLocaleString('ko-KR')}
                  </p>
                  {task.submission.feedback && (
                    <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-xs text-emerald-600 font-medium mb-1">💬 내 피드백</p>
                      <p className="text-sm text-gray-700">{task.submission.feedback}</p>
                    </div>
                  )}
                </div>
                {!task.submission.feedback && task.status !== 'completed' && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">
                      <MessageCircle className="w-3.5 h-3.5 mr-1" />
                      피드백 보내기
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleComplete}
                      disabled={isCompleting || justCompleted}
                      className={justCompleted ? 'bg-green-600 hover:bg-green-600' : ''}
                    >
                      {isCompleting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          처리 중...
                        </>
                      ) : justCompleted ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          완료됨!
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          완료 처리
                        </>
                      )}
                    </Button>
                  </div>
                )}
                {task.status === 'completed' && (
                  <div className="mt-3 flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">완료된 과제입니다</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">아직 제출된 내용이 없습니다.</p>
                <Button size="sm" variant="outline" onClick={handleSendReminder}>
                  <MessageCircle className="w-3.5 h-3.5 mr-1" />
                  리마인더 보내기
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TaskAssignModal({ coachees = [], preselectedCoacheeId = null, onClose, onAssign }) {
  const [selectedCoachee, setSelectedCoachee] = useState(preselectedCoacheeId || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [taskType, setTaskType] = useState('routine') // 'routine' | 'record'
  const [targetCount, setTargetCount] = useState(5) // 루틴 과제용 목표 횟수
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedCoacheeData = coachees.find(c => c.id === selectedCoachee)
  const canSubmit = selectedCoachee && title.trim() && dueDate && !isSubmitting

  const handleSubmit = async () => {
    if (!canSubmit) return

    setIsSubmitting(true)
    const coachee = coachees.find(c => c.id === selectedCoachee)
    await onAssign({
      title,
      description,
      dueDate,
      taskType,
      targetCount: taskType === 'routine' ? targetCount : 1,
      coacheeId: selectedCoachee,
      coacheeName: coachee?.name || ''
    })
    setIsSubmitting(false)
  }

  const today = new Date().toISOString().split('T')[0]

  // 빠른 과제 템플릿 (타입별)
  const quickTemplates = {
    routine: [
      { title: '아침 기상 후 물 한 잔 마시기', description: '일어나자마자 물 한 잔을 마시고, 마신 시간을 기록해주세요.', targetCount: 7 },
      { title: '10분 산책하기', description: '하루 중 아무 때나 10분 이상 밖에서 걸어보세요.', targetCount: 5 },
      { title: '스마트폰 사용 전 3초 멈추기', description: '스마트폰을 들기 전 3초간 멈추고 "지금 필요한가?" 생각해보세요.', targetCount: 10 },
      { title: '취침 전 내일 할 일 3가지 적기', description: '잠들기 전 내일 꼭 해야 할 일을 3가지 적어보세요.', targetCount: 7 },
    ],
    record: [
      { title: '이번 주 감정 일기 작성', description: '이번 주 동안 느낀 감정들을 정리해서 제출해주세요.' },
      { title: '목표 달성 현황 정리', description: '현재까지의 목표 달성 현황을 정리해서 공유해주세요.' },
      { title: '어려웠던 상황 기록', description: '이번 주 가장 어려웠던 상황과 대처 방법을 기록해주세요.' },
      { title: '성공 경험 기록', description: '최근 성공적으로 해낸 일과 그때의 기분을 기록해주세요.' },
    ]
  }

  const applyTemplate = (template) => {
    setTitle(template.title)
    setDescription(template.description)
    if (template.targetCount) {
      setTargetCount(template.targetCount)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">과제 부여</h2>
            {selectedCoacheeData && (
              <p className="text-sm text-gray-500">{selectedCoacheeData.name}님에게 과제를 부여합니다</p>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 피코치 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              피코치 선택 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCoachee}
              onChange={(e) => setSelectedCoachee(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">선택하세요</option>
              {coachees.map(coachee => (
                <option key={coachee.id} value={coachee.id}>
                  {coachee.name}
                </option>
              ))}
            </select>
          </div>

          {/* 과제 타입 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              과제 타입 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTaskType('routine')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  taskType === 'routine'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-gray-900">루틴 과제</span>
                </div>
                <p className="text-xs text-gray-500">
                  반복 실행 (예: 물 마시기 7회)
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  → 실행과제 페이지 + 대시보드
                </p>
              </button>
              <button
                type="button"
                onClick={() => setTaskType('record')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  taskType === 'record'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">기록 과제</span>
                </div>
                <p className="text-xs text-gray-500">
                  1회 제출 (예: 감정일기 작성)
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  → 채팅으로 제출
                </p>
              </button>
            </div>
          </div>

          {/* 빠른 템플릿 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              빠른 템플릿
            </label>
            <div className="grid grid-cols-2 gap-2">
              {quickTemplates[taskType].map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => applyTemplate(template)}
                  className="p-2.5 text-left text-xs bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg transition-colors"
                >
                  <span className="text-gray-700 line-clamp-2">{template.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 과제 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              과제 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 아침 기상 후 물 한 잔 마시기"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 상세 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상세 설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="과제에 대한 자세한 설명이나 가이드를 적어주세요."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* 마감일 및 목표 횟수 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                마감일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={today}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {taskType === 'routine' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  목표 횟수 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={targetCount}
                    onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-gray-500 whitespace-nowrap">회</span>
                </div>
              </div>
            )}
          </div>

          {/* 안내 메시지 */}
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            taskType === 'routine' ? 'bg-emerald-50' : 'bg-purple-50'
          }`}>
            {taskType === 'routine' ? (
              <>
                <Target className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-emerald-700">
                  루틴 과제: 실행과제 페이지에서 완료 체크, 대시보드에 표시됩니다
                </span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="text-sm text-purple-700">
                  기록 과제: 채팅창으로 제출하면 완료됩니다
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                부여 중...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                과제 부여
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
