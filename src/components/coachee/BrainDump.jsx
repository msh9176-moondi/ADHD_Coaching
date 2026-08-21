/**
 * 브레인 덤프 컴포넌트
 * ADHD 실행기능 장애를 고려한 할 일 관리 시스템
 * - 브레인 덤프: 해야 할 일들을 쏟아내기
 * - AI 분류: 일일 실행목록 / 포괄 실행목록으로 분류
 * - 사용자 검토 및 수정
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { useStore } from '../../store/useStore'
import { classifyTasks, classifyTasksWithReview, generateTaskExamples, generatePriorityAdvice } from '../../lib/taskClassificationService'
import { TaskExecutionModal } from './TaskExecutionModal'
import { BrainDumpWizard } from './BrainDumpWizard'
import {
  Brain, Sparkles, ListTodo, FolderOpen, Loader2,
  Plus, Trash2, ArrowRight, CheckCircle, Clock, Check,
  ChevronDown, ChevronUp, Edit3, GripVertical, AlertCircle
} from 'lucide-react'

export function BrainDump() {
  const { user } = useStore()
  const [dumpText, setDumpText] = useState('')
  const [isClassifying, setIsClassifying] = useState(false)
  const [dailyTasks, setDailyTasks] = useState([])
  const [comprehensiveTasks, setComprehensiveTasks] = useState([])
  const [showClassified, setShowClassified] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showExecutionModal, setShowExecutionModal] = useState(false)
  const [expandedSection, setExpandedSection] = useState('comprehensive')

  // 위자드 관련 상태
  const [showWizard, setShowWizard] = useState(false)
  const [wizardItems, setWizardItems] = useState([])
  const [priorityAdvice, setPriorityAdvice] = useState('')

  // localStorage에서 기존 데이터 로드
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`brain_dump_${user.id}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setDailyTasks(parsed.dailyTasks || [])
          setComprehensiveTasks(parsed.comprehensiveTasks || [])
          if (parsed.dailyTasks?.length > 0 || parsed.comprehensiveTasks?.length > 0) {
            setShowClassified(true)
          }
        } catch (e) {}
      }
    }
  }, [user?.id])

  // 데이터 저장
  const saveData = (daily, comprehensive) => {
    if (user?.id) {
      localStorage.setItem(`brain_dump_${user.id}`, JSON.stringify({
        dailyTasks: daily,
        comprehensiveTasks: comprehensive,
        updatedAt: new Date().toISOString()
      }))
    }
  }

  // AI 분류 실행 (카드뉴스 위자드 열기)
  const handleClassify = async () => {
    if (!dumpText.trim()) return

    setIsClassifying(true)
    try {
      // 새로운 분류 함수 사용 (원본 보존)
      const result = await classifyTasksWithReview(dumpText)

      if (result.items.length === 0) {
        alert('분류할 항목이 없습니다.')
        return
      }

      // 우선순위 조언 생성
      const advice = await generatePriorityAdvice(result.items)

      setWizardItems(result.items)
      setPriorityAdvice(advice)
      setShowWizard(true)
      setDumpText('')
    } catch (err) {
      console.error('분류 실패:', err)
      alert('분류 중 오류가 발생했습니다.')
    } finally {
      setIsClassifying(false)
    }
  }

  // 위자드 완료 처리
  const handleWizardComplete = ({ dailyTasks: newDaily, comprehensiveTasks: newComp }) => {
    const formattedDaily = newDaily.map((task, idx) => ({
      id: `daily-${Date.now()}-${idx}`,
      text: task.text,
      original: task.original,
      completed: false,
      scheduledTime: task.scheduledTime || '',
      estimatedMinutes: task.estimatedMinutes || 30,
      createdAt: new Date().toISOString()
    }))

    const formattedComp = newComp.map((task, idx) => ({
      id: `comp-${Date.now()}-${idx}`,
      text: task.text,
      original: task.original,
      completed: false,
      createdAt: new Date().toISOString()
    }))

    setDailyTasks(prev => [...prev, ...formattedDaily])
    setComprehensiveTasks(prev => [...prev, ...formattedComp])
    saveData([...dailyTasks, ...formattedDaily], [...comprehensiveTasks, ...formattedComp])

    setShowWizard(false)
    setWizardItems([])
    setPriorityAdvice('')
    setShowClassified(true)
  }

  // 태스크 이동 (일일 <-> 포괄)
  const moveTask = (task, from) => {
    if (from === 'daily') {
      setDailyTasks(prev => prev.filter(t => t.id !== task.id))
      setComprehensiveTasks(prev => [...prev, { ...task, id: `comp-${Date.now()}` }])
      saveData(
        dailyTasks.filter(t => t.id !== task.id),
        [...comprehensiveTasks, { ...task, id: `comp-${Date.now()}` }]
      )
    } else {
      setComprehensiveTasks(prev => prev.filter(t => t.id !== task.id))
      setDailyTasks(prev => [...prev, { ...task, id: `daily-${Date.now()}` }])
      saveData(
        [...dailyTasks, { ...task, id: `daily-${Date.now()}` }],
        comprehensiveTasks.filter(t => t.id !== task.id)
      )
    }
  }

  // 태스크 삭제
  const deleteTask = (taskId, from) => {
    if (from === 'daily') {
      const updated = dailyTasks.filter(t => t.id !== taskId)
      setDailyTasks(updated)
      saveData(updated, comprehensiveTasks)
    } else {
      const updated = comprehensiveTasks.filter(t => t.id !== taskId)
      setComprehensiveTasks(updated)
      saveData(dailyTasks, updated)
    }
  }

  // 태스크 완료 토글
  const toggleComplete = (taskId, from) => {
    if (from === 'daily') {
      const updated = dailyTasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
      setDailyTasks(updated)
      saveData(updated, comprehensiveTasks)
    } else {
      const updated = comprehensiveTasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
      setComprehensiveTasks(updated)
      saveData(dailyTasks, updated)
    }
  }

  // 태스크 텍스트 수정
  const editTask = (taskId, newText, from) => {
    if (from === 'daily') {
      const updated = dailyTasks.map(t =>
        t.id === taskId ? { ...t, text: newText } : t
      )
      setDailyTasks(updated)
      saveData(updated, comprehensiveTasks)
    } else {
      const updated = comprehensiveTasks.map(t =>
        t.id === taskId ? { ...t, text: newText } : t
      )
      setComprehensiveTasks(updated)
      saveData(dailyTasks, updated)
    }
  }

  // 태스크 실행 시작
  const startExecution = async (task) => {
    setSelectedTask(task)
    setShowExecutionModal(true)
  }

  return (
    <div className="space-y-4">
      {/* 브레인 덤프 입력 */}
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-600" />
            브레인 덤프
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            <strong className="text-gray-800">내가 이루고자 하는것이 무엇인가?</strong><br />
            해야 하는 일, 미루고 있는 일들을 생각나는 대로 적어주세요.
          </p>
          <textarea
            value={dumpText}
            onChange={(e) => setDumpText(e.target.value)}
            placeholder="예: 세금 신고하기, 엄마한테 전화, 프로젝트 보고서 작성, 방 청소..."
            className="w-full h-24 p-3 border border-violet-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <Button
            onClick={handleClassify}
            disabled={!dumpText.trim() || isClassifying}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            {isClassifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI가 분류하는 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI로 분류하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 분류된 목록 */}
      {showClassified && (
        <div className="space-y-4">
          {/* 포괄 실행목록 */}
          <Card className="border-blue-200">
            <button
              onClick={() => setExpandedSection(expandedSection === 'comprehensive' ? null : 'comprehensive')}
              className="w-full"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                    포괄 실행목록
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {comprehensiveTasks.filter(t => !t.completed).length}개
                    </span>
                  </CardTitle>
                  {expandedSection === 'comprehensive' ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500 text-left mt-1">
                  장기적인 목표나 여러 단계가 필요한 일들
                </p>
              </CardHeader>
            </button>

            {expandedSection === 'comprehensive' && (
              <CardContent className="pt-0 space-y-2">
                {comprehensiveTasks.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    큰 프로젝트나 장기 목표가 여기에 표시돼요
                  </p>
                ) : (
                  comprehensiveTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      type="comprehensive"
                      onToggleComplete={() => toggleComplete(task.id, 'comprehensive')}
                      onMove={() => moveTask(task, 'comprehensive')}
                      onDelete={() => deleteTask(task.id, 'comprehensive')}
                      onStart={() => startExecution(task)}
                      onEdit={(newText) => editTask(task.id, newText, 'comprehensive')}
                    />
                  ))
                )}
              </CardContent>
            )}
          </Card>

          {/* 일일 실행목록 */}
          <Card className="border-emerald-200">
            <button
              onClick={() => setExpandedSection(expandedSection === 'daily' ? null : 'daily')}
              className="w-full"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-emerald-600" />
                    일일 실행목록
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      {dailyTasks.filter(t => !t.completed).length}개
                    </span>
                  </CardTitle>
                  {expandedSection === 'daily' ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500 text-left mt-1">
                  오늘 할 수 있는 구체적인 행동들
                </p>
              </CardHeader>
            </button>

            {expandedSection === 'daily' && (
              <CardContent className="pt-0 space-y-2">
                {dailyTasks.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    브레인 덤프를 하면 여기에 오늘 할 일이 나타나요
                  </p>
                ) : (
                  dailyTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      type="daily"
                      onToggleComplete={() => toggleComplete(task.id, 'daily')}
                      onMove={() => moveTask(task, 'daily')}
                      onDelete={() => deleteTask(task.id, 'daily')}
                      onStart={() => startExecution(task)}
                      onEdit={(newText) => editTask(task.id, newText, 'daily')}
                    />
                  ))
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* 실행 준비 모달 */}
      {showExecutionModal && selectedTask && (
        <TaskExecutionModal
          task={selectedTask}
          onClose={() => {
            setShowExecutionModal(false)
            setSelectedTask(null)
          }}
          onComplete={() => {
            toggleComplete(selectedTask.id, selectedTask.id.startsWith('daily') ? 'daily' : 'comprehensive')
            setShowExecutionModal(false)
            setSelectedTask(null)
          }}
        />
      )}

      {/* 브레인 덤프 검수 위자드 */}
      {showWizard && wizardItems.length > 0 && (
        <BrainDumpWizard
          items={wizardItems}
          priorityAdvice={priorityAdvice}
          onComplete={handleWizardComplete}
          onCancel={() => {
            setShowWizard(false)
            setWizardItems([])
            setPriorityAdvice('')
          }}
        />
      )}
    </div>
  )
}

// 태스크 아이템 컴포넌트
function TaskItem({ task, type, onToggleComplete, onMove, onDelete, onStart, onEdit }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)

  const handleSave = () => {
    if (editText.trim() && editText !== task.text) {
      onEdit(editText.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditText(task.text)
      setIsEditing(false)
    }
  }

  return (
    <div className={`p-2.5 rounded-lg border ${
      task.completed
        ? 'bg-gray-50 border-gray-200'
        : type === 'daily'
          ? 'bg-white border-emerald-200'
          : 'bg-white border-blue-200'
    }`}>
      <div className="flex items-center gap-2">
        {/* 체크박스 */}
        <button
          onClick={onToggleComplete}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
            task.completed
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-gray-300 hover:border-emerald-400'
          }`}
        >
          {task.completed && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* 시간 (일일 목록만) */}
        {type === 'daily' && (
          <div className={`flex-shrink-0 w-14 text-center ${task.completed ? 'text-gray-400' : 'text-emerald-600'}`}>
            {task.scheduledTime ? (
              <span className="text-sm font-medium">{task.scheduledTime}</span>
            ) : (
              <span className="text-xs text-gray-400">--:--</span>
            )}
          </div>
        )}

        {/* 구분선 (일일 목록만) */}
        {type === 'daily' && (
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        )}

        {/* 할일 텍스트 */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          ) : (
            <div className="flex items-center gap-2">
              <p className={`text-sm flex-1 ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {task.text}
              </p>
              {type === 'daily' && task.estimatedMinutes && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${task.completed ? 'bg-gray-100 text-gray-400' : 'bg-emerald-100 text-emerald-600'}`}>
                  {task.estimatedMinutes}분
                </span>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {!task.completed && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded"
              title="수정"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {!task.completed && type === 'daily' && (
            <button
              onClick={onStart}
              className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
              title="실행 시작"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onMove}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
            title={type === 'daily' ? '포괄목록으로 이동' : '일일목록으로 이동'}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 rounded"
            title="삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 수정 시 가이드 문구 */}
      {isEditing && (
        <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            과제를 이해하기 쉬운 행동용어로 규정하세요
          </p>
          <ul className="text-xs text-red-500 space-y-0.5 pl-1">
            <li>• 광범위하게 표현된 과제가 있는가 확인할것</li>
            <li>• 합리적이고 실행가능하며 더 작고 구체적인 것이 되도록 다시 표현할것</li>
            <li>• 실행할 자신이 있을 정도의 행동으로 정의될 때까지 반복할것</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default BrainDump
