import { supabase } from '../lib/supabase'
import { Goal } from '../types'

/**
 * 공동 목표 조회
 * @returns 목표 목록 (현재 사용자와 파트너의 데이터만, 또는 공동 목표)
 */
export async function getGoals(): Promise<Goal[]> {
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

  // 필터링할 user_id 목록 (현재 사용자 + 파트너 + null(공동 목표))
  const allowedUserIds: (string | null)[] = [currentUserData.id, null]
  if (currentUserData.partner_id) {
    allowedUserIds.push(currentUserData.partner_id)
  }

  // user_id가 현재 사용자 또는 파트너와 일치하거나, null(공동 목표)인 경우만 조회
  const orConditions: string[] = []
  
  // user_id가 allowedUserIds에 포함된 경우
  const userIdsOnly = allowedUserIds.filter((id): id is string => id !== null)
  if (userIdsOnly.length > 0) {
    orConditions.push(`user_id.in.(${userIdsOnly.join(',')})`)
  }
  
  // user_id가 null인 경우 (공동 목표)
  orConditions.push('user_id.is.null')

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .or(orConditions.join(','))
    .order('created_at', { ascending: false })

  if (error) {
    console.error('목표 조회 오류:', error)
    throw error
  }

  return (
    data?.map((goal) => ({
      id: goal.id,
      userId: goal.user_id || undefined,
      title: goal.title,
      targetAmount: Number(goal.target_amount),
      currentAmount: Number(goal.current_amount),
      deadline: goal.deadline,
      memo: goal.memo,
    })) || []
  )
}

/**
 * 공동 목표 생성
 * @param goal - 생성할 목표 정보
 * @returns 생성된 목표 정보
 */
export async function createGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: goal.userId || null,
      title: goal.title,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      deadline: goal.deadline,
      memo: goal.memo,
    })
    .select()
    .single()

  if (error) {
    console.error('목표 생성 오류:', error)
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id || undefined,
    title: data.title,
    targetAmount: Number(data.target_amount),
    currentAmount: Number(data.current_amount),
    deadline: data.deadline,
    memo: data.memo,
  }
}

/**
 * 공동 목표 수정
 * @param id - 목표 ID
 * @param updates - 수정할 정보
 * @returns 수정된 목표 정보
 */
export async function updateGoal(id: string, updates: Partial<Omit<Goal, 'id'>>): Promise<Goal> {
  const updateData: Record<string, unknown> = {}
  if (updates.userId !== undefined) updateData.user_id = updates.userId || null
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount
  if (updates.currentAmount !== undefined) updateData.current_amount = updates.currentAmount
  if (updates.deadline !== undefined) updateData.deadline = updates.deadline
  if (updates.memo !== undefined) updateData.memo = updates.memo

  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('목표 수정 오류:', error)
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id || undefined,
    title: data.title,
    targetAmount: Number(data.target_amount),
    currentAmount: Number(data.current_amount),
    deadline: data.deadline,
    memo: data.memo,
  }
}

/**
 * 공동 목표 삭제
 * @param id - 목표 ID
 */
export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id)

  if (error) {
    console.error('목표 삭제 오류:', error)
    throw error
  }
}
