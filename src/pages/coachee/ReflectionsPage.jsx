import { useState, useEffect } from 'react'
import { ReflectionNote } from '../../components/coachee/ReflectionNote'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { PageHeader } from '../../components/common/PageHeader'
import { useStore } from '../../store/useStore'
import { reflectionService, coacheeService } from '../../lib'
import { isSupabaseConfigured } from '../../lib/supabase'
import {
  BookOpen, ChevronRight, ChevronLeft, Lightbulb, Star, Rocket,
  Calendar, TrendingUp, Edit3, Loader2
} from 'lucide-react'

// 날짜 포맷 함수
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

export function ReflectionsPage() {
  const { user } = useStore()
  const [showNewReflection, setShowNewReflection] = useState(false)
  const [selectedReflection, setSelectedReflection] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [reflections, setReflections] = useState([])
  const [coachingTopics, setCoachingTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSession, setCurrentSession] = useState(1)

  // Supabase에서 성찰일지 및 현재 회기 로드
  useEffect(() => {
    async function loadData() {
      if (!user?.id || !isSupabaseConfigured()) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        // 성찰일지 로드
        const data = await reflectionService.getCoacheeReflections(user.id)
        setReflections(data || [])
        // 현재 회기 로드
        const packageInfo = await coacheeService.getCoacheePackage(user.id)
        if (packageInfo?.current_session) {
          setCurrentSession(packageInfo.current_session)
        }
        // 코칭 주제 로드 (목표합의서에서 가져온 주제들)
        try {
          const topics = await coacheeService.getCoachingTopics(user.id)
          setCoachingTopics(topics || [])
        } catch {
          setCoachingTopics([])
        }
      } catch (err) {
        console.warn('데이터 로드 실패:', err)
        setReflections([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user?.id])

  const handleSubmit = async (data) => {
    if (!user?.id || !isSupabaseConfigured()) {
      console.log('Reflection submitted (local):', data)
      setShowNewReflection(false)
      return
    }

    try {
      await reflectionService.createReflection(user.id, data.sessionNumber || 1, data)
      // 목록 새로고침
      const updatedList = await reflectionService.getCoacheeReflections(user.id)
      setReflections(updatedList || [])
      setShowNewReflection(false)
    } catch (err) {
      console.error('성찰일지 저장 실패:', err)
      alert('성찰일지 저장에 실패했습니다.')
    }
  }

  const handleEditSubmit = async (data) => {
    if (!selectedReflection?.id || !isSupabaseConfigured()) {
      // 로컬 모드 - 기존 로직
      const updatedReflection = { ...selectedReflection, ...data }
      setReflections(prev =>
        prev.map(r => r.id === selectedReflection.id ? updatedReflection : r)
      )
      setSelectedReflection(updatedReflection)
      setIsEditing(false)
      return
    }

    try {
      await reflectionService.updateReflection(selectedReflection.id, {
        ...data,
        sessionNumber: selectedReflection.sessionNumber
      }, user.id)
      // 목록 새로고침
      const updatedList = await reflectionService.getCoacheeReflections(user.id)
      setReflections(updatedList || [])
      // 수정된 항목 다시 선택
      const updated = updatedList.find(r => r.id === selectedReflection.id)
      setSelectedReflection(updated || null)
      setIsEditing(false)
    } catch (err) {
      console.error('성찰일지 수정 실패:', err)
      alert('성찰일지 수정에 실패했습니다.')
    }
  }

  const handleCardClick = (reflection) => {
    setSelectedReflection(reflection)
    setIsEditing(false)
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  // 작성할 성찰일지 회기 번호 계산
  // 이미 작성된 성찰일지의 회기 번호들을 확인하고, 다음 작성할 회기 결정
  const getNextReflectionSession = () => {
    if (reflections.length === 0) {
      // 성찰일지가 없으면 1회기부터 (단, current_session이 1이면 아직 세션 진행 전)
      return currentSession > 1 ? 1 : 1
    }
    // 이미 작성된 회기 번호들
    const writtenSessions = reflections.map(r => r.sessionNumber).filter(Boolean)
    // 1부터 currentSession-1까지 중 아직 안 쓴 회기 찾기
    const completedSessions = currentSession - 1
    for (let i = 1; i <= completedSessions; i++) {
      if (!writtenSessions.includes(i)) {
        return i
      }
    }
    // 모든 완료된 세션에 성찰일지가 있으면, 가장 최근 완료된 세션
    return completedSessions > 0 ? completedSessions : 1
  }

  // 새 성찰일지 작성
  if (showNewReflection) {
    const nextSession = getNextReflectionSession()
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setShowNewReflection(false)}
          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          목록으로
        </button>
        <ReflectionNote session={{ sessionNumber: nextSession }} onSubmit={handleSubmit} coachingTopics={coachingTopics} />
      </div>
    )
  }

  // 성찰일지 편집 모드
  if (selectedReflection && isEditing) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={handleCancelEdit}
          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          상세보기로 돌아가기
        </button>
        <ReflectionNote
          session={{ sessionNumber: selectedReflection.sessionNumber }}
          initialData={selectedReflection}
          onSubmit={handleEditSubmit}
          onCancel={handleCancelEdit}
          isEditing={true}
          coachingTopics={coachingTopics}
        />
      </div>
    )
  }

  // 성찰일지 상세 보기
  if (selectedReflection) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setSelectedReflection(null)}
          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          목록으로
        </button>

        <Card>
          <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-emerald-600">{selectedReflection.sessionNumber}</span>
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    {selectedReflection.sessionNumber}회기 성찰일지
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedReflection.createdAt)}
                  </div>
                </div>
              </div>
              <Badge variant="success">완료</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 py-6">
            {/* 코칭 주제 */}
            <div className="bg-emerald-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-1">코칭 주제</h3>
              <p className="text-lg font-semibold text-blue-900">{selectedReflection.topic}</p>
            </div>

            {/* 점수 변화 */}
            <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-medium text-gray-700">점수 변화</h3>
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">이전</p>
                  <span className="text-2xl font-bold text-gray-400">{selectedReflection.previousScore}</span>
                  <span className="text-gray-400">점</span>
                </div>
                <div className="text-2xl text-gray-300">→</div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">현재</p>
                  <span className="text-2xl font-bold text-green-600">{selectedReflection.currentScore}</span>
                  <span className="text-green-600">점</span>
                </div>
                <div className="ml-2 px-3 py-1 bg-green-100 rounded-full">
                  <span className="text-sm font-medium text-green-700">
                    +{selectedReflection.currentScore - selectedReflection.previousScore}점
                  </span>
                </div>
              </div>
            </div>

            {/* 배운 점 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-medium text-gray-700">배운 점</h3>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedReflection.learned}
                </p>
              </div>
            </div>

            {/* 느낀 점 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-medium text-gray-700">느낀 점</h3>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedReflection.felt}
                </p>
              </div>
            </div>

            {/* 액션플랜 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-medium text-gray-700">액션플랜</h3>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedReflection.actionPlan}
                </p>
              </div>
            </div>

            {/* 다음 회기 기대 */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">다음 회기 기대사항</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedReflection.nextExpectation}
                </p>
              </div>
            </div>

            {/* 수정 버튼 */}
            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" size="lg" onClick={handleEditClick}>
                <Edit3 className="w-4 h-4 mr-2" />
                성찰일지 수정하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 목록 보기
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">성찰 일지</h1>
          <p className="text-gray-600">
            각 회기 후 배운 점과 느낀 점을 기록하세요.
          </p>
        </div>
        <button
          onClick={() => setShowNewReflection(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          새 성찰일지 작성
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="ml-2 text-gray-500">불러오는 중...</span>
        </div>
      ) : reflections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">작성된 성찰일지가 없습니다</h3>
            <p className="text-gray-500 mb-4">코칭 세션 후 성찰일지를 작성해보세요.</p>
            <Button onClick={() => setShowNewReflection(true)}>
              새 성찰일지 작성
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reflections.map((reflection) => (
            <Card
              key={reflection.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCardClick(reflection)}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-emerald-600">{reflection.sessionNumber}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{reflection.topic}</h3>
                      <Badge variant="success">완료</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(reflection.createdAt)} · 점수: {reflection.previousScore}점 → {reflection.currentScore}점
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
