-- 모든 데이터의 날짜 범위 확인 쿼리
-- 가장 이른 날짜와 가장 늦은 날짜를 확인할 수 있습니다

-- 1. 월급 날짜 범위
SELECT 
  '월급' as type,
  MIN(date) as earliest_date,
  MAX(date) as latest_date,
  COUNT(*) as count
FROM salaries

UNION ALL

-- 2. 생활비 날짜 범위
SELECT 
  '생활비',
  MIN(date),
  MAX(date),
  COUNT(*)
FROM living_expenses

UNION ALL

-- 3. 용돈 날짜 범위
SELECT 
  '용돈',
  MIN(date),
  MAX(date),
  COUNT(*)
FROM allowances

UNION ALL

-- 4. 적금/비상금 날짜 범위
SELECT 
  '적금/비상금',
  MIN(date),
  MAX(date),
  COUNT(*)
FROM savings

UNION ALL

-- 5. 투자 날짜 범위
SELECT 
  '투자',
  MIN(date),
  MAX(date),
  COUNT(*)
FROM investments

UNION ALL

-- 6. 가계부 거래 날짜 범위
SELECT 
  '가계부',
  MIN(date),
  MAX(date),
  COUNT(*)
FROM ledger_transactions

ORDER BY earliest_date;

-- 전체 데이터에서 가장 이른 날짜와 가장 늦은 날짜
SELECT 
  '전체' as type,
  LEAST(
    (SELECT MIN(date) FROM salaries),
    (SELECT MIN(date) FROM living_expenses),
    (SELECT MIN(date) FROM allowances),
    (SELECT MIN(date) FROM savings),
    (SELECT MIN(date) FROM investments),
    (SELECT MIN(date) FROM ledger_transactions)
  ) as earliest_date,
  GREATEST(
    (SELECT MAX(date) FROM salaries),
    (SELECT MAX(date) FROM living_expenses),
    (SELECT MAX(date) FROM allowances),
    (SELECT MAX(date) FROM savings),
    (SELECT MAX(date) FROM investments),
    (SELECT MAX(date) FROM ledger_transactions)
  ) as latest_date;
