import { supabase } from '../lib/supabase'
import { Investment } from '../types'

/**
 * 투자 정보 조회
 * @returns 투자 목록
 */
export async function getInvestments(): Promise<Investment[]> {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('투자 정보 조회 오류:', error)
    throw error
  }

  return (
    data?.map((investment) => ({
      id: investment.id,
      name: investment.name,
      type: investment.type,
      amount: Number(investment.amount),
      date: investment.date,
      currentValue: investment.current_value ? Number(investment.current_value) : undefined,
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
      name: investment.name,
      type: investment.type,
      amount: investment.amount,
      date: investment.date,
      current_value: investment.currentValue,
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
    name: data.name,
    type: data.type,
    amount: Number(data.amount),
    date: data.date,
    currentValue: data.current_value ? Number(data.current_value) : undefined,
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
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.type !== undefined) updateData.type = updates.type
  if (updates.amount !== undefined) updateData.amount = updates.amount
  if (updates.date !== undefined) updateData.date = updates.date
  if (updates.currentValue !== undefined) updateData.current_value = updates.currentValue
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
    name: data.name,
    type: data.type,
    amount: Number(data.amount),
    date: data.date,
    currentValue: data.current_value ? Number(data.current_value) : undefined,
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
