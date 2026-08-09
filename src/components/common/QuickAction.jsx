import { forwardRef } from 'react'

export const QuickAction = forwardRef(function QuickAction(
  { label, icon: Icon, onClick, primary, disabled, tooltip, className = '' },
  ref
) {
  return (
    <button
      ref={ref}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={tooltip}
      className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs transition-colors flex items-center gap-1 ${
        disabled
          ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
          : primary
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  )
})
