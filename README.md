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
├── constants/         # 상수 정의
├── types/             # TypeScript 타입 정의
└── App.tsx            # 메인 앱 컴포넌트
```

## 데이터 저장

모든 데이터는 브라우저의 로컬 스토리지에 저장됩니다. 별도의 서버나 데이터베이스가 필요하지 않습니다.

## 라이선스

MIT

