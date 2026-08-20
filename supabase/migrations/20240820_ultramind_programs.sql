-- Ultra Mind 6주 프로그램 테이블
-- 기존 구독 시스템(subscriptions)과 통합됨
CREATE TABLE IF NOT EXISTS ultramind_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL, -- 기존 구독과 연결
  program_data JSONB, -- 6주 프로그램 데이터
  prescriptions JSONB, -- 맞춤 처방 데이터
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- active, completed, paused
  current_week INT DEFAULT 1,
  weekly_progress JSONB DEFAULT '[]', -- 주간 진행 기록
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 체크리스트 응답 기록 테이블
CREATE TABLE IF NOT EXISTS ultramind_checklist_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES ultramind_programs(id) ON DELETE CASCADE,
  checklist_id TEXT NOT NULL, -- dopamine, serotonin, etc.
  checklist_name TEXT,
  category TEXT,
  score INT,
  max_score INT,
  percentage INT,
  answers JSONB, -- { questionIndex: value }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일일 진행 기록 테이블
CREATE TABLE IF NOT EXISTS ultramind_daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES ultramind_programs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE DEFAULT CURRENT_DATE,
  completed_tasks JSONB DEFAULT '[]', -- 완료한 태스크 목록
  notes TEXT, -- 메모
  mood_score INT, -- 기분 점수 (1-10)
  energy_score INT, -- 에너지 점수 (1-10)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, log_date)
);

-- RLS 정책
ALTER TABLE ultramind_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ultramind_checklist_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ultramind_daily_logs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회/수정 가능
CREATE POLICY "Users can manage own programs" ON ultramind_programs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own checklist results" ON ultramind_checklist_results
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own daily logs" ON ultramind_daily_logs
  FOR ALL USING (auth.uid() = user_id);

-- 코치는 자신의 피코치 데이터 조회 가능
CREATE POLICY "Coaches can view coachee programs" ON ultramind_programs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_coachee_relations
      WHERE coach_id = auth.uid() AND coachee_id = ultramind_programs.user_id
    )
  );

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ultramind_programs_user ON ultramind_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_ultramind_programs_status ON ultramind_programs(status);
CREATE INDEX IF NOT EXISTS idx_ultramind_checklist_results_program ON ultramind_checklist_results(program_id);
CREATE INDEX IF NOT EXISTS idx_ultramind_daily_logs_program_date ON ultramind_daily_logs(program_id, log_date);
