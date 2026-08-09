import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Button } from '../components/common/Button'
import { Card, CardContent } from '../components/common/Card'
import { coacheeService } from '../lib'
import {
  User, Heart, AlertCircle, MessageCircle, Clock,
  ArrowRight, Check, Loader2
} from 'lucide-react'

const COMMUNICATION_STYLES = [
  { id: 'fast_response', label: '답변이 빠를수록 좋아요', emoji: '💬' },
  { id: 'think_time', label: '생각할 시간을 주세요', emoji: '🤔' },
  { id: 'specific', label: '구체적으로 알려주세요', emoji: '📋' },
  { id: 'self_decide', label: '스스로 결정하게 해주세요', emoji: '🕊️' },
  { id: 'praise', label: '칭찬에 힘이 나요', emoji: '🌟' },
  { id: 'honest_feedback', label: '솔직한 피드백이 좋아요', emoji: '💪' },
]

const TIME_SLOTS = [
  { id: 'weekday_morning', label: '평일 오전', sub: '9:00-12:00' },
  { id: 'weekday_afternoon', label: '평일 오후', sub: '12:00-18:00' },
  { id: 'weekday_evening', label: '평일 저녁', sub: '18:00-22:00' },
  { id: 'weekend_morning', label: '주말 오전', sub: '9:00-12:00' },
  { id: 'weekend_afternoon', label: '주말 오후', sub: '12:00-18:00' },
  { id: 'weekend_evening', label: '주말 저녁', sub: '18:00-22:00' },
]

export function SelfIntroPage() {
  const navigate = useNavigate()
  const { user, coachingPackage, setSelfIntro, setOnboardingStatus } = useStore()

  const [intro, setIntro] = useState('')
  const [expectation, setExpectation] = useState('')
  const [concern, setConcern] = useState('')
  const [communicationStyles, setCommunicationStyles] = useState([])
  const [preferredTimes, setPreferredTimes] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleStyle = (styleId) => {
    setCommunicationStyles(prev =>
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    )
  }

  const toggleTime = (timeId) => {
    setPreferredTimes(prev =>
      prev.includes(timeId)
        ? prev.filter(id => id !== timeId)
        : [...prev, timeId]
    )
  }

  const canSubmit = intro.trim() && expectation.trim() && communicationStyles.length > 0 && preferredTimes.length > 0 && !isSubmitting

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // Supabase에 프로필 저장
      await coacheeService.createCoacheeProfile(user?.id, {
        packageType: coachingPackage?.type || 'basic',
        intro,
        expectation,
        concern,
        communicationStyles,
        preferredTimes
      })

      // 로컬 상태 업데이트
      setSelfIntro({
        intro,
        expectation,
        concern,
        communicationStyles,
        preferredTimes,
        submittedAt: new Date().toISOString()
      })

      setOnboardingStatus({
        step: 'complete',
        completed: true
      })

      navigate('/match-complete')
    } catch (err) {
      console.error('프로필 저장 실패:', err)
      // 로컬 모드이거나 에러 발생해도 진행
      setSelfIntro({
        intro,
        expectation,
        concern,
        communicationStyles,
        preferredTimes,
        submittedAt: new Date().toISOString()
      })

      setOnboardingStatus({
        step: 'complete',
        completed: true
      })

      navigate('/match-complete')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            나를 소개합니다
          </h1>
          <p className="text-gray-600">
            코치님이 첫 세션 전에 읽어볼 거예요.<br />
            솔직하게 편하게 적어주세요.
          </p>
        </div>

        <div className="space-y-6">
          {/* 자기소개 */}
          <Card>
            <CardContent className="p-5">
              <label className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                <User className="w-4 h-4 text-emerald-600" />
                코치님께 전달하고 싶은 자기소개
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="예: 저는 디자이너인데 아이디어는 많은데 실행이 항상 막혀요. 완벽해야 시작하는 스타일이라 작은 것부터 시작하는 게 정말 힘들어요."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
              />
            </CardContent>
          </Card>

          {/* 기대하는 것 */}
          <Card>
            <CardContent className="p-5">
              <label className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                <Heart className="w-4 h-4 text-pink-500" />
                이번 코칭에서 가장 기대하는 것
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={expectation}
                onChange={(e) => setExpectation(e.target.value)}
                placeholder="예: 아침 루틴을 딱 하나라도 꾸준히 유지하고 싶어요. 매일 실패해서 자책하는 걸 줄이고 싶어요."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
              />
            </CardContent>
          </Card>

          {/* 걱정되는 것 */}
          <Card>
            <CardContent className="p-5">
              <label className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                코칭에서 걱정되거나 어려울 것 같은 것
                <span className="text-gray-400 text-sm font-normal">(선택)</span>
              </label>
              <textarea
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                placeholder="예: 과제를 못 했을 때 코치님께 실망을 드릴 것 같아서 걱정돼요. 또 가끔 약속을 잊어버릴 수도 있어요."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
              />
            </CardContent>
          </Card>

          {/* 소통 방식 */}
          <Card>
            <CardContent className="p-5">
              <label className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                <MessageCircle className="w-4 h-4 text-green-500" />
                나에게 맞는 소통 방식
                <span className="text-red-500">*</span>
                <span className="text-gray-400 text-sm font-normal">(복수 선택)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COMMUNICATION_STYLES.map((style) => {
                  const isSelected = communicationStyles.includes(style.id)
                  return (
                    <button
                      key={style.id}
                      onClick={() => toggleStyle(style.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{style.emoji}</span>
                      <span className={`text-sm ${isSelected ? 'text-emerald-700 font-medium' : 'text-gray-700'}`}>
                        {style.label}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 ml-auto" />
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 희망 시간대 */}
          <Card>
            <CardContent className="p-5">
              <label className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                <Clock className="w-4 h-4 text-purple-500" />
                첫 미팅 희망 시간대
                <span className="text-red-500">*</span>
                <span className="text-gray-400 text-sm font-normal">(복수 선택)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = preferredTimes.includes(slot.id)
                  return (
                    <button
                      key={slot.id}
                      onClick={() => toggleTime(slot.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                        {slot.label}
                      </p>
                      <p className={`text-xs ${isSelected ? 'text-purple-500' : 'text-gray-400'}`}>
                        {slot.sub}
                      </p>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 제출 버튼 */}
        <div className="mt-8">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장하는 중...
              </>
            ) : canSubmit ? (
              <>
                저장하고 완료하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              '필수 항목을 입력해주세요'
            )}
          </Button>
        </div>

        {/* 안내 */}
        <p className="text-center text-sm text-gray-500 mt-4">
          작성한 내용은 코치님만 확인할 수 있어요.
        </p>
      </div>
    </div>
  )
}
