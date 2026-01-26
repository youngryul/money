import { supabase } from '../lib/supabase'
import { Investment } from '../types'

/**
 * 투자 정보 조회
 * @returns 투자 목록 (현재 사용자와 파트너의 데이터만)
 */
export async function getInvestments(): Promise<Investment[]> {
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

  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .in('user_id', allowedUserIds)
    .order('date', { ascending: false })

  if (error) {
    console.error('투자 정보 조회 오류:', error)
    throw error
  }

  return (
    data?.map((investment) => ({
      id: investment.id,
      userId: investment.user_id,
      name: investment.name,
      type: investment.type,
      amount: Number(investment.amount),
      date: investment.date,
      currentValue: investment.current_value ? Number(investment.current_value) : undefined,
      monthlyDeposit: investment.monthly_deposit ? Number(investment.monthly_deposit) : undefined,
      memo: investment.memo,
    })) || []
  )
}

/**
 * 투자 정보 생성
 * @param investment - 생성할 투자 정보
 * @returns 생성된 투자 정보
 */
export async function createInvestment(investment: Omit<Investment, 'id'>): Promise<Investment> {
  const { data, error } = await supabase
    .from('investments')
    .insert({
      user_id: investment.userId,
      name: investment.name,
      type: investment.type,
      amount: investment.amount,
      date: investment.date,
      current_value: investment.currentValue,
      monthly_deposit: investment.monthlyDeposit,
      memo: investment.memo,
    })
    .select()
    .single()

  if (error) {
    console.error('투자 정보 생성 오류:', error)
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    type: data.type,
    amount: Number(data.amount),
    date: data.date,
    currentValue: data.current_value ? Number(data.current_value) : undefined,
    monthlyDeposit: data.monthly_deposit ? Number(data.monthly_deposit) : undefined,
    memo: data.memo,
  }
}

/**
 * 투자 정보 수정
 * @param id - 투자 ID
 * @param updates - 수정할 정보
 * @returns 수정된 투자 정보
 */
export async function updateInvestment(
  id: string,
  updates: Partial<Omit<Investment, 'id'>>
): Promise<Investment> {
  const updateData: Record<string, unknown> = {}
  if (updates.userId !== undefined) updateData.user_id = updates.userId
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.type !== undefined) updateData.type = updates.type
  if (updates.amount !== undefined) updateData.amount = updates.amount
  if (updates.date !== undefined) updateData.date = updates.date
  if (updates.currentValue !== undefined) updateData.current_value = updates.currentValue
  if (updates.monthlyDeposit !== undefined) updateData.monthly_deposit = updates.monthlyDeposit
  if (updates.memo !== undefined) updateData.memo = updates.memo

  const { data, error } = await supabase
    .from('investments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('투자 정보 수정 오류:', error)
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    type: data.type,
    amount: Number(data.amount),
    date: data.date,
    currentValue: data.current_value ? Number(data.current_value) : undefined,
    monthlyDeposit: data.monthly_deposit ? Number(data.monthly_deposit) : undefined,
    memo: data.memo,
  }
}

/**
 * 투자 정보 삭제
 * @param id - 투자 ID
 */
export async function deleteInvestment(id: string): Promise<void> {
  const { error } = await supabase.from('investments').delete().eq('id', id)

  if (error) {
    console.error('투자 정보 삭제 오류:', error)
    throw error
  }
}
