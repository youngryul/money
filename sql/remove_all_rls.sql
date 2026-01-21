-- 모든 RLS 정책 제거 및 비활성화 스크립트
-- ⚠️ 주의: 보안상 위험하므로 개발 환경에서만 사용하세요!
-- 프로덕션 환경에서는 절대 사용하지 마세요!

-- ============================================
-- 모든 RLS 정책 삭제
-- ============================================

-- invitations 테이블의 모든 정책 삭제
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'invitations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON invitations', r.policyname);
        RAISE NOTICE 'Deleted policy: % on invitations', r.policyname;
    END LOOP;
END $$;

-- users 테이블의 모든 정책 삭제
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', r.policyname);
        RAISE NOTICE 'Deleted policy: % on users', r.policyname;
    END LOOP;
END $$;

-- 기타 테이블들의 정책도 삭제 (있는 경우)
DO $$ 
DECLARE
    r RECORD;
    t RECORD;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN (
            'salaries', 'fixed_expenses', 'living_expenses', 
            'allowances', 'ledger_transactions', 'savings', 
            'investments', 'goals'
          )
    LOOP
        FOR r IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = t.tablename
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, t.tablename);
            RAISE NOTICE 'Deleted policy: % on %', r.policyname, t.tablename;
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- RLS 비활성화
-- ============================================

-- invitations 테이블 RLS 비활성화
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;

-- users 테이블 RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 기타 테이블들도 RLS 비활성화 (있는 경우)
ALTER TABLE IF EXISTS salaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fixed_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS living_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS allowances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ledger_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS savings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS investments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS goals DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 확인
-- ============================================

-- RLS가 비활성화되었는지 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'invitations', 'salaries', 'fixed_expenses', 
                    'living_expenses', 'allowances', 'ledger_transactions', 
                    'savings', 'investments', 'goals')
ORDER BY tablename;

-- 남아있는 정책 확인 (없어야 함)
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
