import { supabase } from '../lib/supabase'

/**
 * 투자금 스냅샷 정보
 */
export interface InvestmentSnapshot {
  id: string
  userId: string
  snapshotDate: string
  investmentAmount: number
  kisTotalValue: number
  createdAt: string
}

/**
 * 투자금 스냅샷 저장
 * @param investmentAmount - 투자금액
 * @param kisTotalValue - 한국투자증권 총 평가금액 (선택)
 */
export async function saveInvestmentSnapshot(
  investmentAmount: number,
  kisTotalValue?: number
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

  // Edge Function을 통해 저장
  const { error } = await supabase.functions.invoke('kis-save-snapshot', {
    body: {
      userId: currentUserData.id,
      investmentAmount,
      kisTotalValue: kisTotalValue || 0,
    },
  })

  if (error) {
    console.error('투자금 스냅샷 저장 오류:', error)
    throw error
  }
}

/**
 * 특정 월의 월말 투자금 조회
 * @param year - 연도
 * @param month - 월 (1-12)
 * @returns 월말 투자금액
 */
export async function getMonthEndInvestment(
  year: number,
  month: number
): Promise<number> {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return 0
  }

  // 현재 사용자 정보 조회
  const { data: currentUserData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (!currentUserData) {
    return 0
  }

  // 해당 월의 마지막 날짜 계산
  const lastDay = new Date(year, month, 0).getDate()
  const monthEndDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // 해당 월의 마지막 스냅샷 조회 (월말 또는 그 이전의 가장 최근 스냅샷)
  const { data, error } = await supabase
    .from('investment_snapshots')
    .select('investment_amount, kis_total_value')
    .eq('user_id', currentUserData.id)
    .lte('snapshot_date', monthEndDate)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('투자금 스냅샷 조회 오류:', error)
    return 0
  }

  if (!data) {
    return 0
  }

  // kis_total_value가 있으면 우선 사용, 없으면 investment_amount 사용
  return data.kis_total_value > 0 ? data.kis_total_value : data.investment_amount
}

/**
 * 모든 투자금 스냅샷 조회
 */
export async function getAllInvestmentSnapshots(): Promise<InvestmentSnapshot[]> {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return []
  }

  // 현재 사용자 정보 조회
  const { data: currentUserData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (!currentUserData) {
    return []
  }

  const { data, error } = await supabase
    .from('investment_snapshots')
    .select('*')
    .eq('user_id', currentUserData.id)
    .order('snapshot_date', { ascending: false })

  if (error) {
    console.error('투자금 스냅샷 조회 오류:', error)
    throw error
  }

  return (
    data?.map((snapshot) => ({
      id: snapshot.id,
      userId: snapshot.user_id,
      snapshotDate: snapshot.snapshot_date,
      investmentAmount: Number(snapshot.investment_amount),
      kisTotalValue: Number(snapshot.kis_total_value || 0),
      createdAt: snapshot.created_at,
    })) || []
  )
}
