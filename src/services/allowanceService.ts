import { supabase } from '../lib/supabase'
import { Allowance } from '../types'

/**
 * 용돈 정보 조회
 * @returns 용돈 목록 (현재 사용자와 파트너의 데이터만)
 */
export async function getAllowances(): Promise<Allowance[]> {
  // 현재 사용자와 파트너의 user_id 가져오기
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return []
  }

  // 현재 사용자 정보 조회
  const { data: currentUserData } = await supabase
    .from('users')
    .select('id, partner_id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (!currentUserData) {
    return []
  }

  // 필터링할 user_id 목록 (현재 사용자 + 파트너)
  const allowedUserIds: string[] = [currentUserData.id]
  if (currentUserData.partner_id) {
    allowedUserIds.push(currentUserData.partner_id)
  }

  let query = supabase
    .from('allowances')
    .select('*')
    .in('user_id', allowedUserIds)
    .order('date', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('용돈 조회 오류:', error)
    throw error
  }

  return (
    data?.map((allowance) => ({
      id: allowance.id,
      userId: allowance.user_id,
      amount: Number(allowance.amount),
      date: allowance.date,
      memo: allowance.memo,
    })) || []
  )
}

/**
 * 용돈 정보 생성
 * @param allowance - 생성할 용돈 정보
 * @returns 생성된 용돈 정보
 */
export async function createAllowance(allowance: Omit<Allowance, 'id'>): Promise<Allowance> {
  const { data, error } = await supabase
    .from('allowances')
    .insert({
      user_id: allowance.userId,
      amount: allowance.amount,
      date: allowance.date,
      memo: allowance.memo,
    })
    .select()
    .single()

  if (error) {
    console.error('용돈 생성 오류:', error)
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    amount: Number(data.amount),
    date: data.date,
    memo: data.memo,
  }
}

/**
 * 용돈 정보 수정
 * @param id - 용돈 ID
 * @param updates - 수정할 정보
 * @returns 수정된 용돈 정보
 */
export async function updateAllowance(id: string, updates: Partial<Omit<Allowance, 'id'>>): Promise<Allowance> {
  const updateData: Record<string, unknown> = {}
  if (updates.userId !== undefined) updateData.user_id = updates.userId
  if (updates.amount !== undefined) updateData.amount = updates.amount
  if (updates.date !== undefined) updateData.date = updates.date
  if (updates.memo !== undefined) updateData.memo = updates.memo

  const { data, error } = await supabase
    .from('allowances')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('용돈 수정 오류:', error)
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    amount: Number(data.amount),
    date: data.date,
    memo: data.memo,
  }
}

/**
 * 용돈 정보 삭제
 * @param id - 용돈 ID
 */
export async function deleteAllowance(id: string): Promise<void> {
  const { error } = await supabase.from('allowances').delete().eq('id', id)

  if (error) {
    console.error('용돈 삭제 오류:', error)
    throw error
  }
}
