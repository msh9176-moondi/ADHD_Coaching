import { FileText } from 'lucide-react'

/**
 * 빈 상태 컴포넌트
 * @param {Object} props
 * @param {React.ComponentType} props.icon - 아이콘 컴포넌트
 * @param {string} props.title - 제목
 * @param {string} props.description - 설명
 * @param {React.ReactNode} props.action - 액션 버튼 (선택)
 * @param {string} props.className - 추가 클래스
 */
export function EmptyState({
  icon: Icon = FileText,
  title = '데이터 없음',
  description,
  action,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}
