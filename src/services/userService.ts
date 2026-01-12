import { supabase } from '../lib/supabase'
import { User } from '../types'

/**
 * 사용자 정보 조회
 * @returns 사용자 목록
 */
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true })

  if (error) {
    console.error('사용자 조회 오류:', error)
    throw error
  }

  return (
    data?.map((user) => ({
      id: user.id,
      name: user.name,
      type: user.type,
      character: user.character,
    })) || []
  )
}

/**
 * 사용자 정보 생성
 * @param user - 생성할 사용자 정보
 * @returns 생성된 사용자 정보
 */
export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      name: user.name,
      type: user.type,
      character: user.character,
    })
    .select()
    .single()

  if (error) {
    console.error('사용자 생성 오류:', error)
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    character: data.character,
  }
}

/**
 * 사용자 정보 수정
 * @param id - 사용자 ID
 * @param updates - 수정할 정보
 * @returns 수정된 사용자 정보
 */
export async function updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({
      name: updates.name,
      type: updates.type,
      character: updates.character,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('사용자 수정 오류:', error)
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    character: data.character,
  }
}

/**
 * 사용자 정보 삭제
 * @param id - 사용자 ID
 */
export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id)

  if (error) {
    console.error('사용자 삭제 오류:', error)
    throw error
  }
}
