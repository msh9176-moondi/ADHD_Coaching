/**
 * 프로그레스 바 컴포넌트
 * @param {Object} props
 * @param {number} props.current - 현재 값
 * @param {number} props.total - 전체 값
 * @param {string} props.color - 색상 (blue, green, purple, yellow, red)
 * @param {boolean} props.showLabel - 라벨 표시 여부
 * @param {string} props.labelFormat - 라벨 포맷 ('fraction' | 'percent')
 * @param {string} props.size - 크기 ('sm' | 'md' | 'lg')
 * @param {string} props.className - 추가 클래스
 */
export function ProgressBar({
  current = 0,
  total = 100,
  color = 'blue',
  showLabel = false,
  labelFormat = 'fraction',
  size = 'md',
  className = ''
}) {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  }

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  }

  const barColor = colorClasses[color] || colorClasses.blue
  const barHeight = sizeClasses[size] || sizeClasses.md

  const label = labelFormat === 'percent'
    ? `${percentage}%`
    : `${current}/${total}`

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>진행률</span>
          <span>{label}</span>
        </div>
      )}
      <div className={`${barHeight} bg-gray-100 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
