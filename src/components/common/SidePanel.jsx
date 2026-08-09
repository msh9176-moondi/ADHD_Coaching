import { X } from 'lucide-react'
import { Card } from './Card'

export function SidePanel({
  title,
  icon: Icon,
  iconColor = 'text-blue-600',
  headerBg = 'bg-blue-50',
  headerTextColor = 'text-blue-900',
  onClose,
  children,
  footer,
  className = '',
  height = 'h-[calc(100vh-180px)] min-h-[400px] max-h-[800px]',
  width = 'w-80',
}) {
  return (
    <Card className={`${width} ${height} flex flex-col animate-slide-in ${className}`}>
      {/* Header */}
      <div className={`flex-shrink-0 px-4 py-3 border-b ${headerBg} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
          <h3 className={`font-semibold ${headerTextColor}`}>{title}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="flex-shrink-0 p-4 border-t bg-white">
          {footer}
        </div>
      )}
    </Card>
  )
}
