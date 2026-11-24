-- ============================================================================
-- 울동네 투톱 전략 개편: 모바일 앱(AI 자동 발행) vs 웹 블로그(하루 최대 3건 대표님 검수) 분리
-- Supabase SQL Editor에서 1회 실행해 주세요.
-- ============================================================================

ALTER TABLE public.uldongne_welfare_posts
  ADD COLUMN IF NOT EXISTS app_status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (app_status IN ('draft', 'published', 'hidden')),
  ADD COLUMN IF NOT EXISTS app_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blog_status VARCHAR(20) NOT NULL DEFAULT 'none'
    CHECK (blog_status IN ('none', 'draft', 'published', 'rejected')),
  ADD COLUMN IF NOT EXISTS blog_published_at TIMESTAMPTZ;

-- 기존 데이터 이관 (AI 확신도 80점 이상은 앱 자동 노출 상태로 반영)
UPDATE public.uldongne_welfare_posts
SET
  app_status = CASE
    WHEN status = 'published' OR ai_confidence >= 80 THEN 'published'
    WHEN status = 'archived' THEN 'hidden'
    ELSE 'draft'
  END,
  app_published_at = COALESCE(
    published_at,
    CASE WHEN ai_confidence >= 80 THEN created_at ELSE NULL END
  ),
  blog_status = CASE
    WHEN status = 'published' AND publish_to_blog = true THEN 'published'
    WHEN status = 'draft' AND publish_to_blog = true THEN 'draft'
    WHEN status = 'archived' THEN 'rejected'
    ELSE 'none'
  END,
  blog_published_at = CASE
    WHEN status = 'published' AND publish_to_blog = true THEN published_at
    ELSE NULL
  END;

CREATE INDEX IF NOT EXISTS idx_uldongne_welfare_posts_app_feed
  ON public.uldongne_welfare_posts (app_status, region_code, app_published_at DESC);

CREATE INDEX IF NOT EXISTS idx_uldongne_welfare_posts_blog_feed
  ON public.uldongne_welfare_posts (blog_status, blog_published_at DESC);

-- 일반 사용자(anon, authenticated)는 앱 공개('app_status=published') 또는 블로그 공개('blog_status=published') 글 읽기 가능
DROP POLICY IF EXISTS "Public can read published uldongne_welfare_posts" ON public.uldongne_welfare_posts;
CREATE POLICY "Public can read published uldongne_welfare_posts"
  ON public.uldongne_welfare_posts
  FOR SELECT
  TO anon, authenticated
  USING (app_status = 'published' OR blog_status = 'published' OR status = 'published');
