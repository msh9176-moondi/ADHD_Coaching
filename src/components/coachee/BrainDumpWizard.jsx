/**
 * 브레인 덤프 카드뉴스 검수 위자드
 * AI 분류 결과를 단계별로 사용자가 검수하는 UI
 */

import { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft, ArrowRight, Check, Edit3, AlertCircle,
  FolderOpen, ListTodo, Clock, Sparkles, X,
  ChevronLeft, ChevronRight, Lightbulb
} from 'lucide-react'

const STEPS = [
  { id: 'transform', title: '텍스트 검수', description: 'AI 변환 확인' },
  { id: 'category', title: '분류 검수', description: '포괄/일일 확인' },
  { id: 'priority', title: '우선순위', description: 'AI 조언 확인' },
  { id: 'schedule', title: '시간 배정', description: '언제 할지 정하기' }
]

export function BrainDumpWizard({ items, priorityAdvice, onComplete, onCancel }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [reviewedItems, setReviewedItems] = useState(
    items.map(item => ({
      ...item,
      text: item.transformed, // 최종 승인될 텍스트
      approved: false,
      scheduledTime: '',
      estimatedMinutes: 30
    }))
  )
  const [editingIndex, setEditingIndex] = useState(null)
  const [showTip, setShowTip] = useState(false)

  // 스와이프 관련
  const containerRef = useRef(null)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
    if (isRightSwipe && currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // 아이템 텍스트 수정
  const updateItemText = (index, newText) => {
    setReviewedItems(prev =>
      prev.map((item, i) => i === index ? { ...item, text: newText } : item)
    )
    setShowTip(true)
  }

  // 카테고리 변경
  const updateItemCategory = (index, newCategory) => {
    setReviewedItems(prev =>
      prev.map((item, i) => i === index ? { ...item, category: newCategory } : item)
    )
    setShowTip(true)
  }

  // 시간 설정
  const updateItemSchedule = (index, time, minutes) => {
    setReviewedItems(prev =>
      prev.map((item, i) => i === index ? {
        ...item,
        scheduledTime: time !== undefined ? time : item.scheduledTime,
        estimatedMinutes: minutes !== undefined ? minutes : item.estimatedMinutes
      } : item)
    )
  }

  // 최종 완료
  const handleFinish = () => {
    const dailyTasks = reviewedItems
      .filter(item => item.category === 'daily')
      .sort((a, b) => {
        if (!a.scheduledTime) return 1
        if (!b.scheduledTime) return -1
        return a.scheduledTime.localeCompare(b.scheduledTime)
      })

    const comprehensiveTasks = reviewedItems.filter(item => item.category === 'comprehensive')

    onComplete({ dailyTasks, comprehensiveTasks })
  }

  const dailyItems = reviewedItems.filter(item => item.category === 'daily')
  const comprehensiveItems = reviewedItems.filter(item => item.category === 'comprehensive')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        ref={containerRef}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 헤더 */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">브레인 덤프 검수</h2>
            <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 스텝 인디케이터 */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(index)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index === currentStep
                      ? 'bg-violet-600 text-white'
                      : index < currentStep
                        ? 'bg-violet-200 text-violet-700'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 ${index < currentStep ? 'bg-violet-200' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {STEPS[currentStep].title} - {STEPS[currentStep].description}
          </p>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: 텍스트 변환 검수 */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                <p className="text-sm text-violet-700">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  AI가 변환한 내용을 확인하고 필요시 수정하세요.
                </p>
              </div>

              {reviewedItems.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">원본</div>
                  <p className="text-sm text-gray-600 mb-2 line-through">{item.original}</p>

                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-violet-500" />
                    AI 변환
                  </div>
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateItemText(index, e.target.value)}
                      onBlur={() => setEditingIndex(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingIndex(null)}
                      autoFocus
                      className="w-full p-2 text-sm border border-violet-300 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-sm text-gray-800 font-medium">{item.text}</p>
                      <button
                        onClick={() => setEditingIndex(index)}
                        className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {item.aiNote && (
                    <p className="text-xs text-gray-400 mt-2 italic">{item.aiNote}</p>
                  )}
                </div>
              ))}

              {/* 수정 시 팁 표시 */}
              {showTip && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    과제를 이해하기 쉬운 행동용어로 규정하세요
                  </p>
                  <ul className="text-xs text-red-500 space-y-0.5 pl-1">
                    <li>• 광범위하게 표현된 과제가 있는가 확인할것</li>
                    <li>• 합리적이고 실행가능하며 더 작고 구체적인 것이 되도록 다시 표현할것</li>
                    <li>• 실행할 자신이 있을 정도의 행동으로 정의될 때까지 반복할것</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 2: 카테고리 분류 검수 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  AI가 분류한 카테고리를 확인하고 필요시 변경하세요.
                </p>
              </div>

              {/* 포괄 실행목록 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">포괄 실행목록</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                    {comprehensiveItems.length}
                  </span>
                </div>
                {comprehensiveItems.length === 0 ? (
                  <p className="text-xs text-gray-400 pl-6">없음</p>
                ) : (
                  comprehensiveItems.map((item, i) => {
                    const realIndex = reviewedItems.findIndex(ri => ri.original === item.original)
                    return (
                      <div key={i} className="ml-6 mb-2 p-2 bg-blue-50 rounded border border-blue-200 flex items-center justify-between">
                        <span className="text-sm text-gray-800">{item.text}</span>
                        <button
                          onClick={() => updateItemCategory(realIndex, 'daily')}
                          className="text-xs text-blue-600 hover:bg-blue-100 px-2 py-1 rounded"
                        >
                          → 일일로
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {/* 일일 실행목록 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ListTodo className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-700">일일 실행목록</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                    {dailyItems.length}
                  </span>
                </div>
                {dailyItems.length === 0 ? (
                  <p className="text-xs text-gray-400 pl-6">없음</p>
                ) : (
                  dailyItems.map((item, i) => {
                    const realIndex = reviewedItems.findIndex(ri => ri.original === item.original)
                    return (
                      <div key={i} className="ml-6 mb-2 p-2 bg-emerald-50 rounded border border-emerald-200 flex items-center justify-between">
                        <span className="text-sm text-gray-800">{item.text}</span>
                        <button
                          onClick={() => updateItemCategory(realIndex, 'comprehensive')}
                          className="text-xs text-emerald-600 hover:bg-emerald-100 px-2 py-1 rounded"
                        >
                          → 포괄로
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {/* 분류 가이드 */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">분류 기준</p>
                <ul className="text-xs text-gray-500 space-y-0.5">
                  <li><span className="text-emerald-600">● 일일:</span> 30분 이내 완료 가능한 구체적 행동</li>
                  <li><span className="text-blue-600">● 포괄:</span> 여러 단계가 필요한 장기 목표</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: 우선순위 조언 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* AI 조언 - 줄 단위로 파싱하여 표시 */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="font-semibold text-amber-900">AI 우선순위 조언</span>
                </div>
                <div className="space-y-2">
                  {priorityAdvice.split('\n').filter(line => line.trim()).map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                      <span className="w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-amber-800 leading-relaxed">{line.replace(/^[\d\.\-\•\*]\s*/, '')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ADHD 원칙 카드 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                  <p className="text-xs font-semibold text-violet-700 mb-1">🧘 자기 관리 우선</p>
                  <p className="text-xs text-violet-600">운동, 휴식을 다른 일정보다 먼저</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">🎯 중요한 일 먼저</p>
                  <p className="text-xs text-emerald-600">우선순위 높은 일 완료 후 보상</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-1">🎁 보상 활용</p>
                  <p className="text-xs text-blue-600">즐거운 활동은 과제 수행 보상으로</p>
                </div>
                <div className="p-3 bg-pink-50 rounded-lg border border-pink-100">
                  <p className="text-xs font-semibold text-pink-700 mb-1">🪜 작게 분해</p>
                  <p className="text-xs text-pink-600">회피하는 과제는 가장 작은 단계로</p>
                </div>
              </div>

              {/* 일일 목록 미리보기 */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">오늘 할 일 ({dailyItems.length}개)</p>
                {dailyItems.map((item, i) => (
                  <div key={i} className="p-2.5 mb-1.5 bg-white rounded-lg border border-gray-200 flex items-center gap-3 shadow-sm">
                    <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-800">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: 시간 배정 */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-sm text-emerald-700">
                  <Clock className="w-4 h-4 inline mr-1" />
                  일일 목록의 시작 시간을 설정하세요. (선택사항)
                </p>
              </div>

              {dailyItems.length === 0 ? (
                <p className="text-center text-gray-400 py-8">일일 실행목록이 없습니다.</p>
              ) : (
                dailyItems.map((item, i) => {
                  const realIndex = reviewedItems.findIndex(ri => ri.original === item.original)
                  return (
                    <div key={i} className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-800 mb-2">{item.text}</p>
                      <div className="flex items-center gap-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">시작 시간</label>
                          <input
                            type="time"
                            value={item.scheduledTime}
                            onChange={(e) => updateItemSchedule(realIndex, e.target.value, undefined)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">예상 시간</label>
                          <select
                            value={item.estimatedMinutes}
                            onChange={(e) => updateItemSchedule(realIndex, undefined, parseInt(e.target.value))}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value={10}>10분</option>
                            <option value={15}>15분</option>
                            <option value={30}>30분</option>
                            <option value={45}>45분</option>
                            <option value={60}>1시간</option>
                            <option value={90}>1시간 30분</option>
                            <option value={120}>2시간</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500">
                  💡 팁: 예상 시간의 1.5~2배 여유를 두세요. 일정과 일정 사이에 완충시간을 충분히 두는 것이 좋습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : onCancel()}
            className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 0 ? '취소' : '이전'}
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex items-center gap-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
            >
              다음
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              완료
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BrainDumpWizard
