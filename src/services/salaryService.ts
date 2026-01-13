import { supabase } from '../lib/supabase'
import { Salary } from '../types'

/**
 * 월급 정보 조회
 * @param userId - 사용자 ID (선택사항)
 * @returns 월급 목록
 */
export async function getSalaries(userId?: string): Promise<Salary[]> {
  let query = supabase.from('salaries').select('*').order('date', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('월급 조회 오류:', error)
    throw error
  }

  return (
    data?.map((salary) => ({
      id: salary.id,
      userId: salary.user_id,
      amount: Number(salary.amount),
      date: salary.date,
      memo: salary.memo,
    })) || []
  )
}

/**
 * 월급 정보 생성
 * @param salary - 생성할 월급 정보
 * @returns 생성된 월급 정보
 */
export async function createSalary(salary: Omit<Salary, 'id'>): Promise<Salary> {
  // 데이터 검증
  if (!salary.userId || salary.userId.trim() === '') {
    throw new Error('사용자 ID가 필요합니다.')
  }
  if (!salary.amount || salary.amount <= 0) {
    throw new Error('월급액은 0보다 큰 값이어야 합니다.')
  }
  if (!salary.date) {
    throw new Error('날짜가 필요합니다.')
  }

  const { data, error } = await supabase
    .from('salaries')
    .insert({
      user_id: salary.userId,
      amount: salary.amount,
      date: salary.date,
      memo: salary.memo && salary.memo.trim() !== '' ? salary.memo.trim() : null,
    })
    .select()
    .single()

  if (error) {
    console.error('월급 생성 오류:', error)
    const errorMessage = error.message || JSON.stringify(error)
    throw new Error(`월급 생성 실패: ${errorMessage}`)
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
 * 월급 정보 수정
 * @param id - 월급 ID
 * @param updates - 수정할 정보
 * @returns 수정된 월급 정보
 */
export async function updateSalary(id: string, updates: Partial<Omit<Salary, 'id'>>): Promise<Salary> {
  const updateData: Record<string, unknown> = {}
  if (updates.userId !== undefined) updateData.user_id = updates.userId
  if (updates.amount !== undefined) updateData.amount = updates.amount
  if (updates.date !== undefined) updateData.date = updates.date
  if (updates.memo !== undefined) {
    updateData.memo = updates.memo && updates.memo.trim() !== '' ? updates.memo.trim() : null
  }

  const { data, error } = await supabase
    .from('salaries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('월급 수정 오류:', error)
    const errorMessage = error.message || JSON.stringify(error)
    throw new Error(`월급 수정 실패: ${errorMessage}`)
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
 * 월급 정보 삭제
 * @param id - 월급 ID
 */
export async function deleteSalary(id: string): Promise<void> {
  const { error } = await supabase.from('salaries').delete().eq('id', id)

  if (error) {
    console.error('월급 삭제 오류:', error)
    throw error
  }
}
