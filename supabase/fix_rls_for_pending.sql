-- =====================================================
-- RLS 정책 수정: 신규 코칭 신청자(pending) 데이터 조회 허용
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "asrs_results_select" ON asrs_results;
DROP POLICY IF EXISTS "survey_results_select" ON survey_results;
DROP POLICY IF EXISTS "self_introductions_select" ON self_introductions;
DROP POLICY IF EXISTS "coaching_goals_select" ON coaching_goals;
DROP POLICY IF EXISTS "coaching_topics_select" ON coaching_topics;
DROP POLICY IF EXISTS "coaching_status_select" ON coaching_status;

-- =====================================================
-- asrs_results 정책 수정
-- 코치는 자신의 피코치 또는 매칭 대기 중인(coach_id IS NULL) 신청자 데이터 조회 가능
-- =====================================================
CREATE POLICY "asrs_results_select" ON asrs_results
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = asrs_results.user_id
        AND (
          cp.coach_id = auth.uid() OR
          (cp.coach_id IS NULL AND EXISTS (SELECT 1 FROM coach_profiles WHERE user_id = auth.uid()))
        )
    )
  );

-- =====================================================
-- survey_results 정책 수정
-- =====================================================
CREATE POLICY "survey_results_select" ON survey_results
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = survey_results.user_id
        AND (
          cp.coach_id = auth.uid() OR
          (cp.coach_id IS NULL AND EXISTS (SELECT 1 FROM coach_profiles WHERE user_id = auth.uid()))
        )
    )
  );

-- =====================================================
-- self_introductions 정책 수정
-- =====================================================
CREATE POLICY "self_introductions_select" ON self_introductions
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = self_introductions.user_id
        AND (
          cp.coach_id = auth.uid() OR
          (cp.coach_id IS NULL AND EXISTS (SELECT 1 FROM coach_profiles WHERE user_id = auth.uid()))
        )
    )
  );

-- =====================================================
-- coaching_goals 정책 수정
-- =====================================================
CREATE POLICY "coaching_goals_select" ON coaching_goals
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = coaching_goals.user_id
        AND (
          cp.coach_id = auth.uid() OR
          (cp.coach_id IS NULL AND EXISTS (SELECT 1 FROM coach_profiles WHERE user_id = auth.uid()))
        )
    )
  );

-- =====================================================
-- coaching_topics 정책 수정
-- =====================================================
CREATE POLICY "coaching_topics_select" ON coaching_topics
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = coaching_topics.user_id
        AND (
          cp.coach_id = auth.uid() OR
          (cp.coach_id IS NULL AND EXISTS (SELECT 1 FROM coach_profiles WHERE user_id = auth.uid()))
        )
    )
  );

-- =====================================================
-- coaching_status 정책 수정
-- =====================================================
CREATE POLICY "coaching_status_select" ON coaching_status
  FOR SELECT USING (
    auth.uid() = coachee_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = coaching_status.coachee_id
        AND (
          cp.coach_id = auth.uid() OR
          (cp.coach_id IS NULL AND EXISTS (SELECT 1 FROM coach_profiles WHERE user_id = auth.uid()))
        )
    )
  );

-- =====================================================
-- 확인 쿼리 (선택사항)
-- =====================================================
-- SELECT * FROM pg_policies WHERE tablename IN ('asrs_results', 'survey_results', 'self_introductions');
