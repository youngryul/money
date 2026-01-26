# 한국투자증권(KIS) API 연동 가이드

## 개요

한국투자증권 Open API를 사용하여 실시간 투자 현황을 조회할 수 있습니다.

## 사전 준비

### 1. 한국투자증권 Open API 신청
1. [한국투자증권 Open API](https://apiportal.koreainvestment.com/) 접속
2. 회원가입 및 앱 등록
3. 앱키(App Key)와 앱시크릿(App Secret) 발급
4. 모의투자 또는 실거래 선택

### 2. Supabase Edge Functions 설정

#### Edge Function 생성
```bash
# Supabase CLI 설치 필요
supabase functions new kis-get-token
supabase functions new kis-get-accounts
supabase functions new kis-get-holdings
supabase functions new kis-get-price
```

#### 환경 변수 설정
Supabase Dashboard에서 다음 환경 변수를 설정:
- `KIS_APP_KEY`: 앱키
- `KIS_APP_SECRET`: 앱시크릿
- `KIS_VIRTUAL_MODE`: 모의투자 여부 (true/false)

### 3. Edge Function 예시 코드

#### `supabase/functions/kis-get-token/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const KIS_BASE_URL = Deno.env.get('KIS_VIRTUAL_MODE') === 'true'
  ? 'https://openapivts.koreainvestment.com:29443'
  : 'https://openapi.koreainvestment.com:9443'

serve(async (req) => {
  try {
    const { appKey, appSecret, isVirtual } = await req.json()
    
    const url = `${KIS_BASE_URL}/oauth2/tokenP`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: appKey,
        appsecret: appSecret,
      }),
    })

    if (!response.ok) {
      throw new Error(`토큰 발급 실패: ${response.statusText}`)
    }

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

#### `supabase/functions/kis-get-holdings/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const KIS_BASE_URL = Deno.env.get('KIS_VIRTUAL_MODE') === 'true'
  ? 'https://openapivts.koreainvestment.com:29443'
  : 'https://openapi.koreainvestment.com:9443'

serve(async (req) => {
  try {
    const { accessToken, accountNumber, isVirtual } = await req.json()
    
    const appKey = Deno.env.get('KIS_APP_KEY')
    const url = `${KIS_BASE_URL}/uapi/domestic-stock/v1/trading/inquire-balance`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${accessToken}`,
        'appkey': appKey,
        'appsecret': Deno.env.get('KIS_APP_SECRET'),
        'tr_id': isVirtual ? 'VTTC8434R' : 'TTTC8434R', // 모의투자/실거래 구분
      },
      body: JSON.stringify({
        CANO: accountNumber.split('-')[0], // 계좌번호 앞 8자리
        ACNT_PRDT_CD: accountNumber.split('-')[1], // 계좌번호 뒤 2자리
        AFHR_FLPR_YN: 'N',
        OFL_YN: '',
        INQR_DVSN: '02',
        UNPR_DVSN: '01',
        FUND_STTL_ICLD_YN: 'N',
        FNCG_AMT_AUTO_RDPT_YN: 'N',
        PRCS_DVSN: '01',
        CTX_AREA_FK100: '',
        CTX_AREA_NK100: '',
      }),
    })

    if (!response.ok) {
      throw new Error(`보유 종목 조회 실패: ${response.statusText}`)
    }

    const data = await response.json()
    
    // 데이터 변환 로직
    const holdings = data.output1.map((item: any) => ({
      stockCode: item.pdno,
      stockName: item.prdt_name,
      quantity: parseInt(item.hldg_qty),
      averagePrice: parseFloat(item.pchs_avg_pric),
      currentPrice: parseFloat(item.prpr),
      totalValue: parseFloat(item.evlu_amt),
      profitLoss: parseFloat(item.evlu_pfls_amt),
      profitLossPercent: parseFloat(item.evlu_pfls_rt),
    }))
    
    return new Response(JSON.stringify(holdings), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

## 사용 방법

### 1. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일 생성:
```env
VITE_KIS_APP_KEY=your_app_key
VITE_KIS_APP_SECRET=your_app_secret
VITE_KIS_VIRTUAL_MODE=true
```

### 2. 투자 페이지에서 KIS 연동
투자 페이지에 "KIS 계좌 연동" 버튼을 추가하고, 계좌 정보를 입력받아 연동합니다.

### 3. 실시간 데이터 조회
투자 페이지에서 KIS 연동된 항목의 실시간 가격을 조회하고 표시합니다.

## 주의사항

1. **보안**: API 키와 시크릿은 절대 프론트엔드에 노출하지 마세요. Supabase Edge Functions를 통해 호출해야 합니다.
2. **토큰 관리**: 액세스 토큰은 만료 시간이 있으므로, 만료 전에 갱신해야 합니다.
3. **API 제한**: 한국투자증권 API는 호출 제한이 있으므로, 적절한 캐싱 전략이 필요합니다.
4. **모의투자 vs 실거래**: 개발 단계에서는 모의투자 환경을 사용하는 것을 권장합니다.

## 참고 자료

- [한국투자증권 Open API 포털](https://apiportal.koreainvestment.com/)
- [한국투자증권 API 가이드](https://apiportal.koreainvestment.com/apiservice)
