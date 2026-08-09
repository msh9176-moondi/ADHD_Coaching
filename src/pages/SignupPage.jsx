import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Button } from '../components/common/Button'
import { Eye, EyeOff, Check, AlertCircle, User, Users } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export function SignupPage() {
  const navigate = useNavigate()
  const { setUser, setOnboardingStatus } = useStore()

  const [formData, setFormData] = useState({
    role: '', // 'coach' or 'coachee'
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    coachCode: '', // 코치 초대 코드
    adhdStatus: '',
    difficulties: [],
    agreePrivacy: false,
    agreeNonMedical: false
  })

  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const difficultyOptions = [
    '실행 시작하기',
    '루틴 유지하기',
    '시간관리',
    '감정 조절',
    '미루기',
    '집중 유지',
    '우선순위 정하기',
    '커리어 방향'
  ]

  const adhdStatusOptions = [
    { value: 'diagnosed', label: 'ADHD 진단을 받았어요' },
    { value: 'suspected', label: '진단은 없지만 의심돼요' },
    { value: 'curious', label: '잘 모르겠어요' }
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const toggleDifficulty = (difficulty) => {
    setFormData(prev => ({
      ...prev,
      difficulties: prev.difficulties.includes(difficulty)
        ? prev.difficulties.filter(d => d !== difficulty)
        : [...prev.difficulties, difficulty]
    }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.role) {
      newErrors.role = '가입 유형을 선택해주세요'
    }

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요'
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요'
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요'
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다'
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다'
    }

    // 코치는 초대 코드 필수
    if (formData.role === 'coach') {
      const validCode = import.meta.env.VITE_COACH_INVITE_CODE || 'FLOCA2026'
      if (!formData.coachCode.trim()) {
        newErrors.coachCode = '초대 코드를 입력해주세요'
      } else if (formData.coachCode.trim() !== validCode) {
        newErrors.coachCode = '유효하지 않은 초대 코드입니다'
      }
    }

    // 피코치만 ADHD 상태 필수
    if (formData.role === 'coachee' && !formData.adhdStatus) {
      newErrors.adhdStatus = 'ADHD 상태를 선택해주세요'
    }

    if (!formData.agreePrivacy) {
      newErrors.agreePrivacy = '개인정보 수집에 동의해주세요'
    }

    if (!formData.agreeNonMedical) {
      newErrors.agreeNonMedical = '비의료 서비스 안내에 동의해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      if (isSupabaseConfigured()) {
        // Supabase 회원가입
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        })

        if (authError) throw authError

        // users 테이블에 프로필 저장
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            role: formData.role,
            phone: formData.phone,
          })

        if (profileError) throw profileError

        const user = {
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        }

        setUser(user)

        // 코치는 바로 대시보드로, 피코치는 온보딩으로
        if (formData.role === 'coach') {
          setOnboardingStatus({ step: 'complete', completed: true })
          navigate('/coach')
        } else {
          setOnboardingStatus({ step: 'survey', completed: false })
          navigate('/onboarding')
        }
      } else {
        // 로컬 모드 (Supabase 미설정 시)
        const user = {
          id: `${formData.role}_${Date.now()}`,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          adhdStatus: formData.adhdStatus,
          difficulties: formData.difficulties,
          createdAt: new Date().toISOString()
        }

        setUser(user)

        if (formData.role === 'coach') {
          setOnboardingStatus({ step: 'complete', completed: true })
          navigate('/coach')
        } else {
          setOnboardingStatus({ step: 'survey', completed: false })
          navigate('/onboarding')
        }
      }
    } catch (error) {
      console.error('회원가입 에러:', error)
      setErrors({ submit: error.message || '회원가입에 실패했습니다.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 md:py-12 px-4">
      <div className="max-w-md w-full">
        {/* 로고 */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-600">FLOCA</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">ADHD 실행회복 코칭</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-5 md:mb-6">회원가입</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 역할 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                가입 유형 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'coachee' }))}
                  className={`flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-xl border-2 transition-all ${
                    formData.role === 'coachee'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className={`w-5 h-5 md:w-6 md:h-6 ${formData.role === 'coachee' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className={`text-sm md:text-base font-medium ${formData.role === 'coachee' ? 'text-emerald-700' : 'text-gray-600'}`}>
                    피코치
                  </span>
                  <span className="text-[10px] md:text-xs text-gray-500">코칭을 받고 싶어요</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'coach' }))}
                  className={`flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-xl border-2 transition-all ${
                    formData.role === 'coach'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className={`w-5 h-5 md:w-6 md:h-6 ${formData.role === 'coach' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className={`text-sm md:text-base font-medium ${formData.role === 'coach' ? 'text-emerald-700' : 'text-gray-600'}`}>
                    코치
                  </span>
                  <span className="text-[10px] md:text-xs text-gray-500">코칭을 제공해요</span>
                </button>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.role}
                </p>
              )}
            </div>

            {/* 코치 초대 코드 */}
            {formData.role === 'coach' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  초대 코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="coachCode"
                  value={formData.coachCode}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.coachCode ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                  placeholder="관리자에게 받은 초대 코드를 입력하세요"
                />
                {errors.coachCode && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.coachCode}
                  </p>
                )}
              </div>
            )}

            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                placeholder="홍길동"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* 연락처 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                placeholder="010-1234-5678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-12`}
                  placeholder="6자 이상"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.passwordConfirm ? 'border-red-300 bg-red-50' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                placeholder="비밀번호 재입력"
              />
              {errors.passwordConfirm && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.passwordConfirm}
                </p>
              )}
            </div>

            {/* ADHD 상태 (피코치만) */}
            {formData.role === 'coachee' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ADHD 관련 상태 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {adhdStatusOptions.map(option => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.adhdStatus === option.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="adhdStatus"
                        value={option.value}
                        checked={formData.adhdStatus === option.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.adhdStatus === option.value ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                      }`}>
                        {formData.adhdStatus === option.value && (
                          <span className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </span>
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.adhdStatus && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.adhdStatus}
                  </p>
                )}
              </div>
            )}

            {/* 어려움 영역 (피코치만, 선택) */}
            {formData.role === 'coachee' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  어떤 부분이 가장 어려우신가요? (선택)
                </label>
                <div className="flex flex-wrap gap-2">
                  {difficultyOptions.map(difficulty => (
                    <button
                      key={difficulty}
                      type="button"
                      onClick={() => toggleDifficulty(difficulty)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        formData.difficulties.includes(difficulty)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 동의 항목 */}
            <div className="space-y-3 pt-2">
              <label className={`flex items-start gap-3 cursor-pointer ${errors.agreePrivacy ? 'text-red-500' : ''}`}>
                <input
                  type="checkbox"
                  name="agreePrivacy"
                  checked={formData.agreePrivacy}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-600">
                  <span className="text-emerald-600 underline cursor-pointer">개인정보 수집 및 이용</span>에 동의합니다. (필수)
                </span>
              </label>

              <label className={`flex items-start gap-3 cursor-pointer ${errors.agreeNonMedical ? 'text-red-500' : ''}`}>
                <input
                  type="checkbox"
                  name="agreeNonMedical"
                  checked={formData.agreeNonMedical}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-600">
                  본 서비스는 의료 행위가 아닌 코칭 서비스임을 이해합니다. (필수)
                </span>
              </label>
            </div>

            {/* 에러 메시지 */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* 가입 버튼 */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  처리 중...
                </>
              ) : (
                '가입하고 시작하기'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-emerald-600 font-medium hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
