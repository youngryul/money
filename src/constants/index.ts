/**
 * 애플리케이션 전역 상수
 */

// 사용자 타입
export const USER_TYPE = {
  PARTNER_1: 'PARTNER_1',
  PARTNER_2: 'PARTNER_2',
} as const

export type UserType = typeof USER_TYPE[keyof typeof USER_TYPE]

// 거래 유형
export const TRANSACTION_TYPE = {
  INCOME: 'INCOME', // 수입
  EXPENSE: 'EXPENSE', // 지출
} as const

export type TransactionType = typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE]

// 카테고리
export const CATEGORY = {
  // 수입
  SALARY: 'SALARY', // 월급
  SIDE_INCOME: 'SIDE_INCOME', // 부수입
  // 지출
  FIXED_EXPENSE: 'FIXED_EXPENSE', // 고정비
  LIVING_EXPENSE: 'LIVING_EXPENSE', // 생활비
  ALLOWANCE: 'ALLOWANCE', // 용돈
  SAVINGS: 'SAVINGS', // 적금
  INVESTMENT: 'INVESTMENT', // 투자
  EMERGENCY_FUND: 'EMERGENCY_FUND', // 비상금
} as const

export type Category = typeof CATEGORY[keyof typeof CATEGORY]

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  AUTH: 'money_auth',
  SALARIES: 'money_salaries',
  FIXED_EXPENSES: 'money_fixed_expenses',
  LIVING_EXPENSES: 'money_living_expenses',
  ALLOWANCES: 'money_allowances',
  LEDGER: 'money_ledger',
  SAVINGS: 'money_savings',
  INVESTMENTS: 'money_investments',
  GOALS: 'money_goals',
} as const

// 날짜 포맷
export const DATE_FORMAT = {
  DISPLAY: 'yyyy년 MM월 dd일',
  INPUT: 'yyyy-MM-dd',
  MONTH: 'yyyy년 MM월',
} as const

// 기본값
export const DEFAULT_VALUES = {
  PARTNER_1_NAME: '파트너 1',
  PARTNER_2_NAME: '파트너 2',
} as const

