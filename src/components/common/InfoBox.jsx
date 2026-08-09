import { INFO_BOX_VARIANTS } from '../../constants/styles'
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

const DEFAULT_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle
}

/**
 * 정보 박스 컴포넌트
 * @param {Object} props
 * @param {string} props.variant - 변형 (info, success, warning, error)
 * @param {React.ComponentType} props.icon - 커스텀 아이콘 (선택)
 * @param {string} props.title - 제목 (선택)
 * @param {React.ReactNode} props.children - 내용
 * @param {string} props.className - 추가 클래스
 */
export function InfoBox({
  variant = 'info',
  icon: CustomIcon,
  title,
  children,
  className = ''
}) {
  const colors = INFO_BOX_VARIANTS[variant] || INFO_BOX_VARIANTS.info
  const Icon = CustomIcon || DEFAULT_ICONS[variant] || Info

  return (
    <div
      className={`
        p-4 rounded-lg border
        ${colors.bg} ${colors.border}
        ${className}
      `}
    >
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.icon}`} />
        <div className="flex-1 min-w-0">
          {title && (
            <p className={`font-medium mb-1 ${colors.text}`}>{title}</p>
          )}
          <div className={`text-sm ${colors.text}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
