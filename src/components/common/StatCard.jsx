import { STAT_CARD_COLORS } from '../../constants/styles'

/**
 * 통계 카드 컴포넌트
 * @param {Object} props
 * @param {React.ComponentType} props.icon - 아이콘 컴포넌트
 * @param {string} props.label - 라벨
 * @param {string|number} props.value - 값
 * @param {string} props.color - 색상 (blue, green, purple, yellow, red, gray)
 * @param {boolean} props.highlight - 하이라이트 여부 (테두리 강조)
 * @param {string} props.className - 추가 클래스
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  color = 'blue',
  highlight = false,
  className = ''
}) {
  const colors = STAT_CARD_COLORS[color] || STAT_CARD_COLORS.blue

  return (
    <div
      className={`
        ${colors.bg} rounded-xl p-4 border ${colors.border}
        ${highlight ? 'ring-2 ring-offset-1 ring-' + color + '-400' : ''}
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-10 h-10 ${colors.iconBg} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${colors.icon}`} />
          </div>
        )}
        <div>
          <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
          <p className={`text-sm ${colors.label}`}>{label}</p>
        </div>
      </div>
    </div>
  )
}
