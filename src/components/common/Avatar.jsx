import { User } from 'lucide-react'

export function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const getInitials = (name) => {
    if (!name) return ''
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-medium ${className}`}>
      {name ? getInitials(name) : <User className="w-1/2 h-1/2" />}
    </div>
  )
}
