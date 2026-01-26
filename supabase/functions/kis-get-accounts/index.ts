import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { accessToken, appKey, appSecret, isVirtual } = await req.json()

    if (!accessToken || !appKey || !appSecret) {
      throw new Error('액세스 토큰, 앱키, 앱시크릿이 필요합니다.')
    }

    // 모의투자 여부에 따라 URL 결정
    const KIS_BASE_URL = isVirtual
      ? 'https://openapivts.koreainvestment.com:29443'
      : 'https://openapi.koreainvestment.com:9443'

    // 계좌 목록 조회
    const trId = isVirtual ? 'VTTC8436R' : 'TTTC8436R' // 모의투자/실거래 구분
    const url = `${KIS_BASE_URL}/uapi/domestic-stock/v1/trading/inquire-balance-ccld`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${accessToken}`,
        'appkey': appKey,
        'appsecret': appSecret,
        'tr_id': trId,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('KIS 계좌 조회 실패:', errorText)
      throw new Error(`계좌 조회 실패: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // 계좌 정보 변환
    const accounts = data.output?.map((item: any) => ({
      accountNumber: item.canl_istt_yn === 'Y' ? `${item.canl_no}-${item.acnt_prdt_cd}` : item.acnt_no,
      accountName: item.acnt_name || '',
      balance: parseFloat(item.dnca_tot_amt || 0),
      availableBalance: parseFloat(item.ord_psbl_cash || 0),
    })) || []

    return new Response(JSON.stringify(accounts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('KIS 계좌 조회 오류:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '알 수 없는 오류' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
