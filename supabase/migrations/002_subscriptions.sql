-- 구독 테이블 생성
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- 플랜 정보
  plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),

  -- 세션 관리
  sessions_per_month INTEGER NOT NULL DEFAULT 2,
  sessions_used_this_month INTEGER NOT NULL DEFAULT 0,

  -- 기간 정보
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- 결제 관련 (향후 확장용)
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
  payment_method TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- coachee_profiles에 subscription_id 컬럼 추가
ALTER TABLE coachee_profiles
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_coach_id ON subscriptions(coach_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS 정책
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 구독만 조회 가능
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 코치는 자신이 담당하는 구독 조회 가능
CREATE POLICY "Coaches can view their coachees subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = coach_id);

-- 구독 생성은 인증된 사용자만
CREATE POLICY "Authenticated users can create subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 구독 수정은 본인 또는 담당 코치만
CREATE POLICY "Users or coaches can update subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = coach_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- 월간 세션 사용량 리셋 함수 (cron job에서 호출)
CREATE OR REPLACE FUNCTION reset_monthly_sessions()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET
    sessions_used_this_month = 0,
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 month'
  WHERE
    status = 'active'
    AND current_period_end < NOW();
END;
$$ LANGUAGE plpgsql;
