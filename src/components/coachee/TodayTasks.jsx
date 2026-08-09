import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import {
  CheckCircle2, Circle, Clock, MoreHorizontal,
  Plus, Play, Minus, ArrowRight, Trash2
} from 'lucide-react'

const STATUS_CONFIG = {
  not_started: { icon: Circle, color: 'text-gray-400', bg: 'bg-gray-100', label: '시작 전' },
  started: { icon: Play, color: 'text-blue-500', bg: 'bg-blue-100', label: '진행 중' },
  partial: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100', label: '일부 진행' },
  completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100', label: '완료' },
}

export function TodayTasks() {
  const { todayTasks, addTodayTask, updateTaskStatus, removeTask } = useStore()
  const [isAdding, setIsAdding] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [activeMenu, setActiveMenu] = useState(null)

  const personalTasks = todayTasks.filter((t) => !t.isCoachingTask)
  const canAddMore = personalTasks.length < 3

  const handleAddTask = () => {
    if (newTaskTitle.trim() && canAddMore) {
      addTodayTask({
        title: newTaskTitle.trim(),
        status: 'not_started',
        isCoachingTask: false,
      })
      setNewTaskTitle('')
      setIsAdding(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">오늘의 할 일</CardTitle>
        <span className="text-sm text-gray-500">{personalTasks.length}/3</span>
      </CardHeader>
      <CardContent className="space-y-2">
        {todayTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isMenuOpen={activeMenu === task.id}
            onMenuToggle={() => setActiveMenu(activeMenu === task.id ? null : task.id)}
            onStatusChange={(status) => {
              updateTaskStatus(task.id, status)
              setActiveMenu(null)
            }}
            onDelete={() => {
              removeTask(task.id)
              setActiveMenu(null)
            }}
          />
        ))}

        {/* 할 일 추가 */}
        {isAdding ? (
          <div className="flex gap-2 p-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="무엇을 할까요?"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
              추가
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
              취소
            </Button>
          </div>
        ) : (
          canAddMore && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center gap-2 p-3 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              할 일 추가
            </button>
          )
        )}
      </CardContent>
    </Card>
  )
}

function TaskItem({ task, isMenuOpen, onMenuToggle, onStatusChange, onDelete }) {
  const config = STATUS_CONFIG[task.status]
  const StatusIcon = config.icon

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
          task.status === 'completed' ? 'bg-gray-50' : 'hover:bg-gray-50'
        }`}
      >
        <button
          onClick={() => {
            const nextStatus = {
              not_started: 'started',
              started: 'partial',
              partial: 'completed',
              completed: 'not_started',
            }
            onStatusChange(nextStatus[task.status])
          }}
          className={`p-1.5 rounded-full ${config.bg}`}
        >
          <StatusIcon className={`w-4 h-4 ${config.color}`} />
        </button>

        <span
          className={`flex-1 text-sm ${
            task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'
          }`}
        >
          {task.title}
        </span>

        {task.isCoachingTask && (
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
            코칭
          </span>
        )}

        <button
          onClick={onMenuToggle}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 상태 변경 메뉴 */}
      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
          <button
            onClick={() => onStatusChange('started')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Play className="w-4 h-4 text-blue-500" />
            시작하기
          </button>
          <button
            onClick={() => onStatusChange('partial')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            일부 했어요
          </button>
          <button
            onClick={() => onStatusChange('completed')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            완료했어요
          </button>
          <hr className="my-1" />
          <button
            onClick={() => alert('더 작게 줄이기 기능은 준비 중입니다.')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Minus className="w-4 h-4" />
            더 작게 줄이기
          </button>
          <button
            onClick={() => alert('다른 날로 옮기기 기능은 준비 중입니다.')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowRight className="w-4 h-4" />
            다른 날로 옮기기
          </button>
          <button
            onClick={onDelete}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            삭제하기
          </button>
        </div>
      )}
    </div>
  )
}
