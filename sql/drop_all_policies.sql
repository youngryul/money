-- 모든 RLS 정책 삭제 스크립트
-- Supabase SQL Editor에서 실행하세요.
-- 이 스크립트는 invitations와 users 테이블의 모든 RLS 정책을 삭제합니다.

-- ============================================
-- invitations 테이블 정책 삭제
-- ============================================

-- 현재 존재하는 정책 확인
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'invitations';

-- 모든 정책 삭제 (정책 이름이 정확하지 않을 수 있으므로 하나씩 시도)
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
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- ============================================
-- users 테이블 정책 삭제
-- ============================================

-- 현재 존재하는 정책 확인
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'users';

-- 모든 정책 삭제 (정책 이름이 정확하지 않을 수 있으므로 하나씩 시도)
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
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- 삭제 확인
SELECT 'invitations policies:' as info;
SELECT policyname FROM pg_policies WHERE tablename = 'invitations';

SELECT 'users policies:' as info;
SELECT policyname FROM pg_policies WHERE tablename = 'users';
