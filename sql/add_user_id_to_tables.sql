-- user_id 컬럼 추가 마이그레이션 스크립트
-- Supabase SQL Editor에서 실행하세요.

-- 1. living_expenses 테이블에 user_id 추가
ALTER TABLE living_expenses
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 기존 데이터가 있으면 현재 사용자 중 하나에 할당 (필요시 수정)
-- 주의: 이 부분은 실제 데이터 상황에 맞게 수정해야 합니다.
-- UPDATE living_expenses SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;

-- NOT NULL 제약 조건 추가 (기존 데이터가 모두 할당된 후)
-- ALTER TABLE living_expenses ALTER COLUMN user_id SET NOT NULL;

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_living_expenses_user_id ON living_expenses(user_id);

-- 2. savings 테이블에 user_id 추가
ALTER TABLE savings
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 기존 데이터가 있으면 현재 사용자 중 하나에 할당 (필요시 수정)
-- 주의: 이 부분은 실제 데이터 상황에 맞게 수정해야 합니다.
-- UPDATE savings SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;

-- NOT NULL 제약 조건 추가 (기존 데이터가 모두 할당된 후)
-- ALTER TABLE savings ALTER COLUMN user_id SET NOT NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_savings_user_id ON savings(user_id);

-- 3. investments 테이블에 user_id 추가
ALTER TABLE investments
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 기존 데이터가 있으면 현재 사용자 중 하나에 할당 (필요시 수정)
-- 주의: 이 부분은 실제 데이터 상황에 맞게 수정해야 합니다.
-- UPDATE investments SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;

-- NOT NULL 제약 조건 추가 (기존 데이터가 모두 할당된 후)
-- ALTER TABLE investments ALTER COLUMN user_id SET NOT NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);

-- 4. goals 테이블에 user_id 추가 (공동 목표이므로 NULL 허용)
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- goals는 공동 목표이므로 user_id는 NULL일 수 있습니다.
-- 기존 데이터는 NULL로 유지하거나, 필요시 할당
-- UPDATE goals SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- 변경 사항 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('living_expenses', 'savings', 'investments', 'goals')
  AND column_name = 'user_id'
ORDER BY table_name;
