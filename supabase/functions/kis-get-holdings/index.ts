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
    const { accessToken, appKey, appSecret, accountNumber, isVirtual } = await req.json()

    if (!accessToken || !appKey || !appSecret || !accountNumber) {
      throw new Error('액세스 토큰, 앱키, 앱시크릿, 계좌번호가 필요합니다.')
    }

    // 모의투자 여부에 따라 URL 결정
    const KIS_BASE_URL = isVirtual
      ? 'https://openapivts.koreainvestment.com:29443'
      : 'https://openapi.koreainvestment.com:9443'

    // 계좌번호 파싱 (예: "12345678-01" -> CANO: "12345678", ACNT_PRDT_CD: "01")
    // 또는 "1234567801" -> CANO: "12345678", ACNT_PRDT_CD: "01"
    let CANO = ''
    let ACNT_PRDT_CD = '01'
    
    if (accountNumber.includes('-')) {
      const accountParts = accountNumber.split('-')
      CANO = accountParts[0] || ''
      ACNT_PRDT_CD = accountParts[1] || '01'
    } else {
      // 하이픈이 없는 경우: 앞 8자리가 CANO, 뒤 2자리가 ACNT_PRDT_CD
      CANO = accountNumber.substring(0, 8)
      ACNT_PRDT_CD = accountNumber.substring(8, 10) || '01'
    }
    
    // CANO는 정확히 8자리여야 함
    if (CANO.length !== 8) {
      throw new Error(`계좌번호 형식이 올바르지 않습니다. CANO는 8자리여야 합니다. (현재: ${CANO})`)
    }
    
    // ACNT_PRDT_CD는 2자리여야 함
    if (ACNT_PRDT_CD.length !== 2) {
      ACNT_PRDT_CD = ACNT_PRDT_CD.padStart(2, '0')
    }

    // 보유 종목 조회
    const trId = isVirtual ? 'VTTC8434R' : 'TTTC8434R' // 모의투자/실거래 구분
    
    // 한국투자증권 API는 POST 요청이며, 파라미터는 쿼리 스트링으로 전달
    // CANO는 정확히 8자리 숫자여야 함 (공백 제거)
    const cleanCANO = CANO.replace(/\s+/g, '').trim()
    const cleanACNT_PRDT_CD = ACNT_PRDT_CD.replace(/\s+/g, '').trim()
    
    if (cleanCANO.length !== 8 || !/^\d+$/.test(cleanCANO)) {
      throw new Error(`CANO는 정확히 8자리 숫자여야 합니다. (현재: "${cleanCANO}", 길이: ${cleanCANO.length})`)
    }
    
    const queryParams = new URLSearchParams()
    queryParams.append('CANO', cleanCANO)
    queryParams.append('ACNT_PRDT_CD', cleanACNT_PRDT_CD)
    queryParams.append('AFHR_FLPR_YN', 'N')
    queryParams.append('OFL_YN', '')
    queryParams.append('INQR_DVSN', '02')
    queryParams.append('UNPR_DVSN', '01')
    queryParams.append('FUND_STTL_ICLD_YN', 'N')
    queryParams.append('FNCG_AMT_AUTO_RDPT_YN', 'N')
    queryParams.append('PRCS_DVSN', '01')
    queryParams.append('CTX_AREA_FK100', '')
    queryParams.append('CTX_AREA_NK100', '')
    
    const url = `${KIS_BASE_URL}/uapi/domestic-stock/v1/trading/inquire-balance?${queryParams.toString()}`

    console.log('KIS API 요청:', { 
      url, 
      CANO: cleanCANO, 
      ACNT_PRDT_CD: cleanACNT_PRDT_CD, 
      accountNumber,
      trId,
      queryString: queryParams.toString()
    })

    // 한국투자증권 API inquire-balance는 POST 요청
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'authorization': `Bearer ${accessToken}`,
        'appkey': appKey,
        'appsecret': appSecret,
        'tr_id': trId,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('KIS 보유 종목 조회 실패:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url,
        headers: Object.fromEntries(response.headers.entries()),
      })
      throw new Error(`보유 종목 조회 실패: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    
    // API 응답에 오류가 있는지 확인
    if (data.rt_cd && data.rt_cd !== '0') {
      console.error('KIS API 오류 응답:', data)
      throw new Error(`KIS API 오류: ${data.msg1 || data.msg_cd || '알 수 없는 오류'}`)
    }

    // 보유 종목 정보 변환
    const holdings = (data.output1 || []).map((item: any) => ({
      stockCode: item.pdno || '',
      stockName: item.prdt_name || '',
      quantity: parseInt(item.hldg_qty || 0),
      averagePrice: parseFloat(item.pchs_avg_pric || 0),
      currentPrice: parseFloat(item.prpr || 0),
      totalValue: parseFloat(item.evlu_amt || 0),
      profitLoss: parseFloat(item.evlu_pfls_amt || 0),
      profitLossPercent: parseFloat(item.evlu_pfls_rt || 0),
    }))

    return new Response(JSON.stringify(holdings), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('KIS 보유 종목 조회 오류:', {
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined,
      error,
    })
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
