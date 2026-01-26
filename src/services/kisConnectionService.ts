import { supabase } from '../lib/supabase'

/**
 * 한국투자증권 연동 정보
 */
export interface KisConnection {
  id: string
  userId: string
  appKey: string
  appSecret: string
  accountNumber: string
  isVirtual: boolean
  accessToken?: string
  tokenExpiresAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * 한국투자증권 연동 정보 조회
 * @returns 현재 사용자의 KIS 연동 정보
 */
export async function getKisConnection(): Promise<KisConnection | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return null
  }

  // 현재 사용자 정보 조회
  const { data: currentUserData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (!currentUserData) {
    return null
  }

  const { data, error } = await supabase
    .from('kis_connections')
    .select('*')
    .eq('user_id', currentUserData.id)
    .maybeSingle()

  if (error) {
    console.error('KIS 연동 정보 조회 오류:', error)
    throw error
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    appKey: data.app_key,
    appSecret: data.app_secret,
    accountNumber: data.account_number,
    isVirtual: data.is_virtual,
    accessToken: data.access_token || undefined,
    tokenExpiresAt: data.token_expires_at || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * 한국투자증권 연동 정보 저장
 * @param connection - 연동 정보
 * @returns 저장된 연동 정보
 */
export async function saveKisConnection(connection: {
  appKey: string
  appSecret: string
  accountNumber: string
  isVirtual: boolean
}): Promise<KisConnection> {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    throw new Error('로그인이 필요합니다.')
  }

  // 현재 사용자 정보 조회
  const { data: currentUserData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (!currentUserData) {
    throw new Error('사용자 정보를 찾을 수 없습니다.')
  }

  // 기존 연동 정보 확인
  const existing = await getKisConnection()

  if (existing) {
    // 업데이트
    const { data, error } = await supabase
      .from('kis_connections')
      .update({
        app_key: connection.appKey,
        app_secret: connection.appSecret,
        account_number: connection.accountNumber,
        is_virtual: connection.isVirtual,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', currentUserData.id)
      .select()
      .single()

    if (error) {
      console.error('KIS 연동 정보 업데이트 오류:', error)
      throw error
    }

    return {
      id: data.id,
      userId: data.user_id,
      appKey: data.app_key,
      appSecret: data.app_secret,
      accountNumber: data.account_number,
      isVirtual: data.is_virtual,
      accessToken: data.access_token || undefined,
      tokenExpiresAt: data.token_expires_at || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } else {
    // 새로 생성
    const { data, error } = await supabase
      .from('kis_connections')
      .insert({
        user_id: currentUserData.id,
        app_key: connection.appKey,
        app_secret: connection.appSecret,
        account_number: connection.accountNumber,
        is_virtual: connection.isVirtual,
      })
      .select()
      .single()

    if (error) {
      console.error('KIS 연동 정보 저장 오류:', error)
      throw error
    }

    return {
      id: data.id,
      userId: data.user_id,
      appKey: data.app_key,
      appSecret: data.app_secret,
      accountNumber: data.account_number,
      isVirtual: data.is_virtual,
      accessToken: data.access_token || undefined,
      tokenExpiresAt: data.token_expires_at || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }
}

/**
 * 한국투자증권 토큰 저장
 * @param accessToken - 액세스 토큰
 * @param expiresIn - 만료 시간 (초 단위)
 */
export async function saveKisToken(
  accessToken: string,
  expiresIn: number
): Promise<void> {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    throw new Error('로그인이 필요합니다.')
  }

  // 현재 사용자 정보 조회
  const { data: currentUserData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (!currentUserData) {
    throw new Error('사용자 정보를 찾을 수 없습니다.')
  }

  // 만료 시간 계산 (현재 시간 + expiresIn 초)
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

  const { error } = await supabase
    .from('kis_connections')
    .update({
      access_token: accessToken,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', currentUserData.id)

  if (error) {
    console.error('KIS 토큰 저장 오류:', error)
    throw error
  }
}

/**
 * 한국투자증권 연동 정보 삭제
 */
export async function deleteKisConnection(): Promise<void> {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    throw new Error('로그인이 필요합니다.')
  }

  // 현재 사용자 정보 조회
  const { data: currentUserData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (!currentUserData) {
    throw new Error('사용자 정보를 찾을 수 없습니다.')
  }

  const { error } = await supabase
    .from('kis_connections')
    .delete()
    .eq('user_id', currentUserData.id)

  if (error) {
    console.error('KIS 연동 정보 삭제 오류:', error)
    throw error
  }
}
