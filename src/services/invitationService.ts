import { supabase } from '../lib/supabase'
import { Invitation } from '../types'
import { createUser, getUsers, updateUser } from './userService'
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
  const existingUsers = await getUsers()
  let inviterUser = existingUsers.find((u) => u.authUserId === user.id)
  
  if (!inviterUser) {
    // 사용자 정보가 없으면 생성
    inviterUser = await createUser({
      authUserId: user.id,
      name: inviterName,
      type: USER_TYPE.PARTNER_1,
    })
  } else {
    // 기존 사용자 정보 업데이트
    inviterUser = await updateUser(inviterUser.id, {
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
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // 초대장을 찾을 수 없음
      return null
    }
    console.error('초대장 조회 오류:', error)
    throw error
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
  const { data: inviterUser, error: inviterError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', invitation.inviterId)
    .single()

  if (inviterError && inviterError.code !== 'PGRST116') {
    console.error('초대자 정보 조회 오류:', inviterError)
    throw inviterError
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
