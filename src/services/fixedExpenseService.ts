import { supabase } from '../lib/supabase'
import { FixedExpense } from '../types'

/**
 * 고정비 정보 조회
 * @returns 고정비 목록 (현재 사용자와 파트너의 데이터만)
 */
export async function getFixedExpenses(): Promise<FixedExpense[]> {
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
    .from('fixed_expenses')
    .select('*')
    .in('user_id', allowedUserIds)
    .order('day_of_month', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('고정비 조회 오류:', error)
    throw error
  }

  return (
    data?.map((expense) => ({
      id: expense.id,
      userId: expense.user_id,
      name: expense.name,
      amount: Number(expense.amount),
      dayOfMonth: expense.day_of_month,
      memo: expense.memo,
    })) || []
  )
}

/**
 * 고정비 정보 생성
 * @param expense - 생성할 고정비 정보
 * @returns 생성된 고정비 정보
 */
export async function createFixedExpense(expense: Omit<FixedExpense, 'id'>): Promise<FixedExpense> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .insert({
      user_id: expense.userId,
      name: expense.name,
      amount: expense.amount,
      day_of_month: expense.dayOfMonth,
      memo: expense.memo,
    })
    .select()
    .single()

  if (error) {
    console.error('고정비 생성 오류:', error)
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    amount: Number(data.amount),
    dayOfMonth: data.day_of_month,
    memo: data.memo,
  }
}

/**
 * 고정비 정보 수정
 * @param id - 고정비 ID
 * @param updates - 수정할 정보
 * @returns 수정된 고정비 정보
 */
export async function updateFixedExpense(
  id: string,
  updates: Partial<Omit<FixedExpense, 'id'>>
): Promise<FixedExpense> {
  const updateData: Record<string, unknown> = {}
  if (updates.userId !== undefined) updateData.user_id = updates.userId
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.amount !== undefined) updateData.amount = updates.amount
  if (updates.dayOfMonth !== undefined) updateData.day_of_month = updates.dayOfMonth
  if (updates.memo !== undefined) updateData.memo = updates.memo

  const { data, error } = await supabase
    .from('fixed_expenses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('고정비 수정 오류:', error)
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    amount: Number(data.amount),
    dayOfMonth: data.day_of_month,
    memo: data.memo,
  }
}

/**
 * 고정비 정보 삭제
 * @param id - 고정비 ID
 */
export async function deleteFixedExpense(id: string): Promise<void> {
  const { error } = await supabase.from('fixed_expenses').delete().eq('id', id)

  if (error) {
    console.error('고정비 삭제 오류:', error)
    throw error
  }
}
