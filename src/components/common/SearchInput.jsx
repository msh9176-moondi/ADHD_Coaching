import { Search, X } from 'lucide-react'

/**
 * 검색 입력 컴포넌트
 * @param {Object} props
 * @param {string} props.value - 검색어
 * @param {Function} props.onChange - 변경 핸들러
 * @param {string} props.placeholder - 플레이스홀더
 * @param {string} props.className - 추가 클래스
 * @param {boolean} props.showClear - 지우기 버튼 표시
 */
export function SearchInput({
  value,
  onChange,
  placeholder = '검색...',
  className = '',
  showClear = true
}) {
  const handleClear = () => {
    onChange('')
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {showClear && value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  )
}
