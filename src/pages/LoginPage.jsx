import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { useStore } from '../store/useStore'
import { Target, AlertCircle } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getSurveyResult, getASRSResult } from '../lib/surveyService'

export function LoginPage() {
  const navigate = useNavigate()
  const { setUser, setOnboardingStatus } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isSupabaseConfigured()) {
        // Supabase 로그인
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) throw authError

        // 사용자 프로필 조회 (역할 포함)
        let { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle()

        if (profileError) throw profileError

        // 프로필이 없으면 생성
        if (!profile) {
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              name: authData.user.email.split('@')[0],
              role: 'coachee', // 기본값
            })
            .select()
            .single()

          // RLS 정책 에러는 무시하고 기본 프로필 사용
          if (createError && createError.code !== '42501') {
            throw createError
          }

          profile = newProfile || {
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.email.split('@')[0],
            role: 'coachee',
          }
        }

        const user = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          phone: profile.phone,
          adhdStatus: profile.adhd_status,
        }

        setUser(user)

        // 피코치는 온보딩 상태 확인 필요
        if (profile.role === 'coachee') {
          // 설문 및 ASRS 완료 여부 확인 (한 번만 하면 됨)
          const [surveyResult, asrsResult] = await Promise.all([
            getSurveyResult(profile.id, 'pre').catch(() => null),
            getASRSResult(profile.id).catch(() => null)
          ])

          // 사전설문과 ASRS 모두 완료했으면 온보딩 건너뛰기
          if (surveyResult && asrsResult) {
            setOnboardingStatus({ step: 'complete', completed: true })
            navigate('/coachee')
          } else {
            setOnboardingStatus({ step: 'survey', completed: false })
            navigate('/onboarding')
          }
        } else {
          setOnboardingStatus({ step: 'complete', completed: true })
          navigate('/coach')
        }
      } else {
        // 로컬 모드 - 데모용
        throw new Error('Supabase가 설정되지 않았습니다. 데모 로그인을 이용하세요.')
      }
    } catch (err) {
      console.error('로그인 에러:', err)
      setError(err.message || '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-blue-600 rounded-2xl mb-3 md:mb-4">
            <Target className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">FLOCA</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">ADHD 실행회복 코칭 플랫폼</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />

            <Input
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </Button>
          </form>

          {/* 회원가입 링크 */}
          <p className="text-center text-sm text-gray-500 mt-6">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
