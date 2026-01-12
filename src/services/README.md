# Supabase 서비스 함수 사용 가이드

이 디렉토리에는 Supabase를 사용한 데이터베이스 쿼리 함수들이 포함되어 있습니다.

## 기본 사용법

### 1. 월급 관리

```typescript
import { getSalaries, createSalary, updateSalary, deleteSalary } from '@/services'

// 모든 월급 조회
const allSalaries = await getSalaries()

// 특정 사용자의 월급 조회
const userSalaries = await getSalaries('user-id')

// 월급 생성
const newSalary = await createSalary({
  userId: 'user-id',
  amount: 3000000,
  date: '2024-01-01',
  memo: '1월 월급'
})

// 월급 수정
await updateSalary('salary-id', { amount: 3500000 })

// 월급 삭제
await deleteSalary('salary-id')
```

### 2. 고정비 관리

```typescript
import { getFixedExpenses, createFixedExpense } from '@/services'

// 고정비 조회
const expenses = await getFixedExpenses()

// 고정비 생성
await createFixedExpense({
  userId: 'user-id',
  name: '통신비',
  amount: 50000,
  dayOfMonth: 15,
  memo: '매월 15일 자동 결제'
})
```

### 3. 생활비 관리

```typescript
import { getLivingExpenses, createLivingExpense } from '@/services'

// 날짜 범위로 생활비 조회
const expenses = await getLivingExpenses('2024-01-01', '2024-01-31')

// 생활비 생성
await createLivingExpense({
  amount: 50000,
  date: '2024-01-15',
  category: '식비',
  memo: '마트 장보기'
})
```

### 4. 가계부 거래 내역 관리

```typescript
import { getLedgerTransactions, createLedgerTransaction } from '@/services'

// 거래 내역 조회 (날짜 범위, 사용자 필터 가능)
const transactions = await getLedgerTransactions('2024-01-01', '2024-01-31', 'user-id')

// 거래 내역 생성
await createLedgerTransaction({
  type: 'EXPENSE',
  amount: 30000,
  date: '2024-01-15',
  category: '식비',
  memo: '점심 식사',
  userId: 'user-id'
})
```

### 5. 투자 정보 관리

```typescript
import { getInvestments, createInvestment, updateInvestment } from '@/services'

// 투자 정보 조회
const investments = await getInvestments()

// 투자 정보 생성
await createInvestment({
  name: '삼성전자',
  type: '주식',
  amount: 1000000,
  date: '2024-01-01',
  currentValue: 1200000,
  memo: '장기 투자'
})

// 현재 가치 업데이트
await updateInvestment('investment-id', { currentValue: 1300000 })
```

### 6. 공동 목표 관리

```typescript
import { getGoals, createGoal, updateGoal } from '@/services'

// 목표 조회
const goals = await getGoals()

// 목표 생성
await createGoal({
  title: '신혼여행',
  targetAmount: 5000000,
  currentAmount: 2000000,
  deadline: '2024-12-31',
  memo: '일본 여행'
})

// 목표 진행률 업데이트
await updateGoal('goal-id', { currentAmount: 3000000 })
```

## 에러 처리

모든 서비스 함수는 에러가 발생하면 예외를 던집니다. try-catch 블록을 사용하여 에러를 처리하세요:

```typescript
try {
  const salaries = await getSalaries()
} catch (error) {
  console.error('월급 조회 실패:', error)
  // 사용자에게 에러 메시지 표시
}
```

## 타입 안정성

모든 서비스 함수는 TypeScript 타입을 사용하므로, IDE에서 자동 완성과 타입 체크를 받을 수 있습니다.
