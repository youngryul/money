-- 간단한 RLS 정책 설정
-- Supabase SQL Editor에서 실행하세요.
-- 이 스크립트는 최소한의 RLS 정책만 설정합니다.

-- ============================================
-- invitations 테이블 RLS 정책
-- ============================================

-- RLS 활성화
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
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
    END LOOP;
END $$;

-- 정책 1: 초대장 코드로 조회는 누구나 가능 (인증 없이도)
CREATE POLICY "Anyone can read pending invitation by code"
  ON invitations
  FOR SELECT
  USING (
    status = 'PENDING' AND
    expires_at > NOW()
  );

-- 정책 2: 인증된 사용자는 자신이 보낸 초대장을 조회할 수 있음
CREATE POLICY "Users can read their sent invitations"
  ON invitations
  FOR SELECT
  USING (auth.uid() = inviter_id);

-- 정책 3: 인증된 사용자는 자신의 이메일로 발송된 초대장을 조회할 수 있음
CREATE POLICY "Users can read invitations sent to their email"
  ON invitations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 정책 4: 인증된 사용자는 초대장을 생성할 수 있음
CREATE POLICY "Authenticated users can create invitations"
  ON invitations
  FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- 정책 5: 인증된 사용자는 자신의 이메일로 발송된 초대장을 수락/거절할 수 있음
CREATE POLICY "Users can update invitations sent to their email"
  ON invitations
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ============================================
-- users 테이블 RLS 정책
-- ============================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
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
    END LOOP;
END $$;

-- 정책 1: 인증된 사용자는 자신의 사용자 정보를 조회할 수 있음
CREATE POLICY "Users can read their own user info"
  ON users
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- 정책 2: 인증된 사용자는 자신의 사용자 정보를 생성할 수 있음
CREATE POLICY "Users can create their own user info"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- 정책 3: 인증된 사용자는 자신의 사용자 정보를 수정할 수 있음
CREATE POLICY "Users can update their own user info"
  ON users
  FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- 정책 4: 인증된 사용자는 자신의 사용자 정보를 삭제할 수 있음
CREATE POLICY "Users can delete their own user info"
  ON users
  FOR DELETE
  USING (auth.uid() = auth_user_id);
