-- sessions 테이블에 is_subscriber_session 컬럼 추가
-- 구독자 세션과 일반 패키지 세션을 구분하기 위한 컬럼

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS is_subscriber_session BOOLEAN DEFAULT FALSE;

-- 인덱스 추가 (구독자 세션 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_sessions_is_subscriber ON sessions(is_subscriber_session);

-- subscription_id 컬럼도 추가 (어떤 구독에서 사용된 세션인지 추적)
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_subscription_id ON sessions(subscription_id);
