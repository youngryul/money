import { supabase } from '../lib/supabase'
import { LivingExpense } from '../types'

/**
 * 생활비 정보 조회
 * @param startDate - 시작 날짜 (선택사항)
 * @param endDate - 종료 날짜 (선택사항)
 * @returns 생활비 목록
 */
export async function getLivingExpenses(startDate?: string, endDate?: string): Promise<LivingExpense[]> {
  let query = supabase.from('living_expenses').select('*').order('date', { ascending: false })

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
