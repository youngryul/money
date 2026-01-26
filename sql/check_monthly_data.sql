-- 월별 자산 데이터 확인 쿼리
-- 특정 월(예: 2025년 12월)의 데이터를 확인할 수 있습니다

-- 1. 월급 데이터 확인
SELECT 
  '월급' as type,
  date,
  amount,
  memo,
  created_at
FROM salaries
WHERE date >= '2025-12-01' AND date < '2026-01-01'
ORDER BY date;

-- 2. 생활비 데이터 확인
SELECT 
  '생활비' as type,
  date,
  category,
  amount,
  memo,
  created_at
FROM living_expenses
WHERE date >= '2025-12-01' AND date < '2026-01-01'
ORDER BY date;

-- 3. 용돈 데이터 확인
SELECT 
  '용돈' as type,
  date,
  amount,
  memo,
  created_at
FROM allowances
WHERE date >= '2025-12-01' AND date < '2026-01-01'
ORDER BY date;

-- 4. 적금/비상금 데이터 확인 (2025년 12월 이전 포함)
SELECT 
  '적금/비상금' as type,
  type as savings_type,
  date,
  amount,
  memo,
  created_at
FROM savings
WHERE date <= '2025-12-31'  -- 2025년 12월 말일까지의 누적
ORDER BY date;

-- 5. 투자 데이터 확인 (2025년 12월 이전 포함)
SELECT 
  '투자' as type,
  name,
  date,
  amount,
  current_value,
  monthly_deposit,
  memo,
  created_at
FROM investments
WHERE date <= '2025-12-31'  -- 2025년 12월 말일까지의 누적
ORDER BY date;

-- 6. 가계부 거래 내역 확인
SELECT 
  '가계부' as type,
  type as transaction_type,
  date,
  category,
  amount,
  memo,
  created_at
FROM ledger_transactions
WHERE date >= '2025-12-01' AND date < '2026-01-01'
ORDER BY date;

-- 7. 고정비 확인 (날짜 없음, 매월 반복)
SELECT 
  '고정비' as type,
  name,
  amount,
  day_of_month,
  memo
FROM fixed_expenses
ORDER BY day_of_month;

-- 8. 2025년 12월 전체 데이터 요약
SELECT 
  '월급 합계' as summary,
  COALESCE(SUM(amount), 0) as total
FROM salaries
WHERE date >= '2025-12-01' AND date < '2026-01-01'

UNION ALL

SELECT 
  '생활비 합계',
  COALESCE(SUM(amount), 0)
FROM living_expenses
WHERE date >= '2025-12-01' AND date < '2026-01-01'

UNION ALL

SELECT 
  '용돈 합계',
  COALESCE(SUM(amount), 0)
FROM allowances
WHERE date >= '2025-12-01' AND date < '2026-01-01'

UNION ALL

SELECT 
  '적금/비상금 누적 (2025-12-31까지)',
  COALESCE(SUM(amount), 0)
FROM savings
WHERE date <= '2025-12-31'

UNION ALL

SELECT 
  '투자 누적 (2025-12-31까지)',
  COALESCE(SUM(COALESCE(current_value, amount)), 0)
FROM investments
WHERE date <= '2025-12-31'

UNION ALL

SELECT 
  '가계부 수입 합계',
  COALESCE(SUM(amount), 0)
FROM ledger_transactions
WHERE date >= '2025-12-01' AND date < '2026-01-01'
  AND type = 'INCOME'

UNION ALL

SELECT 
  '가계부 지출 합계',
  COALESCE(SUM(amount), 0)
FROM ledger_transactions
WHERE date >= '2025-12-01' AND date < '2026-01-01'
  AND type = 'EXPENSE'

UNION ALL

SELECT 
  '고정비 합계',
  COALESCE(SUM(amount), 0)
FROM fixed_expenses;
