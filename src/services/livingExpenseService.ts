import { supabase } from '../lib/supabase'
import { LivingExpense } from '../types'

/**
 * 생활비 정보 조회
 * @param startDate - 시작 날짜 (선택사항)
 * @param endDate - 종료 날짜 (선택사항)
 * @returns 생활비 목록 (현재 사용자와 파트너의 데이터만)
 */
export async function getLivingExpenses(startDate?: string, endDate?: string): Promise<LivingExpense[]> {
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
    .from('living_expenses')
    .select('*')
    .in('user_id', allowedUserIds)
    .order('date', { ascending: false })

  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('생활비 조회 오류:', error)
    throw error
  }

  return (
    data?.map((expense) => ({
      id: expense.id,
      userId: expense.user_id,
      amount: Number(expense.amount),
      date: expense.date,
      category: expense.category,
      memo: expense.memo,
    })) || []
  )
}

/**
 * 생활비 정보 생성
 * @param expense - 생성할 생활비 정보
 * @returns 생성된 생활비 정보
 */
export async function createLivingExpense(expense: Omit<LivingExpense, 'id'>): Promise<LivingExpense> {
  const { data, error } = await supabase
    .from('living_expenses')
    .insert({
      user_id: expense.userId,
      amount: expense.amount,
      date: expense.date,
      category: expense.category,
      memo: expense.memo,
    })
    .select()
    .single()

  if (error) {
    console.error('생활비 생성 오류:', error)
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    amount: Number(data.amount),
    date: data.date,
    category: data.category,
    memo: data.memo,
  }
}

/**
 * 생활비 정보 수정
 * @param id - 생활비 ID
 * @param updates - 수정할 정보
 * @returns 수정된 생활비 정보
 */
export async function updateLivingExpense(
  id: string,
  updates: Partial<Omit<LivingExpense, 'id'>>
): Promise<LivingExpense> {
  const updateData: Record<string, unknown> = {}
  if (updates.userId !== undefined) updateData.user_id = updates.userId
  if (updates.amount !== undefined) updateData.amount = updates.amount
  if (updates.date !== undefined) updateData.date = updates.date
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.memo !== undefined) updateData.memo = updates.memo

  const { data, error } = await supabase
    .from('living_expenses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('생활비 수정 오류:', error)
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    amount: Number(data.amount),
    date: data.date,
    category: data.category,
    memo: data.memo,
  }
}

/**
 * 생활비 정보 삭제
 * @param id - 생활비 ID
 */
export async function deleteLivingExpense(id: string): Promise<void> {
  const { error } = await supabase.from('living_expenses').delete().eq('id', id)

  if (error) {
    console.error('생활비 삭제 오류:', error)
    throw error
  }
}
