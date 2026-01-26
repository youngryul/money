-- 투자금 스냅샷 테이블
-- 매일 오후 4시에 투자금을 저장하여 월말 금액을 추적

CREATE TABLE IF NOT EXISTS investment_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  investment_amount DECIMAL(15, 2) NOT NULL CHECK (investment_amount >= 0),
  kis_total_value DECIMAL(15, 2) DEFAULT 0, -- 한국투자증권 총 평가금액
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date) -- 사용자별 날짜당 하나의 스냅샷만 허용
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_investment_snapshots_user_id ON investment_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_snapshots_date ON investment_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_investment_snapshots_user_date ON investment_snapshots(user_id, snapshot_date);

-- RLS 정책
ALTER TABLE investment_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own investment snapshots"
  ON investment_snapshots FOR SELECT
  USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own investment snapshots"
  ON investment_snapshots FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own investment snapshots"
  ON investment_snapshots FOR UPDATE
  USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete their own investment snapshots"
  ON investment_snapshots FOR DELETE
  USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));
