-- =====================================================
-- RLS 정책 수정: 코치가 매칭 대기 중인 피코치 업데이트 허용
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "coachee_profiles_update" ON coachee_profiles;

-- 새 정책 생성
-- 1. 본인 (피코치)
-- 2. 담당 코치
-- 3. 매칭 대기 중(coach_id IS NULL)인 경우 모든 코치 (매칭 수락용)
CREATE POLICY "coachee_profiles_update" ON coachee_profiles
  FOR UPDATE USING (
    auth.uid() = user_id OR
    auth.uid() = coach_id OR
    (coach_id IS NULL AND EXISTS (SELECT 1 FROM coach_profiles WHERE user_id = auth.uid()))
  );

-- 확인
SELECT * FROM pg_policies WHERE tablename = 'coachee_profiles' AND policyname = 'coachee_profiles_update';
