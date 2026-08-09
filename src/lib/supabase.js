import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 환경 변수 확인
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseKey)
}

// Supabase 클라이언트 생성
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

// 디버그용 로그 (개발환경에서만)
if (import.meta.env.DEV) {
  console.log('Supabase configured:', isSupabaseConfigured())
  // 브라우저 콘솔에서 테스트할 수 있도록 전역 변수로 노출
  if (typeof window !== 'undefined') {
    window.__SUPABASE__ = supabase
  }
}
