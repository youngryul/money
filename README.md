# 부부 돈 관리 시스템

부부가 함께 사용할 수 있는 가계부 및 자산 관리 시스템입니다.

## 주요 기능

1. **로그인 기능 (캐릭터 설정)**: 두 파트너의 이름과 캐릭터를 설정하여 시작
2. **월급 기록**: 각 파트너의 월급을 기록하고 관리
3. **각자 고정비 기록**: 개인별 고정비를 매월 자동으로 계산
4. **공동 생활비 기록**: 부부가 함께 사용하는 생활비 기록
5. **각자 용돈 기록**: 개인별 용돈 기록
6. **가계부**: 모든 수입/지출을 통합 관리 (부수입 포함)
7. **비상금, 공동 적금 기록**: 적금과 비상금을 분리하여 관리
8. **투자 기록**: 투자 내역과 현재 가치를 추적
9. **자산 누적 및 상승/하락 애니메이션**: 자산 변동을 시각적으로 확인
10. **부부 공동 목표 기록**: 함께 달성할 목표를 설정하고 진행률 추적
11. **부수입 기록**: 가계부에서 부수입을 기록

## 기술 스택

- React 18
- TypeScript
- Vite
- Zustand (상태 관리)
- React Router (라우팅)
- Framer Motion (애니메이션)
- date-fns (날짜 처리)
- Supabase (데이터베이스)

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 미리보기

```bash
npm run preview
```

## 프로젝트 구조

```
src/
├── components/          # 공통 컴포넌트
│   ├── Layout.tsx      # 레이아웃 및 네비게이션
│   ├── Button.tsx       # 버튼 컴포넌트
│   ├── Input.tsx       # 입력 컴포넌트
│   ├── Card.tsx        # 카드 컴포넌트
│   ├── Modal.tsx       # 모달 컴포넌트
│   └── AssetAnimation.tsx  # 자산 애니메이션
├── pages/              # 페이지 컴포넌트
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── SalaryPage.tsx
│   ├── FixedExpensePage.tsx
│   ├── LivingExpensePage.tsx
│   ├── AllowancePage.tsx
│   ├── LedgerPage.tsx
│   ├── SavingsPage.tsx
│   ├── InvestmentPage.tsx
│   └── GoalPage.tsx
├── stores/            # Zustand 스토어
│   ├── authStore.ts   # 인증 상태 관리
│   └── dataStore.ts   # 데이터 상태 관리
├── services/          # Supabase 쿼리 서비스
│   ├── userService.ts
│   ├── salaryService.ts
│   ├── fixedExpenseService.ts
│   ├── livingExpenseService.ts
│   ├── allowanceService.ts
│   ├── ledgerService.ts
│   ├── savingsService.ts
│   ├── investmentService.ts
│   └── goalService.ts
├── lib/               # 라이브러리 설정
│   └── supabase.ts    # Supabase 클라이언트
├── constants/         # 상수 정의
├── types/             # TypeScript 타입 정의
└── App.tsx            # 메인 앱 컴포넌트
```

## 데이터 저장

### Supabase 연동

이 프로젝트는 Supabase를 사용하여 데이터를 관리합니다.

#### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트 설정에서 API URL과 Anon Key를 확인합니다.

#### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가합니다:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 3. 데이터베이스 테이블 생성

Supabase 대시보드의 SQL Editor에서 `sql/create_tables.sql` 파일의 내용을 실행하여 테이블을 생성합니다.

또는 Supabase CLI를 사용하여 마이그레이션을 실행할 수 있습니다:

```bash
supabase db push
```

#### 4. 서비스 함수 사용

각 데이터 타입별로 CRUD 함수가 제공됩니다:

```typescript
import { getSalaries, createSalary, updateSalary, deleteSalary } from '@/services'

// 월급 조회
const salaries = await getSalaries()

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

### 제공되는 서비스

- `userService`: 사용자 정보 관리
- `salaryService`: 월급 정보 관리
- `fixedExpenseService`: 고정비 정보 관리
- `livingExpenseService`: 생활비 정보 관리
- `allowanceService`: 용돈 정보 관리
- `ledgerService`: 가계부 거래 내역 관리
- `savingsService`: 적금/비상금 정보 관리
- `investmentService`: 투자 정보 관리
- `goalService`: 공동 목표 관리

### 로컬 스토리지 (기존 방식)

기존에는 브라우저의 로컬 스토리지에 데이터를 저장했지만, 이제는 Supabase를 통해 데이터를 관리합니다.

## 라이선스

MIT

