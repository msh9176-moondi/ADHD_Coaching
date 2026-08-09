import { Loader2 } from 'lucide-react'

/**
 * 로딩 스피너 컴포넌트
 * @param {Object} props
 * @param {string} props.size - 크기 ('xs' | 'sm' | 'md' | 'lg' | 'xl')
 * @param {string} props.color - 색상 ('white' | 'blue' | 'gray')
 * @param {string} props.className - 추가 클래스
 * @param {string} props.text - 로딩 텍스트 (선택)
 */
export function LoadingSpinner({
  size = 'md',
  color = 'blue',
  className = '',
  text
}) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    white: 'text-white',
    blue: 'text-blue-500',
    gray: 'text-gray-400'
  }

  const iconSize = sizeClasses[size] || sizeClasses.md
  const iconColor = colorClasses[color] || colorClasses.blue

  if (text) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
        <Loader2 className={`${iconSize} ${iconColor} animate-spin`} />
        <span className="text-sm text-gray-500">{text}</span>
      </div>
    )
  }

  return (
    <Loader2 className={`${iconSize} ${iconColor} animate-spin ${className}`} />
  )
}

/**
 * 버튼 내부용 인라인 스피너
 * (border 스타일)
 */
export function ButtonSpinner({ className = '' }) {
  return (
    <span
      className={`
        w-4 h-4 border-2 border-current border-t-transparent
        rounded-full animate-spin inline-block
        ${className}
      `}
    />
  )
}

/**
 * 전체 화면 로딩 오버레이
 */
export function LoadingOverlay({ text = '로딩 중...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

/**
 * 컨테이너 내부 로딩
 */
export function LoadingContainer({ text, className = '' }) {
  return (
    <div className={`flex items-center justify-center h-64 ${className}`}>
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}
