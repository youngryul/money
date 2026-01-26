-- savings 테이블에 WEEK26_SAVINGS 타입 추가
-- 기존 CHECK 제약 조건을 제거하고 새로운 제약 조건 추가

-- 기존 제약 조건 제거 (제약 조건 이름 확인 필요)
ALTER TABLE savings DROP CONSTRAINT IF EXISTS savings_type_check;

-- 새로운 제약 조건 추가 (26주적금 포함)
ALTER TABLE savings 
ADD CONSTRAINT savings_type_check 
CHECK (type IN ('EMERGENCY_FUND', 'CONDOLENCE', 'TRAVEL_SAVINGS', 'HOUSE_SAVINGS', 'WEEK26_SAVINGS'));
