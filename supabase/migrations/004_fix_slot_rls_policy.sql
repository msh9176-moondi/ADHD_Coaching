-- =============================================
-- 슬롯 예약 RLS 정책 수정
-- 피코치가 슬롯을 예약할 수 있도록 정책 완화
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "coach_slots_update" ON coach_available_slots;
DROP POLICY IF EXISTS "coach_slots_select" ON coach_available_slots;

-- SELECT: 인증된 사용자는 모두 조회 가능 (간소화)
CREATE POLICY "coach_slots_select" ON coach_available_slots
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- UPDATE: 코치는 자신의 슬롯, 인증된 사용자는 예약 가능
CREATE POLICY "coach_slots_update" ON coach_available_slots
  FOR UPDATE USING (
    auth.uid() = coach_id OR
    (
      -- 예약 안 된 슬롯만 업데이트 가능
      is_booked = FALSE AND
      auth.uid() IS NOT NULL
    )
  );

-- 확인용: 정책 목록 조회
-- SELECT * FROM pg_policies WHERE tablename = 'coach_available_slots';
