/**
 * Ultra Mind Solution 프로그램 페이지
 * 피코치가 체크리스트 평가 및 6주 프로그램을 진행하는 페이지
 */

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import ChecklistAssessment from '../../components/ultramind/ChecklistAssessment'
import SixWeekProgram, { ResultsVisualization } from '../../components/ultramind/SixWeekProgram'
import TDEESurvey from '../../components/ultramind/TDEESurvey'
import { runFullAnalysis } from '../../lib/ultramindAnalysisService'
import { getMessages } from '../../lib/messageService'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import {
  Brain, Zap, Heart, Leaf, Shield, Battery,
  Sparkles, ChevronLeft, ChevronRight, Check,
  ArrowRight, Clock, Target, TrendingUp,
  Utensils, Frown, Pill, Bug, Skull, Flame, Scale, SkipForward
} from 'lucide-react'

// 단계 정의
const STEPS = {
  INTRO: 'intro',
  ANALYSIS: 'analysis',
  CATEGORY_SELECT: 'category_select', // 카테고리 선택
  CHECKLIST: 'checklist',
  TDEE: 'tdee', // TDEE 설문 (칼로리 기반 식단)
  PROGRAM: 'program',
  ACTIVE: 'active' // 프로그램 진행 중
}

export default function UltramindProgramPage() {
  const navigate = useNavigate()
  const { user } = useStore()

  const [currentStep, setCurrentStep] = useState(STEPS.INTRO)
  const [loading, setLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [selectedCategories, setSelectedCategories] = useState([]) // 선택된 카테고리
  const [checklistResults, setChecklistResults] = useState([])
  const [tdeeData, setTdeeData] = useState(null) // TDEE 데이터
  const [activeProgram, setActiveProgram] = useState(null)
  const [subscription, setSubscription] = useState(null) // 기존 구독 정보
  const [error, setError] = useState(null)

  // 기존 프로그램 및 구독 상태 확인
  useEffect(() => {
    if (user) {
      checkExistingProgram()
      fetchSubscription()
    }
  }, [user])

  const checkExistingProgram = async () => {
    if (!user) return

    // 먼저 로컬 스토리지 확인
    const localProgram = localStorage.getItem(`ultramind_program_${user.id}`)
    if (localProgram) {
      try {
        const parsed = JSON.parse(localProgram)
        if (parsed.status === 'active') {
          setActiveProgram(parsed)
          setCurrentStep(STEPS.ACTIVE)
          return
        }
      } catch (e) {
        console.warn('로컬 프로그램 파싱 실패')
      }
    }

    // Supabase에서 확인
    if (!isSupabaseConfigured()) return

    try {
      const { data, error } = await supabase
        .from('ultramind_programs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      // 테이블이 없는 경우 무시
      if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
        console.error('프로그램 상태 확인 실패:', error)
        return
      }

      if (data) {
        setActiveProgram(data)
        setCurrentStep(STEPS.ACTIVE)
      }
    } catch (err) {
      console.error('프로그램 상태 확인 실패:', err)
    }
  }

  // 기존 구독 정보 가져오기
  const fetchSubscription = async () => {
    if (!user || !isSupabaseConfigured()) return

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (data) {
        setSubscription(data)
      }
    } catch (err) {
      console.error('구독 정보 확인 실패:', err)
    }
  }

  // 대화 분석 시작
  const handleStartAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      // 사용자의 대화 내역 가져오기
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('coachee_id', user.id)

      if (!conversations || conversations.length === 0) {
        // 대화 내역이 없으면 모든 7 Keys 카테고리 표시
        setAnalysisResult({
          recommendedCategories: [
            { id: 'nutrition', name: '영양', icon: '🥗', description: '뇌 기능에 필수적인 영양소와 신경전달물질', reason: '기본 평가', checklists: ['fattyAcids', 'vitaminD', 'magnesium', 'zinc', 'methylation', 'dopamine', 'serotonin', 'gaba', 'acetylcholine'] },
            { id: 'hormone', name: '호르몬', icon: '⚖️', description: '인슐린, 갑상선, 성호르몬 균형', reason: '기본 평가', checklists: ['insulin', 'thyroid', 'sexHormonesFemale', 'sexHormonesMale'] },
            { id: 'inflammation', name: '염증', icon: '🔥', description: '전신 염증과 면역 불균형', reason: '기본 평가', checklists: ['inflammation'] },
            { id: 'gut', name: '장건강', icon: '🦠', description: '소화기능과 장내 미생물 균형', reason: '기본 평가', checklists: ['gutHealth'] },
            { id: 'toxicity', name: '독소', icon: '☠️', description: '체내 독소 축적과 해독 능력', reason: '기본 평가', checklists: ['toxicity'] },
            { id: 'energy', name: '에너지 대사', icon: '⚡', description: '미토콘드리아 기능과 산화 스트레스', reason: '기본 평가', checklists: ['energy', 'oxidativeStress'] },
            { id: 'stress', name: '스트레스', icon: '🧘', description: '만성 스트레스와 부신 기능', reason: '기본 평가', checklists: ['stress'] }
          ],
          summary: '대화 내역이 없어 전체 7 Keys 카테고리를 표시합니다. 관심 있는 카테고리를 선택해주세요.'
        })
        setCurrentStep(STEPS.CATEGORY_SELECT)
        return
      }

      // 대화 메시지 가져오기
      const allMessages = []
      for (const conv of conversations) {
        const messages = await getMessages(conv.id, 100)
        allMessages.push(...messages)
      }

      // AI 분석 실행
      const result = await runFullAnalysis(allMessages)
      setAnalysisResult(result)
      setCurrentStep(STEPS.CATEGORY_SELECT)

    } catch (err) {
      console.error('분석 실패:', err)
      // 오류 시 기본 카테고리로 진행
      setAnalysisResult({
        recommendedCategories: [
          { id: 'nutrition', name: '영양', icon: '🥗', description: '뇌 기능에 필수적인 영양소', reason: '기본 평가', checklists: ['fattyAcids', 'vitaminD', 'magnesium', 'zinc', 'methylation', 'dopamine', 'serotonin', 'gaba', 'acetylcholine'] },
          { id: 'energy', name: '에너지 대사', icon: '⚡', description: '미토콘드리아 기능과 산화 스트레스', reason: '기본 평가', checklists: ['energy', 'oxidativeStress'] },
          { id: 'stress', name: '스트레스', icon: '🧘', description: '만성 스트레스와 부신 기능', reason: '기본 평가', checklists: ['stress'] }
        ],
        summary: '분석 중 오류가 발생하여 기본 카테고리를 표시합니다.'
      })
      setCurrentStep(STEPS.CATEGORY_SELECT)
    } finally {
      setLoading(false)
    }
  }

  // 카테고리 선택/해제 토글
  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  // 선택한 카테고리로 체크리스트 진행
  const handleProceedToChecklist = () => {
    if (selectedCategories.length === 0) {
      setError('최소 1개 이상의 카테고리를 선택해주세요.')
      return
    }
    setError(null)
    setCurrentStep(STEPS.CHECKLIST)
  }

  // 체크리스트 완료 처리
  const handleChecklistComplete = (result) => {
    setChecklistResults(prev => [...prev, result])
  }

  // 체크리스트 완료 후 TDEE 설문으로 이동
  const handleGenerateProgram = (results) => {
    setChecklistResults(results)
    setCurrentStep(STEPS.TDEE)
  }

  // TDEE 설문 완료
  const handleTDEEComplete = (data) => {
    setTdeeData(data)
    setCurrentStep(STEPS.PROGRAM)
  }

  // TDEE 건너뛰기
  const handleSkipTDEE = () => {
    setTdeeData(null)
    setCurrentStep(STEPS.PROGRAM)
  }

  // 프로그램 시작
  const handleStartProgram = async (programData) => {
    setLoading(true)
    setError(null)

    try {
      if (isSupabaseConfigured() && user?.id) {
        // 6주 후 종료일 계산
        const startDate = new Date(programData.startDate || new Date())
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 42) // 6주

        // DB에 프로그램 저장 (기존 구독 시스템과 연동)
        const insertData = {
          user_id: user.id,
          program_data: {
            ...programData.program,
            tdeeData: programData.tdeeData || null // TDEE 데이터 포함
          },
          prescriptions: programData.prescriptions,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active',
          current_week: 1
        }

        // subscription_id가 있을 때만 추가 (외래 키 제약 조건 방지)
        if (programData.subscriptionId) {
          insertData.subscription_id = programData.subscriptionId
        }

        const { data, error } = await supabase
          .from('ultramind_programs')
          .insert(insertData)
          .select()
          .single()

        if (error) {
          console.error('DB 저장 에러:', error)
          // 테이블이 없는 경우 로컬 스토리지에 저장
          if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist') || error.message?.includes('could not find')) {
            console.log('테이블이 없어 로컬 스토리지에 저장')
            const localProgram = {
              ...insertData,
              id: `local_${Date.now()}`,
              created_at: new Date().toISOString()
            }
            localStorage.setItem(`ultramind_program_${user.id}`, JSON.stringify(localProgram))
            setActiveProgram(localProgram)
          } else {
            throw error
          }
        } else {
          setActiveProgram(data)
        }
      }

      setCurrentStep(STEPS.ACTIVE)
      // 대시보드로 리디렉션 (프로그램 시작 후)
      navigate('/coachee/dashboard')
    } catch (err) {
      console.error('프로그램 시작 실패:', err?.message || err)
      const errorMsg = err?.message || err?.details || '알 수 없는 오류가 발생했습니다.'
      setError(`프로그램 시작에 실패했습니다: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  // 인트로 슬라이드 상태
  const [introSlide, setIntroSlide] = useState(0)
  const slideRef = useRef(null)

  // 7 Keys 데이터
  const sevenKeys = [
    { icon: <Leaf className="w-6 h-6" />, name: '영양', color: 'emerald', desc: '뇌에 필요한 영양소 최적화' },
    { icon: <Zap className="w-6 h-6" />, name: '호르몬', color: 'amber', desc: '호르몬 균형 회복' },
    { icon: <Heart className="w-6 h-6" />, name: '염증', color: 'red', desc: '만성 염증 제거' },
    { icon: <Shield className="w-6 h-6" />, name: '장건강', color: 'blue', desc: '장-뇌 연결 최적화' },
    { icon: <Sparkles className="w-6 h-6" />, name: '독소', color: 'purple', desc: '체내 독소 해독' },
    { icon: <Battery className="w-6 h-6" />, name: '에너지', color: 'orange', desc: '미토콘드리아 활성화' },
    { icon: <Brain className="w-6 h-6" />, name: '스트레스', color: 'indigo', desc: '스트레스 반응 조절' }
  ]

  // 인트로 화면
  const renderIntro = () => {
    const slides = [
      // 슬라이드 1: 히어로
      <div key="hero" className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <div className="relative mb-8">
          <div className="w-28 h-28 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-300 rotate-3">
            <Brain className="w-14 h-14 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          당신의 뇌는<br />
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            최고의 성능
          </span>을<br />
          발휘하고 있나요?
        </h1>

        <p className="text-gray-500 text-lg mb-8 max-w-md">
          집중력 저하, 만성 피로, 브레인 포그...<br />
          이 모든 것엔 <strong>이유</strong>가 있습니다.
        </p>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>스와이프하여 더 알아보기</span>
          <ChevronRight className="w-4 h-4 animate-pulse" />
        </div>
      </div>,

      // 슬라이드 2: 문제 인식
      <div key="problem" className="min-h-[70vh] flex flex-col justify-center px-6">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-600 rounded-full text-sm font-medium mb-4">
            왜 뇌가 제대로 작동하지 않을까요?
          </span>
          <h2 className="text-2xl font-bold text-gray-900">
            현대인의 뇌는<br />
            <span className="text-red-500">7가지 위협</span>에 노출되어 있습니다
          </h2>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          {[
            { icon: <Utensils className="w-6 h-6 text-orange-500" />, text: '영양 불균형과 가공식품' },
            { icon: <Frown className="w-6 h-6 text-amber-500" />, text: '만성 스트레스와 번아웃' },
            { icon: <Scale className="w-6 h-6 text-purple-500" />, text: '호르몬 불균형' },
            { icon: <Bug className="w-6 h-6 text-green-500" />, text: '장 건강 악화' },
            { icon: <Skull className="w-6 h-6 text-gray-500" />, text: '환경 독소 노출' },
            { icon: <Battery className="w-6 h-6 text-red-500" />, text: '세포 에너지 고갈' },
            { icon: <Flame className="w-6 h-6 text-red-400" />, text: '만성 염증' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">{item.icon}</div>
              <span className="text-gray-700">{item.text}</span>
            </div>
          ))}
        </div>
      </div>,

      // 슬라이드 3: 솔루션 소개
      <div key="solution" className="min-h-[70vh] flex flex-col justify-center px-6">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 bg-violet-100 text-violet-600 rounded-full text-sm font-medium mb-4">
            The Ultra Mind Solution
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            하버드 의대 <span className="text-violet-600">마크 하이먼</span> 박사의<br />
            뇌 최적화 프로그램
          </h2>
          <p className="text-gray-500 text-sm">
            전 세계 베스트셀러, 수백만 명이 경험한 검증된 방법
          </p>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-6 border border-violet-100 max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">7 Keys Framework</h3>
              <p className="text-sm text-gray-500">뇌 건강의 7가지 핵심 요소</p>
            </div>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed">
            "뇌는 독립된 기관이 아닙니다. 몸 전체의 시스템이 뇌에 영향을 미칩니다.
            7가지 핵심 시스템을 최적화하면, 뇌는 스스로 치유됩니다."
          </p>
          <p className="text-right text-xs text-gray-400 mt-2">- Dr. Mark Hyman</p>
        </div>
      </div>,

      // 슬라이드 4: 7 Keys
      <div key="7keys" className="min-h-[70vh] flex flex-col justify-center px-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            뇌 최적화의 <span className="text-violet-600">7가지 열쇠</span>
          </h2>
          <p className="text-gray-500 text-sm">각 영역을 평가하고 맞춤 솔루션을 제공합니다</p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {sevenKeys.map((key, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl bg-${key.color}-50 border border-${key.color}-100`}
              style={{
                backgroundColor: idx === 0 ? '#ecfdf5' : idx === 1 ? '#fffbeb' : idx === 2 ? '#fef2f2' :
                               idx === 3 ? '#eff6ff' : idx === 4 ? '#faf5ff' : idx === 5 ? '#fff7ed' : '#eef2ff',
                borderColor: idx === 0 ? '#a7f3d0' : idx === 1 ? '#fde68a' : idx === 2 ? '#fecaca' :
                            idx === 3 ? '#bfdbfe' : idx === 4 ? '#e9d5ff' : idx === 5 ? '#fed7aa' : '#c7d2fe'
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                style={{
                  backgroundColor: idx === 0 ? '#10b981' : idx === 1 ? '#f59e0b' : idx === 2 ? '#ef4444' :
                                  idx === 3 ? '#3b82f6' : idx === 4 ? '#a855f7' : idx === 5 ? '#f97316' : '#6366f1',
                  color: 'white'
                }}
              >
                {key.icon}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{key.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{key.desc}</p>
            </div>
          ))}
        </div>
      </div>,

      // 슬라이드 5: 프로그램 특징
      <div key="features" className="min-h-[70vh] flex flex-col justify-center px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            <span className="text-violet-600">6주</span> 맞춤형 프로그램
          </h2>
          <p className="text-gray-500 text-sm">당신만을 위한 과학적 솔루션</p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI 기반 맞춤 분석</h3>
              <p className="text-sm text-gray-500 mt-1">
                코칭 대화를 분석하여 당신에게 필요한 영역을 파악합니다
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">검증된 체크리스트</h3>
              <p className="text-sm text-gray-500 mt-1">
                의학적으로 검증된 자가 진단 도구로 현재 상태를 평가합니다
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">6주 실천 로드맵</h3>
              <p className="text-sm text-gray-500 mt-1">
                매일 실천할 수 있는 구체적인 행동 지침을 제공합니다
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">진행 상황 추적</h3>
              <p className="text-sm text-gray-500 mt-1">
                주간 체크인으로 변화를 확인하고 프로그램을 조정합니다
              </p>
            </div>
          </div>
        </div>
      </div>,

      // 슬라이드 6: CTA
      <div key="cta" className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-violet-200">
          <Sparkles className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          지금 시작하세요
        </h2>
        <p className="text-gray-500 mb-8 max-w-sm">
          무료로 7가지 영역을 평가하고<br />
          맞춤형 6주 프로그램을 받아보세요
        </p>

        <button
          onClick={handleStartAnalysis}
          disabled={loading}
          className="w-full max-w-sm flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl hover:from-violet-700 hover:to-indigo-700 transition-all font-semibold text-lg shadow-xl shadow-violet-200 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              무료로 시작하기
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          약 5분 소요 • 언제든 중단 가능
        </p>
      </div>
    ]

    return (
      <div className="relative">
        {/* 슬라이드 컨테이너 */}
        <div
          ref={slideRef}
          className="overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
          onScroll={(e) => {
            const slideWidth = e.target.offsetWidth
            const newSlide = Math.round(e.target.scrollLeft / slideWidth)
            setIntroSlide(newSlide)
          }}
        >
          <div className="flex">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className="w-full flex-shrink-0 snap-center"
                style={{ minWidth: '100%' }}
              >
                {slide}
              </div>
            ))}
          </div>
        </div>

        {/* 페이지 인디케이터 */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                slideRef.current?.scrollTo({
                  left: idx * slideRef.current.offsetWidth,
                  behavior: 'smooth'
                })
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                introSlide === idx
                  ? 'w-6 bg-violet-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* 좌우 네비게이션 (데스크톱) */}
        {introSlide > 0 && (
          <button
            onClick={() => {
              slideRef.current?.scrollTo({
                left: (introSlide - 1) * slideRef.current.offsetWidth,
                behavior: 'smooth'
              })
            }}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {introSlide < slides.length - 1 && (
          <button
            onClick={() => {
              slideRef.current?.scrollTo({
                left: (introSlide + 1) * slideRef.current.offsetWidth,
                behavior: 'smooth'
              })
            }}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    )
  }

  // 카테고리 선택 화면
  const renderCategorySelect = () => {
    const categories = analysisResult?.recommendedCategories || []

    return (
      <div className="max-w-3xl mx-auto py-6">
        {/* AI 분석 요약 */}
        {analysisResult?.summary && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              AI 대화 분석 결과
            </h3>
            <p className="text-sm text-blue-700">{analysisResult.summary}</p>
          </div>
        )}

        {/* 카테고리 선택 안내 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            평가할 카테고리를 선택하세요
          </h2>
          <p className="text-sm text-gray-600">
            대화 분석 결과를 바탕으로 추천된 카테고리입니다. 원하는 카테고리를 선택해주세요.
          </p>
        </div>

        {/* 카테고리 카드 목록 */}
        <div className="space-y-3 mb-6">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategories.includes(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryToggle(cat.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                      {idx < 3 && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">
                          추천
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
                    {cat.reason && (
                      <p className="text-xs text-blue-600 mt-1">
                        관련 키워드: {cat.reason}
                      </p>
                    )}
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* 선택 현황 및 진행 버튼 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedCategories.length}개 카테고리 선택됨
            </span>
            <button
              onClick={handleProceedToChecklist}
              disabled={selectedCategories.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              체크리스트 시작하기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 체크리스트 화면
  const renderChecklist = () => {
    // 선택된 카테고리의 체크리스트 ID 수집
    const checklistIds = selectedCategories.flatMap(catId => {
      const cat = analysisResult?.recommendedCategories?.find(c => c.id === catId)
      return cat?.checklists || []
    })

    return (
      <div className="max-w-3xl mx-auto py-6">
        {/* 선택된 카테고리 표시 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCategories.map(catId => {
            const cat = analysisResult?.recommendedCategories?.find(c => c.id === catId)
            return (
              <span key={catId} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {cat?.icon} {cat?.name}
              </span>
            )
          })}
        </div>

        <ChecklistAssessment
          recommendedChecklistIds={checklistIds}
          onComplete={handleChecklistComplete}
          onGenerateProgram={handleGenerateProgram}
        />
      </div>
    )
  }

  // TDEE 설문 화면
  const renderTDEE = () => (
    <div className="max-w-md mx-auto py-6 space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">맞춤 식단을 위한 정보</h2>
        <p className="text-sm text-gray-500 mt-1">
          정확한 식사량 추천을 위해 간단한 정보를 입력해주세요
        </p>
      </div>

      <TDEESurvey onComplete={handleTDEEComplete} />

      <button
        onClick={handleSkipTDEE}
        className="w-full py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <SkipForward className="w-4 h-4" />
        건너뛰기 (기본 식단 사용)
      </button>
    </div>
  )

  // 6주 프로그램 화면
  const renderProgram = () => (
    <div className="max-w-4xl mx-auto py-6">
      <SixWeekProgram
        checklistResults={checklistResults}
        subscription={subscription}
        tdeeData={tdeeData}
        onStartProgram={handleStartProgram}
      />
    </div>
  )

  // 활성 프로그램 내부 탭 상태
  const [activeTab, setActiveTab] = useState('routine') // 'routine' | 'results' | 'program'

  // 활성 프로그램 화면
  const renderActiveProgram = () => {
    if (!activeProgram) return null

    const programData = activeProgram.program_data || {}
    const prescriptions = activeProgram.prescriptions || []
    const currentWeek = activeProgram.current_week || 1

    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">내 6주 프로그램</h2>
              <p className="text-sm opacity-90">
                {currentWeek}주차 진행 중
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75">시작일</p>
              <p className="font-medium">
                {new Date(activeProgram.start_date).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>진행률</span>
              <span>{Math.round((currentWeek / 6) * 100)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${(currentWeek / 6) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('routine')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'routine'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            오늘의 루틴
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'results'
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            검사 결과
          </button>
          <button
            onClick={() => setActiveTab('program')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === 'program'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            6주 프로그램
          </button>
        </div>

        {/* 검사 결과 탭 */}
        {activeTab === 'results' && prescriptions.length > 0 && (
          <ResultsVisualization prescriptions={prescriptions} />
        )}

        {/* 6주 프로그램 탭 */}
        {activeTab === 'program' && programData.phases && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              6주 프로그램 로드맵
            </h3>
            <div className="space-y-3">
              {programData.phases.map((phase, idx) => {
                const isCurrentWeek = idx + 1 === currentWeek
                const isPast = idx + 1 < currentWeek

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrentWeek
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                        : isPast
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isCurrentWeek ? 'bg-blue-600 text-white' :
                        isPast ? 'bg-gray-400 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${isCurrentWeek ? 'text-blue-900' : 'text-gray-900'}`}>
                          {phase.title}
                        </h4>
                        <p className={`text-sm ${isCurrentWeek ? 'text-blue-700' : 'text-gray-500'}`}>
                          {phase.focus}
                        </p>
                      </div>
                      {isCurrentWeek && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                          현재
                        </span>
                      )}
                      {isPast && (
                        <Check className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 오늘의 루틴 탭 */}
        {activeTab === 'routine' && (
          <>

        {/* 오늘의 할 일 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">오늘의 실천</h3>
          <div className="space-y-3">
            {(programData.dailyRoutine?.morning || []).map((item, idx) => (
              <label key={`morning-${idx}`} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
                <span className="text-gray-700">{item}</span>
                <span className="text-xs text-gray-400 ml-auto">아침</span>
              </label>
            ))}
            {(programData.dailyRoutine?.afternoon || []).map((item, idx) => (
              <label key={`afternoon-${idx}`} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
                <span className="text-gray-700">{item}</span>
                <span className="text-xs text-gray-400 ml-auto">오후</span>
              </label>
            ))}
            {(programData.dailyRoutine?.evening || []).map((item, idx) => (
              <label key={`evening-${idx}`} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
                <span className="text-gray-700">{item}</span>
                <span className="text-xs text-gray-400 ml-auto">저녁</span>
              </label>
            ))}
          </div>
        </div>

        {/* 코치 연결 - 기존 구독 시스템 연동 */}
        {subscription?.status === 'active' ? (
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">코치와 상담하기</h3>
                <p className="text-sm text-blue-700">
                  이번 달 남은 세션: {subscription.sessions_per_month - (subscription.sessions_used_this_month || 0)}회
                </p>
              </div>
              <button
                onClick={() => navigate('/coachee/chat')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                채팅하기
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">코치 상담을 원하시나요?</h3>
                <p className="text-sm text-gray-600">
                  구독하시면 전문 코치의 상담을 받을 수 있습니다
                </p>
              </div>
              <button
                onClick={() => navigate('/coachee/subscription')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                구독 플랜 보기
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-semibold text-gray-900">Ultra Mind 프로그램</h1>
          <div className="w-6" />
        </div>
      </header>

      {/* 에러 메시지 */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <main className="px-4">
        {currentStep === STEPS.INTRO && renderIntro()}
        {currentStep === STEPS.CATEGORY_SELECT && renderCategorySelect()}
        {currentStep === STEPS.CHECKLIST && renderChecklist()}
        {currentStep === STEPS.TDEE && renderTDEE()}
        {currentStep === STEPS.PROGRAM && renderProgram()}
        {currentStep === STEPS.ACTIVE && renderActiveProgram()}
      </main>
    </div>
  )
}
