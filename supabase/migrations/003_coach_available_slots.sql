-- =============================================
-- 코치 상담 가능 시간 슬롯 테이블
-- =============================================

-- 테이블 생성
CREATE TABLE IF NOT EXISTS coach_available_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration INT DEFAULT 60,  -- 상담 시간 (분): 30, 60, 90
  is_booked BOOLEAN DEFAULT FALSE,
  booked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 같은 코치가 같은 날짜/시간에 중복 슬롯 방지
  UNIQUE(coach_id, date, start_time)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_coach_slots_coach_id ON coach_available_slots(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_slots_coach_date ON coach_available_slots(coach_id, date);
CREATE INDEX IF NOT EXISTS idx_coach_slots_date_available ON coach_available_slots(date, is_booked);
CREATE INDEX IF NOT EXISTS idx_coach_slots_booked_by ON coach_available_slots(booked_by);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_coach_slots_updated_at
  BEFORE UPDATE ON coach_available_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

ALTER TABLE coach_available_slots ENABLE ROW LEVEL SECURITY;

-- SELECT: 코치는 자신의 슬롯, 피코치는 담당 코치의 슬롯만 조회
CREATE POLICY "coach_slots_select" ON coach_available_slots
  FOR SELECT USING (
    auth.uid() = coach_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles
      WHERE user_id = auth.uid() AND coach_id = coach_available_slots.coach_id
    )
  );

-- INSERT: 코치만 자신의 슬롯 추가 가능
CREATE POLICY "coach_slots_insert" ON coach_available_slots
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

-- UPDATE: 코치는 자신의 슬롯, 피코치는 예약 시 업데이트 가능
CREATE POLICY "coach_slots_update" ON coach_available_slots
  FOR UPDATE USING (
    auth.uid() = coach_id OR
    (
      -- 피코치가 예약할 때: is_booked가 false인 슬롯만, 자신의 담당 코치 슬롯만
      is_booked = FALSE AND
      EXISTS (
        SELECT 1 FROM coachee_profiles
        WHERE user_id = auth.uid() AND coach_id = coach_available_slots.coach_id
      )
    )
  );

-- DELETE: 코치만 예약 안 된 자신의 슬롯 삭제 가능
CREATE POLICY "coach_slots_delete" ON coach_available_slots
  FOR DELETE USING (auth.uid() = coach_id AND is_booked = FALSE);

-- =============================================
-- 코멘트
-- =============================================

COMMENT ON TABLE coach_available_slots IS '코치의 상담 가능 시간 슬롯';
COMMENT ON COLUMN coach_available_slots.date IS '상담 가능 날짜';
COMMENT ON COLUMN coach_available_slots.start_time IS '시작 시간';
COMMENT ON COLUMN coach_available_slots.end_time IS '종료 시간';
COMMENT ON COLUMN coach_available_slots.duration IS '상담 시간 (분)';
COMMENT ON COLUMN coach_available_slots.is_booked IS '예약 여부';
COMMENT ON COLUMN coach_available_slots.booked_by IS '예약한 피코치 ID';
COMMENT ON COLUMN coach_available_slots.session_id IS '연결된 세션 ID';
