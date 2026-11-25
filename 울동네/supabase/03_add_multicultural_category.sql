-- 다문화 카테고리 추가 마이그레이션 SQL (Supabase SQL Editor에서 1회 실행)
-- 1. 기존 category CHECK 제약조건 제거
DO $$
DECLARE
  c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.uldongne_welfare_posts'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%category%';

  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.uldongne_welfare_posts DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

-- 2. 새로운 7대 분야 CHECK 제약조건 추가
ALTER TABLE public.uldongne_welfare_posts
ADD CONSTRAINT uldongne_welfare_posts_category_check CHECK (
  category IN (
    '돌봄/아동/청소년',
    '어르신/건강',
    '주거/난방비',
    '소상공인/일자리',
    '농림/축산/어업',
    '생활/문화/법률',
    '다문화'
  )
);

-- 3. (선택) 기존 다문화 관련 공고를 '다문화' 카테고리로 재분류
UPDATE public.uldongne_welfare_posts
SET category = '다문화'
WHERE category <> '다문화'
  AND (
    app_title ~ '(다문화|결혼이민|한국어교육|이주배경|외국인)'
    OR app_summary_3lines ~ '(다문화|결혼이민|한국어교육|이주배경)'
  );
