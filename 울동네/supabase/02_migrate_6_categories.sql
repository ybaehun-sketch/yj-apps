-- 6대 분야 개편 마이그레이션 SQL (Supabase SQL Editor에서 1회 실행)
-- 1. 기존 category CHECK 제약조건 제거 (제약 이름이 다를 경우를 대비해 동적 제거)
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

-- 2. 기존 데이터 카테고리명 일괄 정리
UPDATE public.uldongne_welfare_posts
SET category = '돌봄/아동/청소년'
WHERE category = '돌봄/육아';

UPDATE public.uldongne_welfare_posts
SET category = '생활/문화/법률'
WHERE category = '생활/문화';

-- 기존에 소상공인/일자리로 잘못 들어간 농어업·법률지원 글 재분류
UPDATE public.uldongne_welfare_posts
SET category = '농림/축산/어업'
WHERE category = '소상공인/일자리'
  AND (
    app_title ~ '(비료|농업|농기계|영농|축산|어업|수산|원양|어선|양식)'
    OR app_summary_3lines ~ '(농업인|농업경영체|어선|원양선사|유기질비료)'
  );

UPDATE public.uldongne_welfare_posts
SET category = '생활/문화/법률'
WHERE category = '소상공인/일자리'
  AND (
    app_title ~ '(법률|변론|법률구조|국선|채무조정)'
    OR app_summary_3lines ~ '(법률자문|심판변론인|법률상담)'
  );

-- 3. 새로운 6대 분야 CHECK 제약조건 추가
ALTER TABLE public.uldongne_welfare_posts
ADD CONSTRAINT uldongne_welfare_posts_category_check CHECK (
  category IN (
    '돌봄/아동/청소년',
    '어르신/건강',
    '주거/난방비',
    '소상공인/일자리',
    '농림/축산/어업',
    '생활/문화/법률'
  )
);
