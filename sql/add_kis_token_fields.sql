-- kis_connections 테이블에 토큰 관련 필드 추가
ALTER TABLE kis_connections
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가 (만료 시간 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_kis_connections_token_expires_at ON kis_connections(token_expires_at);
