import { supabase } from '../lib/supabase'
import { Goal } from '../types'

/**
 * 공동 목표 조회
 * @returns 목표 목록
 */
export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('목표 조회 오류:', error)
    throw error
  }

  return (
    data?.map((goal) => ({
      id: goal.id,
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
