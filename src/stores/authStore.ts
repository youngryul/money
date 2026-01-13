import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types'
import { STORAGE_KEYS, USER_TYPE, DEFAULT_VALUES } from '../constants'
import { getUsers, createUser, updateUser } from '../services/userService'
import { supabase } from '../lib/supabase'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'

interface AuthState {
  // Supabase 인증 관련
  session: Session | null
  supabaseUser: SupabaseUser | null
  
  // 앱 사용자 정보
  user: User | null
  partner: User | null
  isAuthenticated: boolean
  
  // 인증 메서드
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  
  // 파트너 정보 설정
  setupPartners: (user1: { name: string; character?: string }, user2: { name: string; character?: string }) => Promise<void>
  
  // 파트너 정보 로드
  loadPartners: () => Promise<void>
  
  // 세션 초기화
  initializeSession: () => Promise<void>
}

// onAuthStateChange 리스너가 이미 등록되었는지 추적
let authStateChangeListener: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      supabaseUser: null,
      user: null,
      partner: null,
      isAuthenticated: false,

      // Supabase 회원가입
      signUp: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          console.error('회원가입 오류:', error)
          throw new Error(error.message || '회원가입에 실패했습니다.')
        }

        if (data.session) {
          set({
            session: data.session,
            supabaseUser: data.user,
            isAuthenticated: true,
          })
        }
      },

      // Supabase 로그인
      signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          console.error('로그인 오류:', error)
          throw new Error(error.message || '로그인에 실패했습니다.')
        }

        if (data.session) {
          set({
            session: data.session,
            supabaseUser: data.user,
            isAuthenticated: true,
          })

          // 파트너 정보 로드
          await get().loadPartners()
        }
      },

      // Supabase 로그아웃
      signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('로그아웃 오류:', error)
          throw error
        }

        set({
          session: null,
          supabaseUser: null,
          user: null,
          partner: null,
          isAuthenticated: false,
        })
      },

      // 파트너 정보 설정
      setupPartners: async (user1, user2) => {
        try {
          // 기존 사용자 조회
          const existingUsers = await getUsers()

          // PARTNER_1 사용자 찾기 또는 생성
          let partner1 = existingUsers.find((u) => u.type === USER_TYPE.PARTNER_1)
          if (!partner1) {
            partner1 = await createUser({
              name: user1.name || DEFAULT_VALUES.PARTNER_1_NAME,
              type: USER_TYPE.PARTNER_1,
              character: user1.character,
            })
          } else {
            // 기존 사용자 정보 업데이트 (이름이나 캐릭터가 변경된 경우)
            const name = user1.name || DEFAULT_VALUES.PARTNER_1_NAME
            if (partner1.name !== name || partner1.character !== user1.character) {
              partner1 = await updateUser(partner1.id, {
                name,
                character: user1.character,
              })
            }
          }

          // PARTNER_2 사용자 찾기 또는 생성
          let partner2 = existingUsers.find((u) => u.type === USER_TYPE.PARTNER_2)
          if (!partner2) {
            partner2 = await createUser({
              name: user2.name || DEFAULT_VALUES.PARTNER_2_NAME,
              type: USER_TYPE.PARTNER_2,
              character: user2.character,
            })
          } else {
            // 기존 사용자 정보 업데이트 (이름이나 캐릭터가 변경된 경우)
            const name = user2.name || DEFAULT_VALUES.PARTNER_2_NAME
            if (partner2.name !== name || partner2.character !== user2.character) {
              partner2 = await updateUser(partner2.id, {
                name,
                character: user2.character,
              })
            }
          }

          set({
            user: partner1,
            partner: partner2,
          })
        } catch (error) {
          console.error('파트너 설정 오류:', error)
          throw error
        }
      },

      // 파트너 정보 로드
      loadPartners: async () => {
        try {
          const { supabaseUser } = get()
          if (!supabaseUser) {
            return
          }

          const existingUsers = await getUsers()
          // 현재 로그인한 사용자 찾기
          const currentUser = existingUsers.find((u) => u.authUserId === supabaseUser.id)
          
          if (!currentUser) {
            // 사용자 정보가 없으면 생성
            const newUser = await createUser({
              authUserId: supabaseUser.id,
              name: supabaseUser.email?.split('@')[0] || '사용자',
              type: null,
              character: undefined,
            })
            
            set({
              user: newUser,
              partner: null,
            })
            return
          }

          // 파트너 찾기
          let partner: User | null = null
          if (currentUser.partnerId) {
            partner = existingUsers.find((u) => u.id === currentUser.partnerId) || null
          }

          // 현재 상태와 비교하여 실제로 변경이 있을 때만 업데이트
          const currentState = get()
          if (
            currentState.user?.id !== currentUser.id ||
            currentState.partner?.id !== partner?.id ||
            currentState.user?.name !== currentUser.name ||
            currentState.partner?.name !== partner?.name
          ) {
            set({
              user: currentUser,
              partner: partner,
            })
          }
        } catch (error) {
          console.error('파트너 로드 오류:', error)
        }
      },

      // 세션 초기화
      initializeSession: async () => {
        try {
          // 현재 세션 확인
          const { data: { session } } = await supabase.auth.getSession()

          if (session) {
            set({
              session,
              supabaseUser: session.user,
              isAuthenticated: true,
            })

            // 파트너 정보 로드
            await get().loadPartners()
          } else {
            set({
              session: null,
              supabaseUser: null,
              user: null,
              partner: null,
              isAuthenticated: false,
            })
          }

          // 세션 변경 감지 (한 번만 등록)
          if (!authStateChangeListener) {
            authStateChangeListener = supabase.auth.onAuthStateChange((_event, session) => {
              if (session) {
                set({
                  session,
                  supabaseUser: session.user,
                  isAuthenticated: true,
                })
                get().loadPartners()
              } else {
                set({
                  session: null,
                  supabaseUser: null,
                  user: null,
                  partner: null,
                  isAuthenticated: false,
                })
              }
            })
          }
        } catch (error) {
          console.error('세션 초기화 오류:', error)
        }
      },
    }),
    {
      name: STORAGE_KEYS.AUTH,
      partialize: (state) => ({
        // Supabase 세션은 persist하지 않음 (자동 관리)
        user: state.user,
        partner: state.partner,
      }),
    }
  )
)

