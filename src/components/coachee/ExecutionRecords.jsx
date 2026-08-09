import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { ClipboardList, CheckCircle, Circle } from 'lucide-react'

export function ExecutionRecords() {
  const { executionRecords, toggleExecutionRecord } = useStore()

  if (!executionRecords || executionRecords.length === 0) {
    return null
  }

  // 최근 5개만 표시
  const recentRecords = executionRecords.slice(0, 5)

  // 날짜 포맷팅
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-emerald-600" />
          나의 실행 기록
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentRecords.map((record) => (
            <div
              key={record.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-xs text-gray-400 whitespace-nowrap pt-0.5 min-w-[50px]">
                {formatDate(record.date)}
              </span>
              <p className="flex-1 text-sm text-gray-700 leading-relaxed">
                {record.content}
              </p>
              <button
                onClick={() => toggleExecutionRecord(record.id)}
                className="flex-shrink-0"
              >
                {record.completed ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
