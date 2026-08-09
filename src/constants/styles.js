/**
 * 공통 스타일 상수
 */

// 패키지 타입별 색상
export const PACKAGE_COLORS = {
  starter: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
    border: 'border-green-200'
  },
  basic: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200'
  },
  premium: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
    border: 'border-purple-200'
  }
}

// 상태별 색상
export const STATUS_COLORS = {
  pending: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-700',
    border: 'border-yellow-200',
    icon: 'text-yellow-500'
  },
  active: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
    border: 'border-green-200',
    icon: 'text-green-500'
  },
  completed: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
    icon: 'text-blue-500'
  },
  paused: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-700',
    border: 'border-gray-200',
    icon: 'text-gray-500'
  },
  cancelled: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    border: 'border-red-200',
    icon: 'text-red-500'
  }
}

// 과제 우선순위별 색상
export const PRIORITY_COLORS = {
  low: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-600'
  },
  medium: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-600'
  },
  high: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-600'
  }
}

// 과제 상태별 색상
export const TASK_STATUS_COLORS = {
  pending: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-600'
  },
  in_progress: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-600'
  },
  submitted: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-600'
  },
  completed: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    badge: 'bg-green-100 text-green-600'
  },
  cancelled: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-600'
  }
}

// InfoBox variant 색상
export const INFO_BOX_VARIANTS = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-600'
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-600'
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: 'text-amber-600'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-600'
  }
}

// StatCard 색상
export const STAT_CARD_COLORS = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    icon: 'text-blue-600',
    value: 'text-blue-600',
    label: 'text-blue-500',
    border: 'border-blue-100'
  },
  green: {
    bg: 'bg-green-50',
    iconBg: 'bg-green-100',
    icon: 'text-green-600',
    value: 'text-green-600',
    label: 'text-green-500',
    border: 'border-green-100'
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    icon: 'text-purple-600',
    value: 'text-purple-600',
    label: 'text-purple-500',
    border: 'border-purple-100'
  },
  yellow: {
    bg: 'bg-yellow-50',
    iconBg: 'bg-yellow-100',
    icon: 'text-yellow-600',
    value: 'text-yellow-600',
    label: 'text-yellow-500',
    border: 'border-yellow-100'
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    icon: 'text-red-600',
    value: 'text-red-600',
    label: 'text-red-500',
    border: 'border-red-100'
  },
  gray: {
    bg: 'bg-gray-50',
    iconBg: 'bg-gray-100',
    icon: 'text-gray-600',
    value: 'text-gray-600',
    label: 'text-gray-500',
    border: 'border-gray-100'
  }
}

// 패키지명 한글
export const PACKAGE_LABELS = {
  starter: '스타터',
  basic: '베이직',
  premium: '프리미엄'
}

// 상태명 한글
export const STATUS_LABELS = {
  pending: '대기 중',
  active: '진행 중',
  completed: '완료',
  paused: '일시정지',
  cancelled: '취소됨'
}

// 과제 상태명 한글
export const TASK_STATUS_LABELS = {
  pending: '대기',
  in_progress: '진행 중',
  submitted: '제출됨',
  completed: '완료',
  cancelled: '취소됨'
}

// 우선순위명 한글
export const PRIORITY_LABELS = {
  low: '낮음',
  medium: '보통',
  high: '높음'
}
