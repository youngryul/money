-- 월별 총자산 조회 쿼리
-- 대시보드의 월별 자산 계산과 동일한 로직

WITH monthly_data AS (
  SELECT 
    DATE_TRUNC('month', date)::DATE as month_start,
    TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') as month_key,
    TO_CHAR(DATE_TRUNC('month', date), 'YYYY년 MM월') as month_label
  FROM (
    SELECT date FROM salaries
    UNION
    SELECT date FROM living_expenses
    UNION
    SELECT date FROM allowances
    UNION
    SELECT date FROM savings
    UNION
    SELECT date FROM investments
    UNION
    SELECT date FROM ledger_transactions
  ) all_dates
  GROUP BY DATE_TRUNC('month', date)
),
monthly_income_expense AS (
  SELECT 
    md.month_key,
    md.month_label,
    md.month_start,
    -- 월급 합계
    COALESCE(SUM(CASE WHEN s.date >= md.month_start AND s.date < (md.month_start + INTERVAL '1 month') THEN s.amount ELSE 0 END), 0) as month_salary,
    -- 가계부 수입 합계
    COALESCE(SUM(CASE WHEN lt.type = 'INCOME' AND lt.date >= md.month_start AND lt.date < (md.month_start + INTERVAL '1 month') THEN lt.amount ELSE 0 END), 0) as month_income,
    -- 생활비 합계 (생활비 카테고리만)
    COALESCE(SUM(CASE WHEN le.category = '생활비' AND le.date >= md.month_start AND le.date < (md.month_start + INTERVAL '1 month') THEN le.amount ELSE 0 END), 0) as month_living_expense,
    -- 용돈 합계
    COALESCE(SUM(CASE WHEN a.date >= md.month_start AND a.date < (md.month_start + INTERVAL '1 month') THEN a.amount ELSE 0 END), 0) as month_allowance,
    -- 적금 합계 (해당 월)
    COALESCE(SUM(CASE WHEN s2.date >= md.month_start AND s2.date < (md.month_start + INTERVAL '1 month') THEN s2.amount ELSE 0 END), 0) as month_savings,
    -- 투자 예수금 합계 (해당 월)
    COALESCE(SUM(CASE WHEN i.date >= md.month_start AND i.date < (md.month_start + INTERVAL '1 month') THEN COALESCE(i.monthly_deposit, 0) ELSE 0 END), 0) as month_investment_deposit,
    -- 가계부 지출 합계
    COALESCE(SUM(CASE WHEN lt2.type = 'EXPENSE' AND lt2.date >= md.month_start AND lt2.date < (md.month_start + INTERVAL '1 month') THEN lt2.amount ELSE 0 END), 0) as month_expense,
    -- 고정비 합계 (전체, 매월 반복)
    (SELECT COALESCE(SUM(amount), 0) FROM fixed_expenses) as month_fixed_expense
  FROM monthly_data md
  LEFT JOIN salaries s ON DATE_TRUNC('month', s.date)::DATE = md.month_start
  LEFT JOIN ledger_transactions lt ON DATE_TRUNC('month', lt.date)::DATE = md.month_start AND lt.type = 'INCOME'
  LEFT JOIN living_expenses le ON DATE_TRUNC('month', le.date)::DATE = md.month_start
  LEFT JOIN allowances a ON DATE_TRUNC('month', a.date)::DATE = md.month_start
  LEFT JOIN savings s2 ON DATE_TRUNC('month', s2.date)::DATE = md.month_start
  LEFT JOIN investments i ON DATE_TRUNC('month', i.date)::DATE = md.month_start
  LEFT JOIN ledger_transactions lt2 ON DATE_TRUNC('month', lt2.date)::DATE = md.month_start AND lt2.type = 'EXPENSE'
  GROUP BY md.month_key, md.month_label, md.month_start
),
monthly_savings_accumulated AS (
  SELECT 
    md.month_key,
    md.month_label,
    md.month_start,
    -- 해당 월 말일까지의 적금/비상금 누적
    COALESCE(SUM(CASE WHEN s.date <= (md.month_start + INTERVAL '1 month' - INTERVAL '1 day') THEN s.amount ELSE 0 END), 0) as savings_accumulated
  FROM monthly_data md
  LEFT JOIN savings s ON s.date <= (md.month_start + INTERVAL '1 month' - INTERVAL '1 day')
  GROUP BY md.month_key, md.month_label, md.month_start
),
monthly_investment_accumulated AS (
  SELECT 
    md.month_key,
    md.month_label,
    md.month_start,
    -- 해당 월 말일까지의 투자 누적 (current_value 우선, 없으면 amount)
    COALESCE(SUM(CASE WHEN i.date <= (md.month_start + INTERVAL '1 month' - INTERVAL '1 day') THEN COALESCE(i.current_value, i.amount) ELSE 0 END), 0) as investment_accumulated
  FROM monthly_data md
  LEFT JOIN investments i ON i.date <= (md.month_start + INTERVAL '1 month' - INTERVAL '1 day')
  GROUP BY md.month_key, md.month_label, md.month_start
)
SELECT 
  mie.month_label as "월",
  mie.month_salary as "월급",
  mie.month_income as "가계부 수입",
  (mie.month_salary + mie.month_income) as "총 수입",
  mie.month_fixed_expense as "고정비",
  mie.month_living_expense as "생활비",
  mie.month_allowance as "용돈",
  mie.month_expense as "가계부 지출",
  mie.month_savings as "적금(해당월)",
  mie.month_investment_deposit as "투자예수금(해당월)",
  (mie.month_fixed_expense + mie.month_living_expense + mie.month_allowance + mie.month_expense + mie.month_savings + mie.month_investment_deposit) as "총 지출",
  ((mie.month_salary + mie.month_income) - (mie.month_fixed_expense + mie.month_living_expense + mie.month_allowance + mie.month_expense + mie.month_savings + mie.month_investment_deposit)) as "현금",
  msa.savings_accumulated as "적금/비상금 누적",
  mia.investment_accumulated as "투자 누적",
  ((mie.month_salary + mie.month_income) - (mie.month_fixed_expense + mie.month_living_expense + mie.month_allowance + mie.month_expense + mie.month_savings + mie.month_investment_deposit) 
   + msa.savings_accumulated 
   + mia.investment_accumulated) as "총자산"
FROM monthly_income_expense mie
LEFT JOIN monthly_savings_accumulated msa ON mie.month_key = msa.month_key
LEFT JOIN monthly_investment_accumulated mia ON mie.month_key = mia.month_key
ORDER BY mie.month_start;
