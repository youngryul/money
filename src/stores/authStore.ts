import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, UserType } from '../types'
import { STORAGE_KEYS, USER_TYPE, DEFAULT_VALUES } from '../constants'

interface AuthState {
  user: User | null
  partner: User | null
  isAuthenticated: boolean
  login: (user1: { name: string; character?: string }, user2: { name: string; character?: string }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      partner: null,
      isAuthenticated: false,
      login: (user1, user2) => {
        const partner1: User = {
          id: '1',
          name: user1.name || DEFAULT_VALUES.PARTNER_1_NAME,
          type: USER_TYPE.PARTNER_1,
          character: user1.character,
        }
        const partner2: User = {
          id: '2',
          name: user2.name || DEFAULT_VALUES.PARTNER_2_NAME,
          type: USER_TYPE.PARTNER_2,
          character: user2.character,
        }
        set({
          user: partner1,
          partner: partner2,
          isAuthenticated: true,
        })
      },
      logout: () => {
        set({
          user: null,
          partner: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: STORAGE_KEYS.AUTH,
    }
  )
)

