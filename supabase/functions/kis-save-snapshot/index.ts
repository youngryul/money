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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { userId, investmentAmount, kisTotalValue } = await req.json()

    if (!userId || investmentAmount === undefined) {
      throw new Error('사용자 ID와 투자금액이 필요합니다.')
    }

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0]

    // 오늘 날짜의 스냅샷이 이미 있으면 업데이트, 없으면 생성
    const { data: existing } = await supabase
      .from('investment_snapshots')
      .select('id')
      .eq('user_id', userId)
      .eq('snapshot_date', today)
      .maybeSingle()

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from('investment_snapshots')
        .update({
          investment_amount: investmentAmount,
          kis_total_value: kisTotalValue || 0,
        })
        .eq('id', existing.id)

      if (error) {
        throw error
      }
    } else {
      // 생성
      const { error } = await supabase
        .from('investment_snapshots')
        .insert({
          user_id: userId,
          snapshot_date: today,
          investment_amount: investmentAmount,
          kis_total_value: kisTotalValue || 0,
        })

      if (error) {
        throw error
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('투자금 스냅샷 저장 오류:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '알 수 없는 오류' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
