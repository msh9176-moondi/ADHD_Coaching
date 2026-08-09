import { Zap, MapPin, Clock, AlertCircle, RotateCcw } from 'lucide-react'

// 실행 과제 필드별 가이드라인
export const FIELD_GUIDES = {
  minAction: {
    title: '가장 작은 행동',
    icon: Zap,
    color: 'blue',
    why: '뇌는 "큰 계획"을 보면 압도당해서 시작을 미룹니다.',
    how: '5분 안에 끝낼 수 있을 정도로 작게 쪼개세요.',
    examples: [
      '책 1페이지만 읽기',
      '운동복만 입기',
      '노트북 켜고 파일 열기'
    ]
  },
  location: {
    title: '실행 장소',
    icon: MapPin,
    color: 'green',
    why: '특정 장소는 특정 행동을 자동으로 떠올리게 합니다.',
    how: '이 행동을 할 때 항상 같은 장소를 정하세요.',
    examples: [
      '책상 앞',
      '스터디카페 지정석',
      '거실 소파'
    ]
  },
  signal: {
    title: '실행 신호',
    icon: Clock,
    color: 'purple',
    why: '"언제 할까" 고민하는 순간 에너지가 소모됩니다.',
    how: '이미 하고 있는 행동 직후에 연결하세요.',
    examples: [
      '알람이 울리면',
      '커피를 마신 직후',
      '자리에 앉자마자'
    ]
  },
  fallback: {
    title: '축소 행동',
    icon: AlertCircle,
    color: 'amber',
    why: '컨디션이 안 좋은 날에도 "0"이 아닌 "1"을 할 수 있습니다.',
    how: '최악의 날에도 할 수 있는 최소 버전을 정하세요.',
    examples: [
      '1페이지 대신 1문장만 읽기',
      '운동 대신 스트레칭만',
      '10분 대신 1분만'
    ]
  },
  returnAction: {
    title: '복귀 행동',
    icon: RotateCcw,
    color: 'teal',
    why: '중단은 실패가 아닙니다. 돌아오는 방법을 알면 됩니다.',
    how: '흐름이 끊겼을 때 다시 시작하는 첫 동작을 정하세요.',
    examples: [
      '타이머 다시 10분 설정',
      '책상 위 정리하고 다시 앉기',
      '물 한 잔 마시고 재시작'
    ]
  }
}

// 색상 맵
export const COLOR_MAP = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', ring: 'focus:ring-blue-500' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', ring: 'focus:ring-green-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', ring: 'focus:ring-purple-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', ring: 'focus:ring-amber-500' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', ring: 'focus:ring-teal-500' },
}
