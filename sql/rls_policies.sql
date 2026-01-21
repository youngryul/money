-- Row Level Security (RLS) 정책 설정
-- ⚠️ 주의: 이 파일은 RLS 정책을 비활성화하도록 수정되었습니다.
-- 개발 환경에서만 사용하세요. 프로덕션에서는 절대 사용하지 마세요!
-- 
-- RLS를 완전히 비활성화하려면 sql/disable_rls.sql 파일을 실행하세요.

-- ============================================
-- invitations 테이블 RLS 정책
-- ============================================

-- RLS 활성화
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
-- 정책 이름이 정확하지 않을 수 있으므로, 모든 정책을 삭제하는 스크립트를 별도로 제공합니다.
-- 필요시 sql/drop_all_policies.sql 파일을 먼저 실행하세요.
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
-- 초대장 링크를 클릭했을 때 로그인하지 않은 상태에서도 조회 가능하도록
-- 단, PENDING 상태이고 만료되지 않은 초대장만 조회 가능
-- 주의: 이 정책은 users 테이블을 참조하지 않으므로 순환 참조 문제가 없습니다.
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
-- 주의: auth.users는 시스템 테이블이므로 RLS 정책이 없습니다.
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

-- 기존 정책 삭제 (있는 경우)
-- 정책 이름이 정확하지 않을 수 있으므로, 모든 정책을 삭제하는 스크립트를 별도로 제공합니다.
-- 필요시 sql/drop_all_policies.sql 파일을 먼저 실행하세요.
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
-- 이 정책은 모든 SELECT 쿼리에 적용되므로, getUsers() 호출 시에도 자신의 정보만 반환됩니다.
CREATE POLICY "Users can read their own user info"
  ON users
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- 정책 2: 인증된 사용자는 파트너 관계가 있는 경우 파트너 정보도 조회할 수 있음
-- 주의: 순환 참조 문제를 피하기 위해 이 정책을 제거합니다.
-- 파트너 정보는 애플리케이션 레벨에서 처리하거나, 
-- 별도의 SECURITY DEFINER 함수를 사용하여 조회합니다.
-- (정책 2 제거됨 - 순환 참조 문제 해결)

-- 정책 2-1: 초대장 수락 시 초대자 정보를 조회할 수 있음
-- 주의: 이 정책은 invitations 테이블을 참조하므로 순환 참조 문제가 발생할 수 있습니다.
-- 따라서 이 정책을 제거하고, 대신 acceptInvitation 함수에서 
-- invitations 테이블의 정책 1을 통해 초대장을 조회한 후,
-- 초대자의 auth_user_id를 직접 사용하여 users 테이블을 조회하도록 합니다.
-- (정책 2-1 제거됨 - 순환 참조 문제 해결)

-- 정책 3: 인증된 사용자는 자신의 사용자 정보를 생성할 수 있음
-- INSERT 후 SELECT는 정책 1에 의해 허용됩니다.
-- 주의: auth_user_id는 반드시 현재 사용자의 ID와 일치해야 합니다.
CREATE POLICY "Users can create their own user info"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- 정책 4: 인증된 사용자는 자신의 사용자 정보를 수정할 수 있음
CREATE POLICY "Users can update their own user info"
  ON users
  FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- 정책 5: 파트너 관계 설정 시 파트너 정보도 수정할 수 있음
-- 주의: 순환 참조 문제를 피하기 위해 이 정책을 단순화합니다.
-- 초대장 수락 시에는 invitations 테이블의 정보를 사용하여 처리합니다.
CREATE POLICY "Users can update their partner info"
  ON users
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    -- 초대장 수락 시: 자신의 이메일로 발송된 PENDING 상태의 초대장이 있고, 그 초대장의 inviter_id와 일치하는 사용자
    auth_user_id IN (
      SELECT inviter_id 
      FROM invitations 
      WHERE invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND status = 'PENDING'
        AND expires_at > NOW()
    )
  );

-- 정책 6: 인증된 사용자는 자신의 사용자 정보를 삭제할 수 있음
CREATE POLICY "Users can delete their own user info"
  ON users
  FOR DELETE
  USING (auth.uid() = auth_user_id);
