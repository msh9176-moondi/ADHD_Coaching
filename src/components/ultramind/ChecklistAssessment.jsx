/**
 * Ultra Mind Solution 체크리스트 평가 컴포넌트
 * 카드뉴스 형태로 하나씩 진행
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { ultramindChecklists } from '../../data/ultramindChecklists'
import {
  ChevronLeft, ChevronRight, Check, Sparkles,
  Trophy, Heart, Zap, Target, ArrowRight, Star,
  Salad, Scale, Flame, Bug, Skull, Battery, Brain, FileText, Lightbulb
} from 'lucide-react'

// 카테고리 아이콘/색상 (Lucide 아이콘 사용)
const categoryConfig = {
  nutrition: { icon: Salad, color: 'emerald', label: '영양' },
  hormone: { icon: Scale, color: 'purple', label: '호르몬' },
  inflammation: { icon: Flame, color: 'red', label: '염증' },
  gut: { icon: Bug, color: 'yellow', label: '장건강' },
  toxicity: { icon: Skull, color: 'gray', label: '독소' },
  energy: { icon: Battery, color: 'orange', label: '에너지' },
  stress: { icon: Brain, color: 'blue', label: '스트레스' }
}

// 응원 메시지
const encouragements = [
  { threshold: 0.25, icon: <Zap className="w-8 h-8 text-amber-500" />, title: '좋은 시작이에요!', message: '첫 발을 내딛으셨어요. 이 흐름 그대로 가볼까요?' },
  { threshold: 0.5, icon: <Heart className="w-8 h-8 text-rose-500" />, title: '벌써 절반이에요!', message: '정말 잘하고 계세요. 당신의 노력이 빛나고 있어요.' },
  { threshold: 0.75, icon: <Star className="w-8 h-8 text-violet-500" />, title: '거의 다 왔어요!', message: '조금만 더 힘내세요. 곧 맞춤 프로그램을 만나실 수 있어요!' },
  { threshold: 1, icon: <Trophy className="w-8 h-8 text-emerald-500" />, title: '완료!', message: '모든 평가를 마치셨어요. 정말 대단해요!' }
]

/**
 * 메인 체크리스트 평가 컴포넌트
 */
export default function ChecklistAssessment({
  recommendedChecklistIds = [],
  onComplete,
  onGenerateProgram
}) {
  // 현재 체크리스트 인덱스
  const [currentChecklistIndex, setCurrentChecklistIndex] = useState(0)
  // 현재 질문 인덱스
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  // 모든 답변 저장
  const [allAnswers, setAllAnswers] = useState({})
  // 완료된 체크리스트 결과
  const [completedResults, setCompletedResults] = useState([])
  // 응원 메시지 표시 여부 { encouragement, isComplete, allResults }
  const [showEncouragement, setShowEncouragement] = useState(null)
  // 체크리스트 인트로 표시
  const [showChecklistIntro, setShowChecklistIntro] = useState(true)
  // 답변 처리 중 (빠른 클릭 방지)
  const [isProcessing, setIsProcessing] = useState(false)
  // 타임아웃 ref (cleanup용)
  const timeoutRef = useRef(null)

  // 타임아웃 정리 (언마운트 시)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // 표시할 체크리스트 목록
  const checklistsToShow = useMemo(() => {
    if (recommendedChecklistIds.length > 0) {
      return recommendedChecklistIds
        .map(id => ({ id, ...ultramindChecklists[id] }))
        .filter(c => c.name)
    }
    return ['dopamine', 'serotonin', 'gaba', 'acetylcholine']
      .map(id => ({ id, ...ultramindChecklists[id] }))
  }, [recommendedChecklistIds])

  // 현재 체크리스트
  const currentChecklist = checklistsToShow[currentChecklistIndex]
  const currentQuestions = currentChecklist?.questions || []
  const currentQuestion = currentQuestions[currentQuestionIndex]
  const config = categoryConfig[currentChecklist?.category] || { icon: FileText, color: 'gray', label: '기타' }

  // 전체 진행률 계산
  const totalQuestions = checklistsToShow.reduce((sum, c) => sum + (c.questions?.length || 0), 0)
  const answeredQuestions = Object.values(allAnswers).reduce((sum, answers) => sum + Object.keys(answers).length, 0)
  const overallProgress = totalQuestions > 0 ? answeredQuestions / totalQuestions : 0

  // 현재 체크리스트 진행률
  const currentChecklistAnswers = allAnswers[currentChecklist?.id] || {}
  const currentProgress = currentQuestions.length > 0
    ? Object.keys(currentChecklistAnswers).length / currentQuestions.length
    : 0

  // 답변 선택 처리
  const handleAnswer = useCallback((value) => {
    // 이미 처리 중이면 무시
    if (isProcessing) return

    // 이전 타임아웃 정리
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsProcessing(true)

    const checklistId = currentChecklist.id
    const questionIdx = currentQuestionIndex
    const isLastQuestion = questionIdx >= currentQuestions.length - 1

    // 새로운 답변 객체 생성
    const newAnswers = {
      ...(allAnswers[checklistId] || {}),
      [questionIdx]: value
    }

    setAllAnswers(prev => ({
      ...prev,
      [checklistId]: newAnswers
    }))

    // 다음 질문으로 이동 (약간의 딜레이)
    timeoutRef.current = setTimeout(() => {
      if (!isLastQuestion) {
        setCurrentQuestionIndex(questionIdx + 1)
      } else {
        // 체크리스트 완료 - 새로운 답변 객체 직접 전달
        handleChecklistComplete(newAnswers)
      }
      setIsProcessing(false)
    }, 250)
  }, [isProcessing, currentChecklist?.id, currentQuestionIndex, currentQuestions.length, allAnswers])

  // 체크리스트 완료 처리
  const handleChecklistComplete = (finalAnswers) => {
    const checklistId = currentChecklist.id
    const answers = finalAnswers || allAnswers[checklistId] || {}

    // 점수 계산 (예=1, 아니오=0)
    const score = Object.values(answers).reduce((sum, val) => sum + (val || 0), 0)
    const maxScore = currentQuestions.length

    const result = {
      checklistId,
      checklistName: currentChecklist.name,
      category: currentChecklist.category,
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      answers
    }

    // 새로운 완료된 결과 배열 (상태 업데이트 전에 계산)
    const newCompletedResults = [...completedResults, result]
    const newCompletedCount = newCompletedResults.length
    const isLastChecklist = currentChecklistIndex >= checklistsToShow.length - 1

    setCompletedResults(newCompletedResults)

    if (onComplete) {
      onComplete(result)
    }

    // 다음 체크리스트로 이동 또는 완료
    if (!isLastChecklist) {
      // 응원 메시지 체크
      const newProgress = newCompletedCount / checklistsToShow.length
      const oldProgress = completedResults.length / checklistsToShow.length
      const encouragement = encouragements.find(e =>
        newProgress >= e.threshold && oldProgress < e.threshold
      )

      if (encouragement) {
        setShowEncouragement({
          encouragement,
          isComplete: false,
          allResults: newCompletedResults
        })
      } else {
        moveToNextChecklist()
      }
    } else {
      // 모든 체크리스트 완료
      setShowEncouragement({
        encouragement: encouragements[3],
        isComplete: true,
        allResults: newCompletedResults
      })
    }
  }

  // 다음 체크리스트로 이동
  const moveToNextChecklist = () => {
    setShowEncouragement(null)
    setCurrentChecklistIndex(prev => prev + 1)
    setCurrentQuestionIndex(0)
    setShowChecklistIntro(true)
  }

  // 이전 질문으로
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else if (currentChecklistIndex > 0) {
      // 이전 체크리스트의 마지막 질문으로
      setCurrentChecklistIndex(prev => prev - 1)
      const prevChecklist = checklistsToShow[currentChecklistIndex - 1]
      setCurrentQuestionIndex(prevChecklist.questions.length - 1)
      setShowChecklistIntro(false)
    }
  }

  // 응원 메시지 화면
  if (showEncouragement) {
    const { encouragement, isComplete, allResults } = showEncouragement
    const displayCount = allResults?.length || completedResults.length

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          {encouragement.icon}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {encouragement.title}
        </h2>
        <p className="text-gray-500 mb-8 max-w-sm">
          {encouragement.message}
        </p>

        {/* 진행 상황 */}
        <div className="w-full max-w-xs mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>진행률</span>
            <span>{displayCount}/{checklistsToShow.length} 완료</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${(displayCount / checklistsToShow.length) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={isComplete ? () => onGenerateProgram(allResults || completedResults) : moveToNextChecklist}
          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg"
        >
          {isComplete ? (
            <>
              맞춤 프로그램 받기
              <Sparkles className="w-5 h-5" />
            </>
          ) : (
            <>
              다음 체크리스트
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    )
  }

  // 체크리스트 인트로 화면
  if (showChecklistIntro && currentChecklist) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        {/* 진행 상황 */}
        <div className="w-full max-w-xs mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>전체 진행률</span>
            <span>{currentChecklistIndex + 1}/{checklistsToShow.length}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
              style={{ width: `${(currentChecklistIndex / checklistsToShow.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 체크리스트 아이콘 */}
        <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-6">
          {config.icon && <config.icon className="w-12 h-12 text-violet-600" />}
        </div>

        <span className="px-3 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full mb-4">
          {config.label} 영역
        </span>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {currentChecklist.name}
        </h2>
        <p className="text-gray-500 mb-2 max-w-sm">
          {currentChecklist.description}
        </p>
        <p className="text-sm text-gray-400 mb-8">
          {currentQuestions.length}개 질문
        </p>

        <button
          onClick={() => setShowChecklistIntro(false)}
          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg"
        >
          시작하기
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  // 질문 카드 화면
  if (!currentQuestion) return null

  const questionText = typeof currentQuestion === 'object' ? currentQuestion.text : currentQuestion
  const currentAnswer = currentChecklistAnswers[currentQuestionIndex]

  return (
    <div className="max-w-lg mx-auto px-4">
      {/* 상단 진행률 */}
      <div className="mb-6">
        {/* 전체 진행률 */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span className="flex items-center gap-1">{config.icon && <config.icon className="w-3 h-3" />} {currentChecklist.name}</span>
          <span>{currentChecklistIndex + 1}/{checklistsToShow.length}</span>
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-violet-300 rounded-full transition-all"
            style={{ width: `${overallProgress * 100}%` }}
          />
        </div>

        {/* 현재 체크리스트 진행률 */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>질문 {currentQuestionIndex + 1} / {currentQuestions.length}</span>
          <span>{Math.round(currentProgress * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
            style={{ width: `${currentProgress * 100}%` }}
          />
        </div>
      </div>

      {/* 질문 카드 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <p className="text-lg text-gray-800 leading-relaxed text-center">
          {questionText}
        </p>
      </div>

      {/* 용어 설명 */}
      {currentQuestion?.hint && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-6">
          <p className="text-sm text-violet-700 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
            <span>{currentQuestion.hint}</span>
          </p>
        </div>
      )}

      {/* 예/아니오 버튼 */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => handleAnswer(1)}
          disabled={isProcessing}
          className={`flex-1 py-6 rounded-2xl border-2 transition-all ${
            isProcessing ? 'opacity-50 cursor-not-allowed' :
            currentAnswer === 1
              ? 'border-violet-500 bg-violet-100 ring-2 ring-violet-200'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
          }`}
        >
          <span className={`font-semibold text-xl ${currentAnswer === 1 ? 'text-violet-700' : 'text-gray-700'}`}>
            예
          </span>
        </button>

        <button
          onClick={() => handleAnswer(0)}
          disabled={isProcessing}
          className={`flex-1 py-6 rounded-2xl border-2 transition-all ${
            isProcessing ? 'opacity-50 cursor-not-allowed' :
            currentAnswer === 0
              ? 'border-violet-500 bg-violet-100 ring-2 ring-violet-200'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
          }`}
        >
          <span className={`font-semibold text-xl ${currentAnswer === 0 ? 'text-violet-700' : 'text-gray-700'}`}>
            아니오
          </span>
        </button>
      </div>

      {/* 네비게이션 */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentChecklistIndex === 0 && currentQuestionIndex === 0}
          className="flex items-center gap-1 px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          이전
        </button>

        <div className="flex gap-1">
          {currentQuestions.slice(
            Math.max(0, currentQuestionIndex - 2),
            Math.min(currentQuestions.length, currentQuestionIndex + 3)
          ).map((_, idx) => {
            const actualIdx = Math.max(0, currentQuestionIndex - 2) + idx
            return (
              <div
                key={actualIdx}
                className={`w-2 h-2 rounded-full transition-all ${
                  actualIdx === currentQuestionIndex
                    ? 'w-4 bg-violet-500'
                    : actualIdx < currentQuestionIndex || currentChecklistAnswers[actualIdx] !== undefined
                    ? 'bg-violet-300'
                    : 'bg-gray-200'
                }`}
              />
            )
          })}
        </div>

        <button
          onClick={() => {
            if (currentAnswer !== undefined) {
              if (currentQuestionIndex < currentQuestions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1)
              } else {
                handleChecklistComplete()
              }
            }
          }}
          disabled={currentAnswer === undefined}
          className="flex items-center gap-1 px-4 py-2 text-violet-600 hover:text-violet-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {currentQuestionIndex === currentQuestions.length - 1 ? '완료' : '다음'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
