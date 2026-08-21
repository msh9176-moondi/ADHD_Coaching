/**
 * Ultra Mind Solution 6주 프로그램 컴포넌트
 * 체크리스트 결과에 따른 맞춤형 6주 프로그램 표시
 * 기존 구독 시스템과 통합됨
 */

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { generatePrescription, generate6WeekProgram } from '../../lib/ultramindAnalysisService'
import {
  // 기본 아이콘
  BarChart3, FileText, UserCheck, Target, Clock, Calendar,
  // 식단/건강
  Utensils, Apple, Leaf, Pill, Droplets, Coffee,
  // 운동/활동
  Footprints, Dumbbell, Heart, Activity, Zap,
  // 시간대
  Sun, Sunrise, Sunset, Moon, AlarmClock, BedDouble,
  // 체크/상태
  Check, CheckCircle, Circle, AlertTriangle, ChevronDown,
  // 기타
  Brain, Sparkles, Shield, Wind, Timer, ListChecks,
  Salad, Ban, Star, Flame, Battery, BookOpen
} from 'lucide-react'

/**
 * 주차별 프로그램 카드
 */
function PhaseCard({ phase, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
          {phase.week}
        </span>
        {isActive && (
          <span className="bg-white/20 px-2 py-0.5 rounded text-xs">현재</span>
        )}
      </div>
      <h3 className={`font-semibold ${isActive ? 'text-white' : 'text-gray-900'}`}>
        {phase.title}
      </h3>
      <p className={`text-sm mt-1 ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
        {phase.focus}
      </p>
    </button>
  )
}

/**
 * 태스크 목록 컴포넌트
 */
function TaskList({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-4 text-center">
        이 단계의 태스크가 없습니다.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((taskGroup, idx) => (
        <div key={idx} className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">{taskGroup.category}</h4>
          <ul className="space-y-2">
            {taskGroup.items.map((item, itemIdx) => (
              <li key={itemIdx} className="flex items-start gap-2 text-sm text-gray-600">
                <input type="checkbox" className="mt-0.5 rounded" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

/**
 * 일일 루틴 컴포넌트 (상세 시간대별)
 */
function DailyRoutine({ routine, detailedRoutine }) {
  // 상세 루틴이 있으면 타임라인 형태로 표시
  if (detailedRoutine) {
    const timeSlots = [
      { key: 'wakeUp', icon: <AlarmClock className="w-5 h-5 text-amber-600" />, color: 'border-amber-300 bg-amber-50' },
      { key: 'morning', icon: <Sunrise className="w-5 h-5 text-yellow-600" />, color: 'border-yellow-300 bg-yellow-50' },
      { key: 'midMorning', icon: <Coffee className="w-5 h-5 text-orange-600" />, color: 'border-orange-300 bg-orange-50' },
      { key: 'lunch', icon: <Utensils className="w-5 h-5 text-green-600" />, color: 'border-green-300 bg-green-50' },
      { key: 'afternoon', icon: <Sun className="w-5 h-5 text-blue-600" />, color: 'border-blue-300 bg-blue-50' },
      { key: 'preDinner', icon: <Footprints className="w-5 h-5 text-cyan-600" />, color: 'border-cyan-300 bg-cyan-50' },
      { key: 'dinner', icon: <Salad className="w-5 h-5 text-emerald-600" />, color: 'border-emerald-300 bg-emerald-50' },
      { key: 'evening', icon: <Sunset className="w-5 h-5 text-purple-600" />, color: 'border-purple-300 bg-purple-50' },
      { key: 'bedtime', icon: <Moon className="w-5 h-5 text-indigo-600" />, color: 'border-indigo-300 bg-indigo-50' }
    ]

    return (
      <div className="space-y-3">
        {timeSlots.map(slot => {
          const data = detailedRoutine[slot.key]
          if (!data) return null

          return (
            <div key={slot.key} className={`rounded-lg p-4 border-l-4 ${slot.color}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                  {slot.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">{data.time}</span>
              </div>
              <ul className="space-y-1 ml-11">
                {data.tasks?.map((task, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <Circle className="w-2 h-2 mt-1.5 text-gray-400 flex-shrink-0" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    )
  }

  // 기존 간단한 루틴 표시 (호환성)
  const simpleSlots = [
    { key: 'morning', label: '아침', icon: <Sunrise className="w-5 h-5 text-yellow-600" />, color: 'bg-yellow-50 border-yellow-200' },
    { key: 'afternoon', label: '오후', icon: <Sun className="w-5 h-5 text-blue-600" />, color: 'bg-blue-50 border-blue-200' },
    { key: 'evening', label: '저녁', icon: <Moon className="w-5 h-5 text-purple-600" />, color: 'bg-purple-50 border-purple-200' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {simpleSlots.map(slot => (
        <div key={slot.key} className={`rounded-lg p-4 border ${slot.color}`}>
          <div className="flex items-center gap-2 mb-3">
            {slot.icon}
            <h4 className="font-medium text-gray-900">{slot.label}</h4>
          </div>
          <ul className="space-y-2">
            {(routine?.[slot.key] || []).map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                <Circle className="w-1.5 h-1.5 text-gray-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

/**
 * 구독 상태 표시 컴포넌트 (기존 구독 시스템 연동)
 */
function SubscriptionStatus({ subscription, onNavigateToSubscription }) {
  const hasActiveSubscription = subscription?.status === 'active'
  const sessionsLeft = subscription
    ? subscription.sessions_per_month - (subscription.sessions_used_this_month || 0)
    : 0

  if (hasActiveSubscription) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-green-900">코치 구독 활성화됨</h3>
            <p className="text-sm text-green-700">프로그램 진행 중 코치 상담을 이용할 수 있습니다</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">이번 달 남은 세션</span>
            <span className="font-medium text-gray-900">{sessionsLeft}회</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">구독 상태</span>
            <span className="font-medium text-green-600">활성</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">코치 구독 없음</h3>
          <p className="text-sm text-gray-600">프로그램은 진행 가능하지만, 코치 상담은 구독 후 이용 가능합니다</p>
        </div>
      </div>

      <button
        onClick={onNavigateToSubscription}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        구독 플랜 보기
      </button>
    </div>
  )
}

/**
 * 레이더 차트 컴포넌트 (SVG)
 */
function RadarChart({ data }) {
  const size = 280
  const center = size / 2
  const maxRadius = 100
  const levels = 4 // 동심원 개수

  // 각 데이터 포인트의 각도 계산
  const angleStep = (2 * Math.PI) / data.length
  const startAngle = -Math.PI / 2 // 12시 방향에서 시작

  // 점수를 좌표로 변환
  const getPoint = (index, value) => {
    const angle = startAngle + index * angleStep
    const radius = (value / 100) * maxRadius
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    }
  }

  // 데이터 폴리곤 경로 (percentage가 높을수록 바깥쪽 = 관리 필요)
  const dataPath = data.map((item, i) => {
    const point = getPoint(i, item.percentage)
    return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  }).join(' ') + ' Z'

  // 점수별 색상
  const getColor = (percentage) => {
    if (percentage >= 70) return { fill: '#fecaca', stroke: '#ef4444' } // 빨강 (문제 많음)
    if (percentage >= 50) return { fill: '#fef08a', stroke: '#eab308' } // 노랑 (주의)
    return { fill: '#bbf7d0', stroke: '#22c55e' } // 초록 (양호)
  }

  const avgPercentage = data.reduce((sum, d) => sum + d.percentage, 0) / data.length
  const colors = getColor(avgPercentage)

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* 동심원 그리드 */}
        {[...Array(levels)].map((_, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={maxRadius * ((i + 1) / levels)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* 축선 */}
        {data.map((_, i) => {
          const angle = startAngle + i * angleStep
          const endX = center + maxRadius * Math.cos(angle)
          const endY = center + maxRadius * Math.sin(angle)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          )
        })}

        {/* 데이터 영역 */}
        <path
          d={dataPath}
          fill={colors.fill}
          fillOpacity="0.5"
          stroke={colors.stroke}
          strokeWidth="2"
        />

        {/* 데이터 포인트 */}
        {data.map((item, i) => {
          const point = getPoint(i, item.percentage)
          return (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="5"
              fill={colors.stroke}
              stroke="white"
              strokeWidth="2"
            />
          )
        })}

        {/* 라벨 */}
        {data.map((item, i) => {
          const angle = startAngle + i * angleStep
          const labelRadius = maxRadius + 30
          const x = center + labelRadius * Math.cos(angle)
          const y = center + labelRadius * Math.sin(angle)
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-gray-600 font-medium"
            >
              {item.name && item.name.length > 6 ? item.name.slice(0, 6) + '..' : (item.name || '')}
            </text>
          )
        })}
      </svg>

      {/* 범례 */}
      <div className="flex gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-gray-600">주의 필요</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="text-gray-600">관리 필요</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-gray-600">양호</span>
        </div>
      </div>
    </div>
  )
}

/**
 * 결과 시각화 컴포넌트
 */
export function ResultsVisualization({ prescriptions, checklistResults }) {
  const [expandedId, setExpandedId] = useState(null)
  const [viewMode, setViewMode] = useState('chart') // 'chart' | 'detail'

  if (!prescriptions || prescriptions.length === 0) return null

  // 레이더 차트 데이터 준비
  const radarData = prescriptions.map(rx => ({
    name: (rx.checklistName || rx.checklistId || '항목').replace(' 체크리스트', ''),
    percentage: rx.percentage || 0
  }))

  // 평균 점수 계산
  const avgScore = Math.round(prescriptions.reduce((sum, rx) => sum + rx.percentage, 0) / prescriptions.length)

  // 심각도별 분류
  const highSeverity = prescriptions.filter(rx => rx.severity === 'high')
  const mediumSeverity = prescriptions.filter(rx => rx.severity === 'medium')
  const lowSeverity = prescriptions.filter(rx => rx.severity === 'low')

  // 점수별 색상 및 상태
  const getScoreStatus = (percentage) => {
    if (percentage >= 70) return { color: 'red', label: '집중 관리 필요', bg: 'bg-red-500' }
    if (percentage >= 50) return { color: 'yellow', label: '관리 필요', bg: 'bg-yellow-500' }
    return { color: 'green', label: '양호', bg: 'bg-green-500' }
  }

  return (
    <div className="space-y-6">
      {/* 종합 점수 카드 */}
      <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-violet-200 text-sm font-medium">종합 불균형 지수</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-bold">{avgScore}</span>
              <span className="text-2xl text-violet-200">/ 100</span>
            </div>
          </div>
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        <p className="text-sm text-violet-100">
          {avgScore >= 70
            ? '여러 영역에서 불균형이 감지되었습니다. 6주 프로그램으로 체계적인 관리가 필요합니다.'
            : avgScore >= 50
            ? '일부 영역에서 관리가 필요합니다. 맞춤 프로그램을 시작해보세요.'
            : '전반적으로 양호한 상태입니다. 현재 상태를 유지하며 예방적 관리를 권장합니다.'}
        </p>

        {/* 심각도 요약 */}
        <div className="flex gap-3 mt-4">
          {highSeverity.length > 0 && (
            <div className="bg-red-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-red-300 rounded-full" />
              <span className="text-sm">집중관리 {highSeverity.length}개</span>
            </div>
          )}
          {mediumSeverity.length > 0 && (
            <div className="bg-yellow-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-300 rounded-full" />
              <span className="text-sm">주의 {mediumSeverity.length}개</span>
            </div>
          )}
          {lowSeverity.length > 0 && (
            <div className="bg-green-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-green-300 rounded-full" />
              <span className="text-sm">양호 {lowSeverity.length}개</span>
            </div>
          )}
        </div>
      </div>

      {/* 뷰 모드 전환 */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setViewMode('chart')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            viewMode === 'chart' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
          }`}
        >
          차트 보기
        </button>
        <button
          onClick={() => setViewMode('detail')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            viewMode === 'detail' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
          }`}
        >
          상세 보기
        </button>
      </div>

      {viewMode === 'chart' ? (
        <>
          {/* 레이더 차트 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">영역별 불균형 분포</h3>
            <RadarChart data={radarData} />
            <p className="text-center text-xs text-gray-400 mt-4">
              * 바깥쪽으로 튀어나올수록 관리 필요, 중심에 가까울수록 양호
            </p>
          </div>

          {/* 개별 점수 바 차트 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">영역별 상세 점수</h3>
            <div className="space-y-4">
              {prescriptions
                .sort((a, b) => b.percentage - a.percentage)
                .map(rx => {
                  const status = getScoreStatus(rx.percentage)
                  return (
                    <div key={rx.checklistId} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          {(rx.checklistName || rx.checklistId || '').replace(' 체크리스트', '')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            status.color === 'red' ? 'bg-red-100 text-red-700' :
                            status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {status.label}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{rx.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${status.bg}`}
                          style={{ width: `${rx.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </>
      ) : (
        /* 상세 처방 목록 */
        <div className="space-y-3">
          {prescriptions
            .sort((a, b) => b.percentage - a.percentage)
            .map(rx => {
              const isExpanded = expandedId === rx.checklistId
              const status = getScoreStatus(rx.percentage)

              return (
                <div
                  key={rx.checklistId}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : rx.checklistId)}
                    className="w-full p-4 flex items-center gap-4 text-left"
                  >
                    {/* 점수 원형 */}
                    <div className={`relative w-14 h-14 rounded-full flex items-center justify-center ${
                      status.color === 'red' ? 'bg-red-100' :
                      status.color === 'yellow' ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      <svg className="absolute inset-0 w-14 h-14 -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="4"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke={status.color === 'red' ? '#ef4444' : status.color === 'yellow' ? '#eab308' : '#22c55e'}
                          strokeWidth="4"
                          strokeDasharray={`${rx.percentage * 1.51} 151`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className={`text-sm font-bold ${
                        status.color === 'red' ? 'text-red-700' :
                        status.color === 'yellow' ? 'text-yellow-700' : 'text-green-700'
                      }`}>
                        {rx.percentage}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{rx.checklistName || rx.checklistId || '항목'}</h4>
                      <p className={`text-sm ${
                        status.color === 'red' ? 'text-red-600' :
                        status.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {status.label}
                      </p>
                    </div>

                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                      {rx.recommendations.diet?.length > 0 && (
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <h5 className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-2">
                            <Salad className="w-4 h-4" /> 식단 권장
                          </h5>
                          <ul className="text-sm text-emerald-700 space-y-1">
                            {rx.recommendations.diet.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Circle className="w-2 h-2 mt-1.5 text-emerald-400 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {rx.recommendations.supplements?.length > 0 && (
                        <div className="bg-violet-50 rounded-lg p-3">
                          <h5 className="text-sm font-medium text-violet-800 mb-2 flex items-center gap-2">
                            <Pill className="w-4 h-4" /> 보충제 권장
                          </h5>
                          <ul className="text-sm text-violet-700 space-y-1">
                            {rx.recommendations.supplements.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Circle className="w-2 h-2 mt-1.5 text-violet-400 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {rx.recommendations.lifestyle?.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <h5 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> 생활습관
                          </h5>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {rx.recommendations.lifestyle.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Circle className="w-2 h-2 mt-1.5 text-blue-400 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {rx.recommendations.avoidances?.length > 0 && (
                        <div className="bg-red-50 rounded-lg p-3">
                          <h5 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> 피해야 할 것
                          </h5>
                          <ul className="text-sm text-red-700 space-y-1">
                            {rx.recommendations.avoidances.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Circle className="w-2 h-2 mt-1.5 text-red-400 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

/**
 * 메인 6주 프로그램 컴포넌트
 * @param {Array} checklistResults - 체크리스트 결과
 * @param {Object} subscription - 기존 구독 정보 (subscriptions 테이블)
 * @param {Object} tdeeData - TDEE 데이터 (칼로리 기반 식단)
 * @param {Function} onStartProgram - 프로그램 시작 콜백
 */
export default function SixWeekProgram({ checklistResults, subscription, tdeeData, onStartProgram }) {
  const navigate = useNavigate()
  const [activePhase, setActivePhase] = useState(0)
  const [showProgramDetail, setShowProgramDetail] = useState(false)

  // 구독 상태 확인
  const hasActiveSubscription = subscription?.status === 'active'

  // 처방 및 프로그램 생성 (TDEE 데이터 포함)
  const { prescriptions, program } = useMemo(() => {
    const rx = generatePrescription(checklistResults)
    const prog = generate6WeekProgram(rx, {
      hasCoachAccess: hasActiveSubscription,
      tdeeData: tdeeData // TDEE 데이터 전달
    })
    return { prescriptions: rx, program: prog }
  }, [checklistResults, hasActiveSubscription, tdeeData])

  const handleStartProgram = () => {
    if (onStartProgram) {
      onStartProgram({
        program,
        prescriptions,
        tdeeData, // TDEE 데이터 포함
        subscriptionId: subscription?.id || null,
        hasCoachAccess: hasActiveSubscription,
        startDate: new Date().toISOString()
      })
    }
  }

  const handleNavigateToSubscription = () => {
    navigate('/coachee/subscription')
  }

  return (
    <div className="space-y-8">
      {/* ========== 1. 검사 결과 ========== */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-violet-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">검사 결과</h2>
        </div>
        <ResultsVisualization
          prescriptions={prescriptions}
          checklistResults={checklistResults}
        />
      </section>

      {/* ========== 2. 6주 프로그램 미리보기 ========== */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">맞춤 6주 프로그램</h2>
        </div>

        {/* 프로그램 요약 카드 */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold mb-1">당신만을 위한 6주 여정</h3>
              <p className="text-emerald-100 text-sm">
                {program.userSummary?.highPriority > 0
                  ? `${program.userSummary.highPriority}개 핵심 영역 집중 관리 프로그램`
                  : '전반적인 뇌 건강 최적화 프로그램'}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* 핵심 관리 영역 */}
          {program.userSummary?.mainFocusAreas?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-emerald-200 mb-2">핵심 관리 영역</p>
              <div className="flex flex-wrap gap-2">
                {program.userSummary.mainFocusAreas.map((area, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    {area.replace(' 체크리스트', '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 6주 단계 요약 */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { week: '1-2주', title: '해독·정화', icon: <Wind className="w-6 h-6" /> },
              { week: '3-4주', title: '강화·치유', icon: <Zap className="w-6 h-6" /> },
              { week: '5-6주', title: '안정·유지', icon: <Sparkles className="w-6 h-6" /> }
            ].map((phase, idx) => (
              <div key={idx} className="bg-white/10 rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1">{phase.icon}</div>
                <div className="text-xs text-emerald-200">{phase.week}</div>
                <div className="text-sm font-medium">{phase.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 준비 주간 안내 */}
        {program.preparationWeek && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">준비 주간 필요</h4>
                <p className="text-sm text-amber-700 mt-1">
                  본격적인 프로그램 시작 전 1주간의 준비 기간이 필요합니다.
                  카페인, 설탕, 가공식품을 서서히 줄여 몸을 준비시키세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 상세 보기 토글 */}
        <button
          onClick={() => setShowProgramDetail(!showProgramDetail)}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          {showProgramDetail ? '간략히 보기' : '프로그램 상세 보기'}
          <svg
            className={`w-4 h-4 transition-transform ${showProgramDetail ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 프로그램 상세 (토글) */}
        {showProgramDetail && (
          <div className="mt-4 space-y-6">
            {/* 식단 권장사항 */}
            {program.dietRecommendations && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Salad className="w-4 h-4 text-emerald-600" />
                  </div>
                  6주 식단 가이드
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-2">
                      <Check className="w-4 h-4" /> 섭취할 음식
                    </h4>
                    <ul className="text-sm text-emerald-700 space-y-1">
                      {program.dietRecommendations.mustEat?.slice(0, 4).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Leaf className="w-3 h-3 mt-1 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                      <Ban className="w-4 h-4" /> 피할 음식
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {program.dietRecommendations.mustAvoid?.slice(0, 4).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Circle className="w-2 h-2 mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {program.dietRecommendations.specific?.length > 0 && (
                  <div className="mt-4 bg-violet-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-violet-800 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" /> 맞춤 권장사항
                    </h4>
                    <ul className="text-sm text-violet-700 space-y-1">
                      {program.dietRecommendations.specific.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Star className="w-3 h-3 mt-1 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 보충제 가이드 */}
            {program.supplements && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Pill className="w-4 h-4 text-blue-600" />
                  </div>
                  보충제 가이드
                </h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> 기본 보충제 (모든 사람)
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {program.supplements.base?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Circle className="w-2 h-2 mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {program.supplements.custom?.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> 맞춤 추가 보충제
                      </h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        {program.supplements.custom.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Star className="w-3 h-3 mt-1 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 주차별 카드 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">주차별 프로그램</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {program.phases.map((phase, idx) => (
                  <PhaseCard
                    key={idx}
                    phase={phase}
                    isActive={idx === activePhase}
                    onClick={() => setActivePhase(idx)}
                  />
                ))}
              </div>
            </div>

            {/* 현재 단계 상세 */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {program.phases[activePhase]?.week} - {program.phases[activePhase]?.title}
                </h3>
                <span className="text-sm text-gray-500">{program.phases[activePhase]?.focus}</span>
              </div>

              {/* 주간 목표 */}
              {program.phases[activePhase]?.goals && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" /> 이번 주 목표
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {program.phases[activePhase].goals.map((goal, idx) => (
                      <span key={idx} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 실천 과제 */}
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-blue-600" /> 실천 과제
              </h4>
              <TaskList tasks={program.phases[activePhase]?.tasks} />
            </div>

            {/* 일일 루틴 */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                일일 루틴
              </h3>
              <DailyRoutine
                routine={program.dailyRoutine}
                detailedRoutine={program.detailedDailyRoutine}
              />
            </div>

            {/* 주간 체크리스트 */}
            {program.weeklyChecklist && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  주간 체크리스트
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(program.weeklyChecklist).map(([key, items]) => {
                    const labels = {
                      exercise: { title: '운동', icon: <Footprints className="w-4 h-4 text-orange-600" />, color: 'bg-orange-50' },
                      nutrition: { title: '영양', icon: <Apple className="w-4 h-4 text-green-600" />, color: 'bg-green-50' },
                      supplements: { title: '보충제', icon: <Pill className="w-4 h-4 text-blue-600" />, color: 'bg-blue-50' },
                      lifestyle: { title: '생활습관', icon: <Heart className="w-4 h-4 text-purple-600" />, color: 'bg-purple-50' },
                      mindset: { title: '마인드셋', icon: <Brain className="w-4 h-4 text-pink-600" />, color: 'bg-pink-50' }
                    }
                    const label = labels[key] || { title: key, icon: <FileText className="w-4 h-4 text-gray-600" />, color: 'bg-gray-50' }

                    return (
                      <div key={key} className={`rounded-lg p-4 ${label.color}`}>
                        <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                          {label.icon} {label.title}
                        </h4>
                        <ul className="space-y-1">
                          {items.map((item, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <Circle className="w-3 h-3 mt-1 text-gray-300 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========== 3. 코치 연결 ========== */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">코치 연결</h2>
        </div>

        <SubscriptionStatus
          subscription={subscription}
          onNavigateToSubscription={handleNavigateToSubscription}
        />
      </section>

      {/* ========== 4. 시작 버튼 (고정형) ========== */}
      <section className="sticky bottom-4 z-10">
        <div className="bg-white rounded-2xl p-5 shadow-xl border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">6주 프로그램 시작하기</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                {hasActiveSubscription ? (
                  <><Check className="w-4 h-4 text-green-500" /> 코치 상담 포함</>
                ) : (
                  '코치 상담 없이 시작 (나중에 추가 가능)'
                )}
              </p>
            </div>
            <button
              onClick={handleStartProgram}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-semibold shadow-lg shadow-emerald-200"
            >
              시작하기
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
