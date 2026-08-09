-- =====================================================
-- RLS 정책 수정 (무한 재귀 문제 해결)
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. 기존 users 정책 삭제
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_coach" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- 2. 수정된 users 정책 (무한 재귀 방지)
-- 본인 정보는 항상 조회 가능
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- 코치는 모든 사용자 조회 가능 (JWT에서 role 확인)
-- 주의: 이 방식을 사용하려면 사용자 메타데이터에 role을 저장해야 함
-- 대안: 모든 사용자가 다른 사용자의 기본 정보를 볼 수 있도록 허용
CREATE POLICY "users_select_for_relations" ON users
  FOR SELECT USING (
    -- 본인이거나
    auth.uid() = id
    OR
    -- 담당 코치/피코치 관계가 있는 경우
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE (cp.user_id = users.id AND cp.coach_id = auth.uid())
         OR (cp.coach_id = users.id AND cp.user_id = auth.uid())
    )
    OR
    -- 대화 상대인 경우
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE (c.coach_id = users.id AND c.coachee_id = auth.uid())
         OR (c.coachee_id = users.id AND c.coach_id = auth.uid())
    )
  );

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 3. coachee_profiles 정책 수정 (무한 재귀 방지)
DROP POLICY IF EXISTS "coachee_profiles_select" ON coachee_profiles;

CREATE POLICY "coachee_profiles_select" ON coachee_profiles
  FOR SELECT USING (
    -- 본인 프로필
    auth.uid() = user_id
    OR
    -- 담당 코치
    auth.uid() = coach_id
    OR
    -- 매칭 대기중 (코치가 볼 수 있음) - coach_id가 NULL인 경우
    (coach_id IS NULL AND EXISTS (
      SELECT 1 FROM coachee_profiles cp2
      WHERE cp2.user_id = auth.uid() -- 이건 자기 자신이 피코치인지 확인이 아니라
      -- 코치인지 확인해야 하는데, users를 참조하면 재귀가 됨
      -- 대안: 코치 프로필이 있는지 확인
    ))
  );

-- 더 단순한 접근: coach_profiles 테이블로 코치 여부 확인
DROP POLICY IF EXISTS "coachee_profiles_select" ON coachee_profiles;

CREATE POLICY "coachee_profiles_select" ON coachee_profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = coach_id
    OR (coach_id IS NULL AND EXISTS (SELECT 1 FROM coach_profiles WHERE user_id = auth.uid()))
  );

-- 4. coaching_topics 정책 수정
DROP POLICY IF EXISTS "coaching_topics_select" ON coaching_topics;

CREATE POLICY "coaching_topics_select" ON coaching_topics
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = coaching_topics.user_id AND cp.coach_id = auth.uid()
    )
  );

-- 5. coaching_goals 정책 수정
DROP POLICY IF EXISTS "coaching_goals_select" ON coaching_goals;

CREATE POLICY "coaching_goals_select" ON coaching_goals
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = coaching_goals.user_id AND cp.coach_id = auth.uid()
    )
  );

-- 6. asrs_results 정책 수정
DROP POLICY IF EXISTS "asrs_results_select" ON asrs_results;

CREATE POLICY "asrs_results_select" ON asrs_results
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = asrs_results.user_id AND cp.coach_id = auth.uid()
    )
  );

-- 7. survey_results 정책 수정
DROP POLICY IF EXISTS "survey_results_select" ON survey_results;

CREATE POLICY "survey_results_select" ON survey_results
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = survey_results.user_id AND cp.coach_id = auth.uid()
    )
  );

-- 8. execution_records 정책 수정
DROP POLICY IF EXISTS "execution_records_select" ON execution_records;

CREATE POLICY "execution_records_select" ON execution_records
  FOR SELECT USING (
    auth.uid() = coachee_id
    OR EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = execution_records.coachee_id AND cp.coach_id = auth.uid()
    )
  );

-- 9. self_introductions 정책 수정
DROP POLICY IF EXISTS "self_introductions_select" ON self_introductions;

CREATE POLICY "self_introductions_select" ON self_introductions
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = self_introductions.user_id AND cp.coach_id = auth.uid()
    )
  );

-- 10. coaching_status 정책 수정
DROP POLICY IF EXISTS "coaching_status_select" ON coaching_status;
DROP POLICY IF EXISTS "coaching_status_update" ON coaching_status;

CREATE POLICY "coaching_status_select" ON coaching_status
  FOR SELECT USING (
    auth.uid() = coachee_id
    OR EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = coaching_status.coachee_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "coaching_status_update" ON coaching_status
  FOR UPDATE USING (
    auth.uid() = coachee_id
    OR EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = coaching_status.coachee_id AND cp.coach_id = auth.uid()
    )
  );

-- 11. reflection_notes 정책 수정
DROP POLICY IF EXISTS "reflection_notes_select" ON reflection_notes;

CREATE POLICY "reflection_notes_select" ON reflection_notes
  FOR SELECT USING (
    auth.uid() = coachee_id
    OR (is_shared = TRUE AND EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = reflection_notes.coachee_id AND cp.coach_id = auth.uid()
    ))
  );

-- =====================================================
-- 완료!
-- =====================================================
