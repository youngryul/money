import { createClient } from '@supabase/supabase-js'

/**
 * Supabase 클라이언트 인스턴스
 * 환경 변수에서 URL과 API 키를 가져옵니다.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase 환경 변수가 설정되지 않았습니다. .env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해주세요.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
