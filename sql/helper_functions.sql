-- RLS 정책을 우회하여 파트너 정보를 조회하는 헬퍼 함수
-- Supabase SQL Editor에서 실행하세요.

-- 파트너 ID로 파트너 정보 조회 함수
CREATE OR REPLACE FUNCTION get_partner_by_id(partner_id_param UUID)
RETURNS TABLE (
  id UUID,
  auth_user_id UUID,
  name VARCHAR,
  type VARCHAR,
  character VARCHAR,
  partner_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.auth_user_id,
    u.name,
    u.type,
    u.character,
    u.partner_id,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.id = partner_id_param;
END;
$$;

-- 현재 사용자의 파트너 정보 조회 함수
CREATE OR REPLACE FUNCTION get_current_user_partner()
RETURNS TABLE (
  id UUID,
  auth_user_id UUID,
  name VARCHAR,
  type VARCHAR,
  character VARCHAR,
  partner_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  partner_id_param UUID;
BEGIN
  -- 현재 인증된 사용자의 ID 가져오기
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- 현재 사용자의 partner_id 가져오기
  SELECT u.partner_id INTO partner_id_param
  FROM users u
  WHERE u.auth_user_id = current_user_id;
  
  IF partner_id_param IS NULL THEN
    RETURN;
  END IF;
  
  -- 파트너 정보 반환
  RETURN QUERY
  SELECT 
    u.id,
    u.auth_user_id,
    u.name,
    u.type,
    u.character,
    u.partner_id,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.id = partner_id_param;
END;
$$;

-- 초대자의 users 테이블 정보 조회 함수
CREATE OR REPLACE FUNCTION get_inviter_user_by_auth_id(inviter_auth_id UUID)
RETURNS TABLE (
  id UUID,
  auth_user_id UUID,
  name VARCHAR,
  type VARCHAR,
  character VARCHAR,
  partner_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.auth_user_id,
    u.name,
    u.type,
    u.character,
    u.partner_id,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.auth_user_id = inviter_auth_id;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION get_partner_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_partner() TO authenticated;
GRANT EXECUTE ON FUNCTION get_inviter_user_by_auth_id(UUID) TO authenticated;
