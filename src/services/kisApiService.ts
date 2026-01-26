import { supabase } from '../lib/supabase'
import { getKisConnection, saveKisToken } from './kisConnectionService'

/**
 * 한국투자증권 API 토큰 타입
 */
export interface KisToken {
  access_token: string
  token_type: string
  expires_in: number
  access_token_token_expired: string
}

/**
 * 한국투자증권 계좌 정보
 */
export interface KisAccount {
  accountNumber: string
  accountName: string
  balance: number
  availableBalance: number
}

/**
 * 한국투자증권 보유 종목 정보
 */
export interface KisHolding {
  stockCode: string
  stockName: string
  quantity: number
  averagePrice: number
  currentPrice: number
  totalValue: number
  profitLoss: number
  profitLossPercent: number
}

/**
 * 한국투자증권 API 토큰 발급 (Supabase 저장 및 자동 재사용)
 * @param appKey - 앱키
 * @param appSecret - 앱시크릿
 * @param isVirtual - 모의투자 여부 (true: 모의투자, false: 실거래)
 * @param forceRefresh - 강제로 새 토큰 발급 (기본값: false)
 * @returns 액세스 토큰
 */
export async function getKisAccessToken(
  appKey: string,
  appSecret: string,
  isVirtual: boolean = false,
  forceRefresh: boolean = false
): Promise<KisToken> {
  // Supabase에서 저장된 토큰 확인 (강제 새로고침이 아닌 경우)
  if (!forceRefresh) {
    try {
      const connection = await getKisConnection()
      if (connection && connection.accessToken && connection.tokenExpiresAt) {
        const expiresAt = new Date(connection.tokenExpiresAt).getTime()
        const now = Date.now()
        const bufferTime = 5 * 60 * 1000 // 5분 버퍼

        // 토큰이 아직 유효한지 확인 (만료 5분 전까지)
        if (expiresAt > now + bufferTime) {
          // 유효한 토큰 반환
          const remainingSeconds = Math.floor((expiresAt - now) / 1000)
          return {
            access_token: connection.accessToken,
            token_type: 'Bearer',
            expires_in: remainingSeconds,
            access_token_token_expired: connection.tokenExpiresAt,
          }
        }
      }
    } catch (error) {
      console.warn('저장된 토큰 확인 중 오류 (새 토큰 발급):', error)
    }
  }

  // 새 토큰 발급
  const { data, error } = await supabase.functions.invoke('kis-get-token', {
    body: {
      appKey,
      appSecret,
      isVirtual,
    },
  })

  if (error) {
    console.error('KIS 토큰 발급 오류:', error)
    throw new Error(`토큰 발급 실패: ${error.message}`)
  }

  // 토큰을 Supabase에 저장
  try {
    await saveKisToken(data.access_token, data.expires_in)
  } catch (error) {
    console.warn('토큰 저장 실패 (토큰은 사용 가능):', error)
  }

  return data
}

/**
 * 한국투자증권 계좌 목록 조회
 * @param accessToken - 액세스 토큰
 * @param isVirtual - 모의투자 여부
 * @returns 계좌 목록
 */
export async function getKisAccounts(
  accessToken: string,
  appKey: string,
  appSecret: string,
  isVirtual: boolean = false
): Promise<KisAccount[]> {
  const { data, error } = await supabase.functions.invoke('kis-get-accounts', {
    body: {
      accessToken,
      appKey,
      appSecret,
      isVirtual,
    },
  })

  if (error) {
    console.error('KIS 계좌 조회 오류:', error)
    throw new Error(`계좌 조회 실패: ${error.message}`)
  }

  return data
}

/**
 * 한국투자증권 보유 종목 조회
 * @param accessToken - 액세스 토큰
 * @param accountNumber - 계좌번호
 * @param isVirtual - 모의투자 여부
 * @returns 보유 종목 목록
 */
export async function getKisHoldings(
  accessToken: string,
  appKey: string,
  appSecret: string,
  accountNumber: string,
  isVirtual: boolean = false
): Promise<KisHolding[]> {
  const { data, error } = await supabase.functions.invoke('kis-get-holdings', {
    body: {
      accessToken,
      appKey,
      appSecret,
      accountNumber,
      isVirtual,
    },
  })

  if (error) {
    console.error('KIS 보유 종목 조회 오류:', error)
    throw new Error(`보유 종목 조회 실패: ${error.message}`)
  }

  return data
}

/**
 * 한국투자증권 실시간 주가 조회
 * @param accessToken - 액세스 토큰
 * @param stockCode - 종목코드
 * @param isVirtual - 모의투자 여부
 * @returns 현재가 정보
 */
export async function getKisCurrentPrice(
  accessToken: string,
  appKey: string,
  appSecret: string,
  stockCode: string,
  isVirtual: boolean = false
): Promise<{
  stockCode: string
  stockName: string
  currentPrice: number
  change: number
  changePercent: number
}> {
  const { data, error } = await supabase.functions.invoke('kis-get-price', {
    body: {
      accessToken,
      appKey,
      appSecret,
      stockCode,
      isVirtual,
    },
  })

  if (error) {
    console.error('KIS 주가 조회 오류:', error)
    throw new Error(`주가 조회 실패: ${error.message}`)
  }

  return data
}
