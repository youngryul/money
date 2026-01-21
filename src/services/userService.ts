import { supabase } from '../lib/supabase'
import { User } from '../types'

/**
 * 사용자 정보 조회
 * RLS 정책에 의해 자신의 정보와 파트너 정보만 반환됩니다.
 * @returns 사용자 목록
 */
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true })

  if (error) {
    console.error('사용자 조회 오류:', error)
    throw error
  }

  return (
    data?.map((user) => ({
      id: user.id,
      authUserId: user.auth_user_id,
      name: user.name,
      type: user.type,
      character: user.character,
      partnerId: user.partner_id,
    })) || []
  )
}

/**
 * 현재 로그인한 사용자 정보 조회
 * @returns 현재 사용자 정보 또는 null
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('사용자 조회 오류:', error)
    throw error
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    authUserId: data.auth_user_id,
    name: data.name,
    type: data.type,
    character: data.character,
    partnerId: data.partner_id,
  }
}

/**
 * 사용자 정보 생성
 * @param user - 생성할 사용자 정보
 * @returns 생성된 사용자 정보
 */
export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const insertData: Record<string, unknown> = {
    name: user.name,
    type: user.type,
    character: user.character && user.character.trim() !== '' ? user.character.trim() : null,
  }
  
  if (user.authUserId) {
    insertData.auth_user_id = user.authUserId
  }
  
  if (user.partnerId) {
    insertData.partner_id = user.partnerId
  }

  // INSERT만 먼저 실행
  const { error: insertError } = await supabase
    .from('users')
    .insert(insertData)

  if (insertError) {
    console.error('사용자 생성 오류:', insertError)
    throw insertError
  }

  // INSERT 후 별도로 SELECT (RLS 정책에 의해 자신의 정보만 조회됨)
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    throw new Error('로그인이 필요합니다.')
  }

  const { data, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .single()

  if (selectError) {
    console.error('사용자 조회 오류:', selectError)
    throw selectError
  }

  if (!data) {
    throw new Error('사용자 정보를 찾을 수 없습니다.')
  }

  return {
    id: data.id,
    authUserId: data.auth_user_id,
    name: data.name,
    type: data.type,
    character: data.character,
    partnerId: data.partner_id,
  }
}

/**
 * 사용자 정보 수정
 * @param id - 사용자 ID
 * @param updates - 수정할 정보
 * @returns 수정된 사용자 정보
 */
export async function updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User> {
  const updateData: Record<string, unknown> = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.type !== undefined) updateData.type = updates.type
  if (updates.character !== undefined) {
    updateData.character = updates.character && updates.character.trim() !== '' ? updates.character.trim() : null
  }
  if (updates.partnerId !== undefined) updateData.partner_id = updates.partnerId

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('사용자 수정 오류:', error)
    throw error
  }

  return {
    id: data.id,
    authUserId: data.auth_user_id,
    name: data.name,
    type: data.type,
    character: data.character,
    partnerId: data.partner_id,
  }
}

/**
 * 사용자 정보 삭제
 * @param id - 사용자 ID
 */
export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id)

  if (error) {
    console.error('사용자 삭제 오류:', error)
    throw error
  }
}

/**
 * 파트너 해지
 * 양쪽 사용자의 partner_id를 NULL로 설정
 * @param userId - 현재 사용자 ID
 */
export async function removePartner(userId: string): Promise<void> {
  // 현재 사용자 정보 조회
  const currentUser = await getUsers().then((users) => users.find((u) => u.id === userId))
  
  if (!currentUser) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  // 양쪽 사용자의 partner_id를 NULL로 설정
  const updates: Promise<User>[] = []
  
  // 현재 사용자의 partner_id 제거
  if (currentUser.partnerId) {
    updates.push(updateUser(currentUser.id, { partnerId: null }))
    
    // 파트너의 partner_id도 제거
    const partner = await getUsers().then((users) => users.find((u) => u.id === currentUser.partnerId))
    if (partner) {
      updates.push(updateUser(partner.id, { partnerId: null }))
    }
  }

  await Promise.all(updates)
}