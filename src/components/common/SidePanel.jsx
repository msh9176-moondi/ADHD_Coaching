import { X } from 'lucide-react'
import { Card } from './Card'

export function SidePanel({
  title,
  icon: Icon,
  iconColor = 'text-emerald-600',
  headerBg = 'bg-emerald-50',
  headerTextColor = 'text-blue-900',
  onClose,
  children,
  footer,
  className = '',
  height = 'h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] min-h-[300px] md:min-h-[400px] max-h-[800px]',
  width = 'w-full lg:w-80',
}) {
  return (
    <>
      {/* 모바일 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      <Card className={`
        ${width} ${height} flex flex-col animate-slide-in ${className}
        fixed lg:relative inset-x-0 bottom-0 lg:inset-auto
        z-50 lg:z-auto
        rounded-t-2xl lg:rounded-xl
        max-h-[85vh] lg:max-h-[800px]
      `}>
        {/* Header */}
        <div className={`flex-shrink-0 px-4 py-3 border-b ${headerBg} flex items-center justify-between rounded-t-2xl lg:rounded-t-xl`}>
          <div className="flex items-center gap-2">
            {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
            <h3 className={`font-semibold text-sm md:text-base ${headerTextColor}`}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 p-3 md:p-4 border-t bg-white">
            {footer}
          </div>
        )}
      </Card>
    </>
  )
}
