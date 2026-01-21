-- 적금/비상금 유형 업데이트 스크립트
-- Supabase SQL Editor에서 실행하세요.
-- 기존 'SAVINGS' 타입을 'HOUSE_SAVINGS'로 변경하고, 새로운 유형들을 추가합니다.

-- 1. 기존 CHECK 제약 조건 삭제
ALTER TABLE savings DROP CONSTRAINT IF EXISTS savings_type_check;

-- 2. 기존 'SAVINGS' 타입을 'HOUSE_SAVINGS'로 변경
UPDATE savings SET type = 'HOUSE_SAVINGS' WHERE type = 'SAVINGS';

-- 3. 새로운 CHECK 제약 조건 추가 (4가지 유형)
ALTER TABLE savings 
ADD CONSTRAINT savings_type_check 
CHECK (type IN ('EMERGENCY_FUND', 'CONDOLENCE', 'TRAVEL_SAVINGS', 'HOUSE_SAVINGS'));
