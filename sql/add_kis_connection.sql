-- 한국투자증권 연동 정보 테이블
-- 사용자별로 KIS 계좌 연동 정보를 저장합니다.

CREATE TABLE IF NOT EXISTS kis_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_key TEXT NOT NULL, -- 암호화 권장
  app_secret TEXT NOT NULL, -- 암호화 권장
  account_number VARCHAR(50) NOT NULL,
  is_virtual BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- 사용자당 하나의 연동만 허용
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_kis_connections_user_id ON kis_connections(user_id);

-- RLS 정책 (사용자는 자신의 연동 정보만 조회/수정 가능)
ALTER TABLE kis_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own KIS connections"
  ON kis_connections FOR SELECT
  USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own KIS connections"
  ON kis_connections FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own KIS connections"
  ON kis_connections FOR UPDATE
  USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete their own KIS connections"
  ON kis_connections FOR DELETE
  USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));
