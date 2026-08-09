-- =====================================================
-- 코칭 상담 프로그램 Supabase 스키마 (전체)
-- 생성일: 2026-07-28
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- =====================================================
-- 1. 기존 객체 삭제 (깨끗하게 시작)
-- =====================================================
DROP VIEW IF EXISTS v_coach_coachees CASCADE;
DROP VIEW IF EXISTS v_coachee_dashboard CASCADE;
DROP VIEW IF EXISTS v_coach_tasks CASCADE;

DROP TABLE IF EXISTS reflection_notes CASCADE;
DROP TABLE IF EXISTS execution_records CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS session_notes CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS coaching_topics CASCADE;
DROP TABLE IF EXISTS coaching_goals CASCADE;
DROP TABLE IF EXISTS coaching_status CASCADE;
DROP TABLE IF EXISTS self_introductions CASCADE;
DROP TABLE IF EXISTS survey_results CASCADE;
DROP TABLE IF EXISTS asrs_results CASCADE;
DROP TABLE IF EXISTS coachee_profiles CASCADE;
DROP TABLE IF EXISTS coach_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 2. 기본 테이블
-- =====================================================

-- 2.1 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('coach', 'coachee')),
  phone TEXT,
  adhd_status TEXT CHECK (adhd_status IN ('diagnosed', 'suspected', 'none')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 코치 프로필
CREATE TABLE coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialty TEXT[],
  bio TEXT,
  available_times JSONB,
  max_coachees INT DEFAULT 10,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 피코치 프로필
CREATE TABLE coachee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES users(id) ON DELETE SET NULL,
  package_type TEXT CHECK (package_type IN ('starter', 'basic', 'premium')),
  total_sessions INT DEFAULT 5,
  completed_sessions INT DEFAULT 0,
  current_session INT DEFAULT 1,
  intro TEXT,
  expectation TEXT,
  concern TEXT,
  communication_styles TEXT[],
  preferred_times TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'paused')),
  matched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. 설문 및 진단 테이블
-- =====================================================

-- 3.1 ASRS 진단 결과
CREATE TABLE asrs_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_score INT NOT NULL,
  max_score INT DEFAULT 72,
  inattention_score INT NOT NULL,
  hyperactivity_score INT NOT NULL,
  impulsivity_score INT NOT NULL,
  level TEXT CHECK (level IN ('low', 'moderate', 'high')),
  interpretation TEXT,
  answers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 설문 결과 (사전/사후)
CREATE TABLE survey_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pre', 'post')),
  answers JSONB NOT NULL,
  category_scores JSONB NOT NULL,
  total_score INT NOT NULL,
  coaching_helpful INT CHECK (coaching_helpful BETWEEN 1 AND 5),
  coach_trust INT CHECK (coach_trust BETWEEN 1 AND 5),
  will_pay_again INT CHECK (will_pay_again BETWEEN 1 AND 5),
  will_recommend INT CHECK (will_recommend BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- 3.3 자기소개
CREATE TABLE self_introductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intro TEXT,
  expectation TEXT,
  concern TEXT,
  communication_styles TEXT[],
  preferred_times TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. 코칭 관련 테이블
-- =====================================================

-- 4.1 코칭 상태
CREATE TABLE coaching_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coachee_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  declaration_completed BOOLEAN DEFAULT FALSE,
  declaration_date TIMESTAMPTZ,
  goal_agreement_completed BOOLEAN DEFAULT FALSE,
  goal_agreement_date TIMESTAMPTZ,
  next_session_prepared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 코칭 목표
CREATE TABLE coaching_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  current_score INT DEFAULT 0 CHECK (current_score BETWEEN 0 AND 10),
  target_score INT DEFAULT 5 CHECK (target_score BETWEEN 0 AND 10),
  current_action TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 코칭 주제
CREATE TABLE coaching_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_score INT DEFAULT 0 CHECK (start_score BETWEEN 0 AND 10),
  current_score INT DEFAULT 0 CHECK (current_score BETWEEN 0 AND 10),
  target_score INT DEFAULT 5 CHECK (target_score BETWEEN 0 AND 10),
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. 세션 관련 테이블
-- =====================================================

-- 5.1 세션
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coachee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_number INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INT DEFAULT 50,
  type TEXT DEFAULT 'video' CHECK (type IN ('video', 'message', 'phone')),
  topic TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  meeting_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.2 세션 일지
CREATE TABLE session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary TEXT,
  client_state TEXT,
  main_topics TEXT[],
  insights TEXT,
  next_actions TEXT[],
  coach_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. 과제 관련 테이블
-- =====================================================

-- 6.1 과제
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coachee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_number INT,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  -- ADHD 전략 필드
  purpose TEXT,
  min_action TEXT,
  location TEXT,
  signal TEXT,
  fallback TEXT,
  return_action TEXT,
  -- 반복 과제
  target_count INT DEFAULT 1,
  completed_count INT DEFAULT 0,
  -- 제출 정보
  submission_content TEXT,
  submission_date TIMESTAMPTZ,
  feedback TEXT,
  details_completed JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.2 실행 기록
CREATE TABLE execution_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coachee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT TRUE,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. 메시지 관련 테이블
-- =====================================================

-- 7.1 대화방
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coachee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, coachee_id)
);

-- 7.2 메시지
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('coach', 'coachee')),
  content TEXT,
  type TEXT DEFAULT 'normal' CHECK (type IN ('normal', 'declaration', 'goal_agreement', 'task', 'system', 'file', 'image')),
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. 알림 테이블
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_reminder', 'session_reminder', 'message', 'system', 'coach_feedback', 'goal_achieved')),
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. 성찰 일지 테이블
-- =====================================================

CREATE TABLE reflection_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coachee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('very_bad', 'bad', 'neutral', 'good', 'very_good')),
  tags TEXT[],
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. 뷰 (Views)
-- =====================================================

-- 10.1 코치의 담당 피코치 목록 뷰
CREATE OR REPLACE VIEW v_coach_coachees AS
SELECT
  cp.id,
  cp.user_id,
  u.name,
  u.email,
  u.phone,
  u.adhd_status,
  cp.coach_id,
  cp.package_type,
  cp.total_sessions,
  cp.completed_sessions,
  cp.current_session,
  cp.status,
  cp.matched_at,
  cp.intro,
  cp.expectation,
  cp.concern,
  cp.communication_styles,
  cp.preferred_times,
  cs.declaration_completed,
  cs.goal_agreement_completed,
  cs.next_session_prepared,
  cg.current_score AS recent_score,
  cg.target_score,
  cg.title AS goal_title,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.coachee_id = cp.user_id
        AND t.status = 'pending'
        AND t.due_date < CURRENT_DATE
    ) THEN TRUE
    ELSE FALSE
  END AS has_warning
FROM coachee_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN coaching_status cs ON cs.coachee_id = cp.user_id
LEFT JOIN coaching_goals cg ON cg.user_id = cp.user_id AND cg.is_active = TRUE;

-- 10.2 피코치 대시보드 뷰
CREATE OR REPLACE VIEW v_coachee_dashboard AS
SELECT
  cp.user_id,
  u.name,
  cp.coach_id,
  coach.name AS coach_name,
  cp.package_type,
  cp.total_sessions,
  cp.completed_sessions,
  cp.current_session,
  cp.status,
  ar.total_score AS asrs_score,
  ar.level AS asrs_level,
  ar.inattention_score,
  ar.hyperactivity_score,
  ar.impulsivity_score,
  cs.declaration_completed,
  cs.goal_agreement_completed,
  cg.title AS goal_title,
  cg.current_score AS goal_current_score,
  cg.target_score AS goal_target_score,
  cg.current_action
FROM coachee_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN users coach ON cp.coach_id = coach.id
LEFT JOIN asrs_results ar ON ar.user_id = cp.user_id
LEFT JOIN coaching_status cs ON cs.coachee_id = cp.user_id
LEFT JOIN coaching_goals cg ON cg.user_id = cp.user_id AND cg.is_active = TRUE;

-- 10.3 과제 현황 뷰 (코치용)
CREATE OR REPLACE VIEW v_coach_tasks AS
SELECT
  t.*,
  u.name AS coachee_name,
  cp.current_session AS coachee_current_session,
  CASE
    WHEN t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled') THEN TRUE
    ELSE FALSE
  END AS is_overdue
FROM tasks t
JOIN users u ON t.coachee_id = u.id
JOIN coachee_profiles cp ON cp.user_id = t.coachee_id;

-- =====================================================
-- 11. 인덱스
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_coachee_profiles_user_id ON coachee_profiles(user_id);
CREATE INDEX idx_coachee_profiles_coach_id ON coachee_profiles(coach_id);
CREATE INDEX idx_coachee_profiles_status ON coachee_profiles(status);

CREATE INDEX idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX idx_sessions_coachee_id ON sessions(coachee_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_date_status ON sessions(date, status);

CREATE INDEX idx_tasks_coachee_id ON tasks(coachee_id);
CREATE INDEX idx_tasks_coach_id ON tasks(coach_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

CREATE INDEX idx_conversations_coach_id ON conversations(coach_id);
CREATE INDEX idx_conversations_coachee_id ON conversations(coachee_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_execution_records_coachee_id ON execution_records(coachee_id);
CREATE INDEX idx_execution_records_executed_at ON execution_records(executed_at DESC);

CREATE INDEX idx_coaching_topics_user_id ON coaching_topics(user_id);
CREATE INDEX idx_coaching_goals_user_id ON coaching_goals(user_id);
CREATE INDEX idx_asrs_results_user_id ON asrs_results(user_id);
CREATE INDEX idx_survey_results_user_id_type ON survey_results(user_id, type);

-- =====================================================
-- 12. 트리거 함수
-- =====================================================

-- updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coachee_profiles_updated_at
  BEFORE UPDATE ON coachee_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_notes_updated_at
  BEFORE UPDATE ON session_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_status_updated_at
  BEFORE UPDATE ON coaching_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_goals_updated_at
  BEFORE UPDATE ON coaching_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_topics_updated_at
  BEFORE UPDATE ON coaching_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_self_introductions_updated_at
  BEFORE UPDATE ON self_introductions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reflection_notes_updated_at
  BEFORE UPDATE ON reflection_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 메시지 전송 시 대화방 last_message_at 업데이트
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- 과제 완료 횟수 달성 시 자동 완료 처리
CREATE OR REPLACE FUNCTION check_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_count >= NEW.target_count AND NEW.status != 'completed' THEN
    NEW.status = 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_complete_task
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION check_task_completion();

-- 세션 완료 시 completed_sessions 증가
CREATE OR REPLACE FUNCTION increment_completed_sessions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE coachee_profiles
    SET
      completed_sessions = completed_sessions + 1,
      current_session = current_session + 1
    WHERE user_id = NEW.coachee_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_completed_trigger
  AFTER UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION increment_completed_sessions();

-- =====================================================
-- 13. Row Level Security (RLS)
-- =====================================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coachee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE asrs_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_introductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_notes ENABLE ROW LEVEL SECURITY;

-- users 정책 (무한 재귀 방지)
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- 관계가 있는 사용자 정보 조회 (코치-피코치 관계)
CREATE POLICY "users_select_for_relations" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE (cp.user_id = users.id AND cp.coach_id = auth.uid())
         OR (cp.coach_id = users.id AND cp.user_id = auth.uid())
    )
  );

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- coach_profiles 정책
CREATE POLICY "coach_profiles_select_all" ON coach_profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "coach_profiles_insert_own" ON coach_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coach_profiles_update_own" ON coach_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- coachee_profiles 정책 (무한 재귀 방지 - coach_profiles로 코치 여부 확인)
CREATE POLICY "coachee_profiles_select" ON coachee_profiles
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = coach_id OR
    (coach_id IS NULL AND EXISTS (SELECT 1 FROM coach_profiles WHERE user_id = auth.uid()))
  );

CREATE POLICY "coachee_profiles_insert" ON coachee_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coachee_profiles_update" ON coachee_profiles
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = coach_id);

-- sessions 정책
CREATE POLICY "sessions_select" ON sessions
  FOR SELECT USING (auth.uid() = coach_id OR auth.uid() = coachee_id);

CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE USING (auth.uid() = coach_id OR auth.uid() = coachee_id);

CREATE POLICY "sessions_delete" ON sessions
  FOR DELETE USING (auth.uid() = coach_id);

-- session_notes 정책
CREATE POLICY "session_notes_select" ON session_notes
  FOR SELECT USING (
    auth.uid() = coach_id OR
    auth.uid() IN (SELECT coachee_id FROM sessions WHERE id = session_id)
  );

CREATE POLICY "session_notes_insert" ON session_notes
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "session_notes_update" ON session_notes
  FOR UPDATE USING (auth.uid() = coach_id);

-- tasks 정책
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (auth.uid() = coachee_id OR auth.uid() = coach_id);

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = coach_id OR auth.uid() = coachee_id);

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (auth.uid() = coachee_id OR auth.uid() = coach_id);

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (auth.uid() = coach_id);

-- execution_records 정책
CREATE POLICY "execution_records_select" ON execution_records
  FOR SELECT USING (
    auth.uid() = coachee_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = execution_records.coachee_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "execution_records_insert" ON execution_records
  FOR INSERT WITH CHECK (auth.uid() = coachee_id);

-- conversations 정책
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (auth.uid() = coach_id OR auth.uid() = coachee_id);

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = coach_id OR auth.uid() = coachee_id);

-- messages 정책
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE coach_id = auth.uid() OR coachee_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE coach_id = auth.uid() OR coachee_id = auth.uid()
    )
  );

-- notifications 정책
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- asrs_results 정책
CREATE POLICY "asrs_results_select" ON asrs_results
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = asrs_results.user_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "asrs_results_insert" ON asrs_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- survey_results 정책
CREATE POLICY "survey_results_select" ON survey_results
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = survey_results.user_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "survey_results_insert" ON survey_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "survey_results_update" ON survey_results
  FOR UPDATE USING (auth.uid() = user_id);

-- self_introductions 정책
CREATE POLICY "self_introductions_select" ON self_introductions
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = self_introductions.user_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "self_introductions_insert" ON self_introductions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "self_introductions_update" ON self_introductions
  FOR UPDATE USING (auth.uid() = user_id);

-- coaching_status 정책
CREATE POLICY "coaching_status_select" ON coaching_status
  FOR SELECT USING (
    auth.uid() = coachee_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = coaching_status.coachee_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "coaching_status_insert" ON coaching_status
  FOR INSERT WITH CHECK (auth.uid() = coachee_id);

CREATE POLICY "coaching_status_update" ON coaching_status
  FOR UPDATE USING (
    auth.uid() = coachee_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = coaching_status.coachee_id AND cp.coach_id = auth.uid()
    )
  );

-- coaching_goals 정책
CREATE POLICY "coaching_goals_select" ON coaching_goals
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = coaching_goals.user_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "coaching_goals_insert" ON coaching_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coaching_goals_update" ON coaching_goals
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = coaching_goals.user_id AND cp.coach_id = auth.uid()
    )
  );

-- coaching_topics 정책
CREATE POLICY "coaching_topics_select" ON coaching_topics
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = coaching_topics.user_id AND cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "coaching_topics_insert" ON coaching_topics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coaching_topics_update" ON coaching_topics
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = coaching_topics.user_id AND cp.coach_id = auth.uid()
    )
  );

-- reflection_notes 정책
CREATE POLICY "reflection_notes_select" ON reflection_notes
  FOR SELECT USING (
    auth.uid() = coachee_id OR
    (is_shared = TRUE AND EXISTS (
      SELECT 1 FROM coachee_profiles cp
      WHERE cp.user_id = reflection_notes.coachee_id AND cp.coach_id = auth.uid()
    ))
  );

CREATE POLICY "reflection_notes_insert" ON reflection_notes
  FOR INSERT WITH CHECK (auth.uid() = coachee_id);

CREATE POLICY "reflection_notes_update" ON reflection_notes
  FOR UPDATE USING (auth.uid() = coachee_id);

CREATE POLICY "reflection_notes_delete" ON reflection_notes
  FOR DELETE USING (auth.uid() = coachee_id);

-- =====================================================
-- 14. 실시간 구독 (Realtime)
-- =====================================================

-- Supabase 대시보드에서 아래 테이블들의 Realtime 활성화 필요:
-- - messages
-- - notifications
-- - tasks
-- - sessions

-- =====================================================
-- 13. Storage 버킷 설정
-- =====================================================

-- 기존 버킷 삭제 (있으면)
DELETE FROM storage.buckets WHERE id = 'chat-images';

-- chat-images 버킷 생성 (공개)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Storage RLS 정책
-- 기존 정책 삭제
DROP POLICY IF EXISTS "chat_images_select" ON storage.objects;
DROP POLICY IF EXISTS "chat_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "chat_images_delete" ON storage.objects;

-- 모든 사용자 읽기 허용 (공개 버킷)
CREATE POLICY "chat_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images');

-- 인증된 사용자만 업로드 허용
CREATE POLICY "chat_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-images'
    AND auth.role() = 'authenticated'
  );

-- 본인이 업로드한 파일만 삭제 허용 (폴더명 = user_id)
CREATE POLICY "chat_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )

-- =====================================================
-- 완료! Supabase SQL Editor에서 이 스크립트를 실행하세요.
-- =====================================================
