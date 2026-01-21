import { supabase } from '../lib/supabase'
import { Savings } from '../types'

/**
 * 적금/비상금 정보 조회
 * @param type - 타입 필터 (선택사항)
 * @returns 적금/비상금 목록
 */
export async function getSavings(
  type?: 'EMERGENCY_FUND' | 'CONDOLENCE' | 'TRAVEL_SAVINGS' | 'HOUSE_SAVINGS'
): Promise<Savings[]> {
  let query = supabase.from('savings').select('*').order('date', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('적금/비상금 조회 오류:', error)
    throw error
  }

  return (
    data?.map((saving) => ({
      id: saving.id,
      type: saving.type,
      amount: Number(saving.amount),
      date: saving.date,
      memo: saving.memo,
    })) || []
  )
}

/**
 * 적금/비상금 정보 생성
 * @param saving - 생성할 적금/비상금 정보
 * @returns 생성된 적금/비상금 정보
 */
export async function createSavings(saving: Omit<Savings, 'id'>): Promise<Savings> {
  const { data, error } = await supabase
    .from('savings')
    .insert({
      type: saving.type,
      amount: saving.amount,
      date: saving.date,
      memo: saving.memo,
    })
    .select()
    .single()

  if (error) {
    console.error('적금/비상금 생성 오류:', error)
    throw error
  }

  return {
    id: data.id,
    type: data.type,
    amount: Number(data.amount),
    date: data.date,
    memo: data.memo,
  }
}

/**
 * 적금/비상금 정보 수정
 * @param id - 적금/비상금 ID
 * @param updates - 수정할 정보
 * @returns 수정된 적금/비상금 정보
 */
export async function updateSavings(id: string, updates: Partial<Omit<Savings, 'id'>>): Promise<Savings> {
  const updateData: Record<string, unknown> = {}
  if (updates.type !== undefined) updateData.type = updates.type
  if (updates.amount !== undefined) updateData.amount = updates.amount
  if (updates.date !== undefined) updateData.date = updates.date
  if (updates.memo !== undefined) updateData.memo = updates.memo

  const { data, error } = await supabase
    .from('savings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('적금/비상금 수정 오류:', error)
    throw error
  }

  return {
    id: data.id,
    type: data.type,
    amount: Number(data.amount),
    date: data.date,
    memo: data.memo,
  }
}

/**
 * 적금/비상금 정보 삭제
 * @param id - 적금/비상금 ID
 */
export async function deleteSavings(id: string): Promise<void> {
  const { error } = await supabase.from('savings').delete().eq('id', id)

  if (error) {
    console.error('적금/비상금 삭제 오류:', error)
    throw error
  }
}
