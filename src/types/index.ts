import { UserType, TransactionType, Category } from '../constants'

/**
 * 사용자 정보
 */
export interface User {
  id: string
  authUserId?: string
  name: string
  type: UserType | null
  character?: string
  partnerId?: string | null
}

/**
 * 초대장 정보
 */
export interface Invitation {
  id: string
  inviterId: string
  inviteeEmail: string
  code: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  expiresAt: string
  createdAt: string
  updatedAt: string
}

/**
 * 수입 정보
 */
export interface Salary {
  id: string
  userId: string
  amount: number
  date: string
  memo?: string
}

/**
 * 고정비 정보
 */
export interface FixedExpense {
  id: string
  userId: string
  name: string
  amount: number
  dayOfMonth: number // 매월 몇 일에 지출되는지
  memo?: string
}

/**
 * 생활비 정보
 */
export interface LivingExpense {
  id: string
  userId: string
  amount: number
  date: string
  category: string
  memo?: string
}

/**
 * 용돈 정보
 */
export interface Allowance {
  id: string
  userId: string
  amount: number
  date: string
  memo?: string
}

/**
 * 가계부 거래 내역
 */
export interface LedgerTransaction {
  id: string
  type: TransactionType
  amount: number
  date: string
  category: Category | string
  memo?: string
  userId?: string // 개인 지출인 경우
}

/**
 * 적금/비상금 정보
 */
export interface Savings {
  id: string
  userId: string
  type: 'EMERGENCY_FUND' | 'CONDOLENCE' | 'TRAVEL_SAVINGS' | 'HOUSE_SAVINGS'
  amount: number
  date: string
  memo?: string
}

/**
 * 투자 정보
 */
export interface Investment {
  id: string
  userId: string
  name: string
  type: string // 주식, 채권, 부동산 등
  amount: number
  date: string
  currentValue?: number
  memo?: string
}

/**
 * 공동 목표
 */
export interface Goal {
  id: string
  userId?: string // 공동 목표인 경우 null일 수 있음
  title: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  memo?: string
}

