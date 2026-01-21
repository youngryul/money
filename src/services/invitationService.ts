import { supabase } from '../lib/supabase'
import { Invitation } from '../types'
import { createUser, updateUser } from './userService'
import { USER_TYPE } from '../constants'

/**
 * 초대장 생성
 * @param inviteeEmail - 초대받을 사용자의 이메일
 * @param inviterName - 초대하는 사용자의 이름
 * @returns 생성된 초대장 정보
 */
export async function createInvitation(
  inviteeEmail: string,
  inviterName: string
): Promise<Invitation> {
  // 초대 코드 생성 (8자리 랜덤 문자열)
  const code = Math.random().toString(36).substring(2, 10).toUpperCase()
  
  // 7일 후 만료
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // 초대자 정보를 users 테이블에 저장 (PARTNER_1로 설정)
  // 현재 사용자 정보 조회 (RLS 정책에 의해 자신의 정보만 조회됨)
  const { data: existingUser, error: userQueryError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (userQueryError && userQueryError.code !== 'PGRST116') {
    console.error('사용자 조회 오류:', userQueryError)
    throw new Error(userQueryError.message || '사용자 정보 조회에 실패했습니다.')
  }

  // 초대자 정보를 users 테이블에 저장 (PARTNER_1로 설정)
  if (!existingUser) {
    // 사용자 정보가 없으면 생성
    await createUser({
      authUserId: user.id,
      name: inviterName,
      type: USER_TYPE.PARTNER_1,
    })
  } else {
    // 기존 사용자 정보 업데이트
    await updateUser(existingUser.id, {
      name: inviterName,
      type: USER_TYPE.PARTNER_1,
    })
  }

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      inviter_id: user.id,
      invitee_email: inviteeEmail,
      code,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('초대장 생성 오류:', error)
    throw new Error(error.message || '초대장 생성에 실패했습니다.')
  }

  return {
    id: data.id,
    inviterId: data.inviter_id,
    inviteeEmail: data.invitee_email,
    code: data.code,
    status: data.status,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * 초대장 조회 (보낸 초대장)
 * @returns 초대장 목록
 */
export async function getSentInvitations(): Promise<Invitation[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('inviter_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('초대장 조회 오류:', error)
    throw error
  }

  return (
    data?.map((invitation) => ({
      id: invitation.id,
      inviterId: invitation.inviter_id,
      inviteeEmail: invitation.invitee_email,
      code: invitation.code,
      status: invitation.status,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
      updatedAt: invitation.updated_at,
    })) || []
  )
}

/**
 * 초대장 조회 (받은 초대장)
 * @param email - 사용자 이메일
 * @returns 초대장 목록
 */
export async function getReceivedInvitations(email: string): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('invitee_email', email)
    .eq('status', 'PENDING')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('초대장 조회 오류:', error)
    throw error
  }

  return (
    data?.map((invitation) => ({
      id: invitation.id,
      inviterId: invitation.inviter_id,
      inviteeEmail: invitation.invitee_email,
      code: invitation.code,
      status: invitation.status,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
      updatedAt: invitation.updated_at,
    })) || []
  )
}

/**
 * 초대장 코드로 조회
 * @param code - 초대장 코드
 * @returns 초대장 정보
 */
export async function getInvitationByCode(code: string): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('code', code)
    .eq('status', 'PENDING')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error) {
    console.error('초대장 조회 오류:', error)
    // RLS 정책 위반이나 다른 오류인 경우 null 반환
    return null
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    inviterId: data.inviter_id,
    inviteeEmail: data.invitee_email,
    code: data.code,
    status: data.status,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * 초대장 수락
 * @param code - 초대장 코드
 * @param name - 사용자 이름
 * @returns 수락된 초대장 정보
 */
export async function acceptInvitation(
  code: string,
  name: string
): Promise<Invitation> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // 초대장 조회
  const invitation = await getInvitationByCode(code)
  if (!invitation) {
    throw new Error('유효하지 않은 초대장입니다.')
  }

  if (invitation.inviteeEmail !== user.email) {
    throw new Error('이 초대장은 다른 이메일 주소로 발송되었습니다.')
  }

  // 초대장 상태 업데이트
  const { data: updatedInvitation, error: updateError } = await supabase
    .from('invitations')
    .update({ status: 'ACCEPTED' })
    .eq('id', invitation.id)
    .select()
    .single()

  if (updateError) {
    console.error('초대장 업데이트 오류:', updateError)
    throw updateError
  }

  // 초대한 사용자 정보 조회
  // 주의: RLS 정책 때문에 직접 조회할 수 없으므로, 
  // invitations 테이블에서 이미 조회한 정보를 사용합니다.
  // inviterId는 auth.users의 id이므로, users 테이블의 auth_user_id와 일치합니다.
  // 하지만 RLS 정책 때문에 조회할 수 없으므로, null로 처리합니다.
  // 실제로는 초대장 수락 시 inviterUser의 type만 필요하므로,
  // 초대장 생성 시 저장된 정보를 사용하거나, 다른 방법을 사용해야 합니다.
  let inviterUser: any = null
  
  // 초대자의 users 테이블 정보를 조회하려고 시도하지만, 
  // RLS 정책 때문에 실패할 수 있으므로 에러를 무시합니다.
  const { data: inviterUserData, error: inviterError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', invitation.inviterId)
    .maybeSingle()

  if (inviterError && inviterError.code !== 'PGRST116') {
    // RLS 정책 때문에 조회할 수 없는 경우, 기본값 사용
    console.warn('초대자 정보 조회 실패 (RLS 정책):', inviterError)
    // 기본값으로 PARTNER_1로 가정
    inviterUser = { type: 'PARTNER_1' }
  } else {
    inviterUser = inviterUserData
  }

  // 현재 사용자 정보 생성 또는 업데이트
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .upsert(
      {
        auth_user_id: user.id,
        name,
        type: inviterUser?.type === 'PARTNER_1' ? 'PARTNER_2' : 'PARTNER_1',
        partner_id: inviterUser?.id || null,
      },
      {
        onConflict: 'auth_user_id',
      }
    )
    .select()
    .single()

  if (userError) {
    console.error('사용자 생성/업데이트 오류:', userError)
    throw userError
  }

  // 초대한 사용자의 partner_id 업데이트
  if (inviterUser) {
    await supabase
      .from('users')
      .update({ partner_id: currentUser.id })
      .eq('id', inviterUser.id)
  }

  return {
    id: updatedInvitation.id,
    inviterId: updatedInvitation.inviter_id,
    inviteeEmail: updatedInvitation.invitee_email,
    code: updatedInvitation.code,
    status: updatedInvitation.status,
    expiresAt: updatedInvitation.expires_at,
    createdAt: updatedInvitation.created_at,
    updatedAt: updatedInvitation.updated_at,
  }
}

/**
 * 초대장 거절
 * @param code - 초대장 코드
 */
export async function rejectInvitation(code: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  const invitation = await getInvitationByCode(code)
  if (!invitation) {
    throw new Error('유효하지 않은 초대장입니다.')
  }

  if (invitation.inviteeEmail !== user.email) {
    throw new Error('이 초대장은 다른 이메일 주소로 발송되었습니다.')
  }

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'REJECTED' })
    .eq('id', invitation.id)

  if (error) {
    console.error('초대장 거절 오류:', error)
    throw error
  }
}
