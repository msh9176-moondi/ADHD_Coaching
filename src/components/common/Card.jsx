import { forwardRef } from 'react'

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base md:text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  )
}

export const CardContent = forwardRef(({ children, className = '' }, ref) => {
  return (
    <div ref={ref} className={`px-4 md:px-6 py-3 md:py-4 ${className}`}>
      {children}
    </div>
  )
})
