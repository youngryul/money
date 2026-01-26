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
    const { accessToken, appKey, appSecret, stockCode, isVirtual } = await req.json()

    if (!accessToken || !appKey || !appSecret || !stockCode) {
      throw new Error('액세스 토큰, 앱키, 앱시크릿, 종목코드가 필요합니다.')
    }

    // 모의투자 여부에 따라 URL 결정
    const KIS_BASE_URL = isVirtual
      ? 'https://openapivts.koreainvestment.com:29443'
      : 'https://openapi.koreainvestment.com:9443'

    // 현재가 조회
    const trId = isVirtual ? 'FHKST01010100' : 'FHKST01010100' // 모의투자/실거래 동일
    const url = `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${accessToken}`,
        'appkey': appKey,
        'appsecret': appSecret,
        'tr_id': trId,
      },
      body: JSON.stringify({
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: stockCode,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('KIS 주가 조회 실패:', errorText)
      throw new Error(`주가 조회 실패: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // 주가 정보 변환
    const output = data.output || {}
    const currentPrice = parseFloat(output.stck_prpr || 0)
    const previousClose = parseFloat(output.prdy_clpr || 0)
    const change = currentPrice - previousClose
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

    const priceInfo = {
      stockCode: output.hts_kor_isnm ? stockCode : stockCode,
      stockName: output.hts_kor_isnm || '',
      currentPrice: currentPrice,
      change: change,
      changePercent: changePercent,
      volume: parseInt(output.acml_vol || 0),
      highPrice: parseFloat(output.stck_hgpr || 0),
      lowPrice: parseFloat(output.stck_lwpr || 0),
    }

    return new Response(JSON.stringify(priceInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('KIS 주가 조회 오류:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '알 수 없는 오류' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
