-- RLS 비활성화 스크립트
-- ⚠️ 주의: 보안상 위험하므로 개발 환경에서만 사용하세요!
-- 프로덕션 환경에서는 절대 사용하지 마세요!

-- invitations 테이블 RLS 비활성화
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;

-- users 테이블 RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 기타 테이블들도 RLS 비활성화 (필요한 경우)
-- ALTER TABLE salaries DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE fixed_expenses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE living_expenses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE allowances DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE ledger_transactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE savings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE investments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
