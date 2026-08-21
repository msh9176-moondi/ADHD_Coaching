-- 브레인 덤프 테이블 생성
-- 일일 실행목록 및 포괄 실행목록 저장

CREATE TABLE IF NOT EXISTS brain_dumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_tasks JSONB DEFAULT '[]'::jsonb,
  comprehensive_tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_user_brain_dump UNIQUE (user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_brain_dumps_user_id ON brain_dumps(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_dumps_updated_at ON brain_dumps(updated_at);

-- RLS 활성화
ALTER TABLE brain_dumps ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 데이터만 조회 가능
CREATE POLICY "Users can view own brain dumps"
  ON brain_dumps FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 정책: 본인 데이터만 생성 가능
CREATE POLICY "Users can insert own brain dumps"
  ON brain_dumps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 본인 데이터만 수정 가능
CREATE POLICY "Users can update own brain dumps"
  ON brain_dumps FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 본인 데이터만 삭제 가능
CREATE POLICY "Users can delete own brain dumps"
  ON brain_dumps FOR DELETE
  USING (auth.uid() = user_id);

-- 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE brain_dumps;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_brain_dumps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_brain_dumps_updated_at
  BEFORE UPDATE ON brain_dumps
  FOR EACH ROW
  EXECUTE FUNCTION update_brain_dumps_updated_at();
