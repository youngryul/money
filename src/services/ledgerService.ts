import { supabase } from '../lib/supabase'
import { LedgerTransaction } from '../types'

/**
 * 가계부 거래 내역 조회
 * @param startDate - 시작 날짜 (선택사항)
 * @param endDate - 종료 날짜 (선택사항)
 * @param userId - 사용자 ID (선택사항)
 * @returns 거래 내역 목록
 */
export async function getLedgerTransactions(
  startDate?: string,
  endDate?: string,
  userId?: string
): Promise<LedgerTransaction[]> {
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

  // user_id가 현재 사용자 또는 파트너와 일치하거나, null(공동 지출)인 경우만 조회
  // Supabase의 .or() 구문 형식: 'column.operator.value,column.operator.value'
  const orConditions: string[] = []
  
  // user_id가 allowedUserIds에 포함된 경우
  if (allowedUserIds.length > 0) {
    orConditions.push(`user_id.in.(${allowedUserIds.join(',')})`)
  }
  
  // user_id가 null인 경우 (공동 지출)
  orConditions.push('user_id.is.null')

  let query = supabase
    .from('ledger_transactions')
    .select('*')
    .or(orConditions.join(','))
    .order('date', { ascending: false })

  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }
  // userId 파라미터가 있고 allowedUserIds에 포함된 경우만 추가 필터링
  if (userId && allowedUserIds.includes(userId)) {
    query = query.eq('user_id', userId)
  } else if (userId === null || userId === '') {
    // 공동 지출만 조회하는 경우
    query = query.is('user_id', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('가계부 거래 내역 조회 오류:', error)
    throw error
  }

  return (
    data?.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      date: transaction.date,
      category: transaction.category,
      memo: transaction.memo,
      userId: transaction.user_id,
    })) || []
  )
}

/**
 * 가계부 거래 내역 생성
 * @param transaction - 생성할 거래 내역
 * @returns 생성된 거래 내역
 */
export async function createLedgerTransaction(
  transaction: Omit<LedgerTransaction, 'id'>
): Promise<LedgerTransaction> {
  const { data, error } = await supabase
    .from('ledger_transactions')
    .insert({
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      category: transaction.category,
      memo: transaction.memo,
      user_id: transaction.userId,
    })
    .select()
    .single()

  if (error) {
    console.error('가계부 거래 내역 생성 오류:', error)
    throw error
  }

  return {
    id: data.id,
    type: data.type,
    amount: Number(data.amount),
    date: data.date,
    category: data.category,
    memo: data.memo,
    userId: data.user_id,
  }
}

/**
 * 가계부 거래 내역 수정
 * @param id - 거래 내역 ID
 * @param updates - 수정할 정보
 * @returns 수정된 거래 내역
 */
export async function updateLedgerTransaction(
  id: string,
  updates: Partial<Omit<LedgerTransaction, 'id'>>
): Promise<LedgerTransaction> {
  const updateData: Record<string, unknown> = {}
  if (updates.type !== undefined) updateData.type = updates.type
  if (updates.amount !== undefined) updateData.amount = updates.amount
  if (updates.date !== undefined) updateData.date = updates.date
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.memo !== undefined) updateData.memo = updates.memo
  if (updates.userId !== undefined) updateData.user_id = updates.userId

  const { data, error } = await supabase
    .from('ledger_transactions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('가계부 거래 내역 수정 오류:', error)
    throw error
  }

  return {
    id: data.id,
    type: data.type,
    amount: Number(data.amount),
    date: data.date,
    category: data.category,
    memo: data.memo,
    userId: data.user_id,
  }
}

/**
 * 가계부 거래 내역 삭제
 * @param id - 거래 내역 ID
 */
export async function deleteLedgerTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('ledger_transactions').delete().eq('id', id)

  if (error) {
    console.error('가계부 거래 내역 삭제 오류:', error)
    throw error
  }
}
