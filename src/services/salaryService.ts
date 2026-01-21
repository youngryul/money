import { supabase } from '../lib/supabase'
import { Salary } from '../types'

/**
 * 수입 정보 조회
 * @returns 수입 목록 (현재 사용자와 파트너의 데이터만)
 */
export async function getSalaries(): Promise<Salary[]> {
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
    .from('salaries')
    .select('*')
    .in('user_id', allowedUserIds)
    .order('date', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('수입 조회 오류:', error)
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
 * 수입 정보 생성
 * @param salary - 생성할 수입 정보
 * @returns 생성된 수입 정보
 */
export async function createSalary(salary: Omit<Salary, 'id'>): Promise<Salary> {
  // 데이터 검증
  if (!salary.userId || salary.userId.trim() === '') {
    throw new Error('사용자 ID가 필요합니다.')
  }
  if (!salary.amount || salary.amount <= 0) {
    throw new Error('수입액은 0보다 큰 값이어야 합니다.')
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
    console.error('수입 생성 오류:', error)
    const errorMessage = error.message || JSON.stringify(error)
    throw new Error(`수입 생성 실패: ${errorMessage}`)
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
 * 수입 정보 수정
 * @param id - 수입 ID
 * @param updates - 수정할 정보
 * @returns 수정된 수입 정보
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
    console.error('수입 수정 오류:', error)
    const errorMessage = error.message || JSON.stringify(error)
    throw new Error(`수입 수정 실패: ${errorMessage}`)
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
 * 수입 정보 삭제
 * @param id - 수입 ID
 */
export async function deleteSalary(id: string): Promise<void> {
  const { error } = await supabase.from('salaries').delete().eq('id', id)

  if (error) {
    console.error('수입 삭제 오류:', error)
    throw error
  }
}
