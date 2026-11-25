-- ============================================================================
-- 울동네 (전국구·로컬 생활밀착 복지 큐레이션 플랫폼)
-- 1단계: Supabase PostgreSQL 스키마 및 홍천군(Phase 1) 초기 시드 데이터
-- ============================================================================

-- UUID 생성 확장 활성화
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. uldongne_crawl_targets (AI 순찰대 타겟 명단)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.uldongne_crawl_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_sido TEXT NOT NULL,                      -- 예: '강원특별자치도', '전국'
  region_sigungu TEXT NOT NULL,                   -- 예: '홍천군', '전체'
  region_code VARCHAR(10) NOT NULL,               -- 행정표준코드 5자리 (홍천군: '51720', 전국: '00000')
  org_name TEXT NOT NULL,                         -- 기관/게시판명
  source_type VARCHAR(20) NOT NULL CHECK (
    source_type IN ('API_GOV24', 'API_WELFARE', 'WEB_BOARD', 'FAMILYNET')
  ),
  target_url TEXT NOT NULL,                       -- 게시판 목록 URL 또는 API 엔드포인트
  last_page_hash TEXT,                            -- SHA-256 해시 (변경 없으면 AI 호출 스킵)
  last_item_title TEXT,                           -- 마지막 수집 최신 공고 제목
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'error', 'paused')
  ),
  fail_count INT NOT NULL DEFAULT 0,              -- 3회 연속 실패 시 'error' 전환
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_uldongne_crawl_targets_url UNIQUE (target_url)
);

CREATE INDEX IF NOT EXISTS idx_uldongne_crawl_targets_poll
  ON public.uldongne_crawl_targets (status, last_checked_at ASC NULLS FIRST);

CREATE INDEX IF NOT EXISTS idx_uldongne_crawl_targets_region_code
  ON public.uldongne_crawl_targets (region_code);

-- ----------------------------------------------------------------------------
-- 2. uldongne_welfare_posts (수집 및 가공된 콘텐츠 마스터)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.uldongne_welfare_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID REFERENCES public.uldongne_crawl_targets(id) ON DELETE SET NULL,
  external_id TEXT NOT NULL UNIQUE,               -- 원문 URL 해시 또는 공공데이터 서비스 ID
  region_sido TEXT NOT NULL,
  region_sigungu TEXT NOT NULL,
  region_code VARCHAR(10) NOT NULL,               -- 인덱싱 필수 ('51720', '00000' 등)
  org_name TEXT NOT NULL,                         -- 출처 기관명 (스토어 심사 투명성 고지용)
  category VARCHAR(30) NOT NULL CHECK (
    category IN ('돌봄/아동/청소년', '어르신/건강', '주거/난방비', '소상공인/일자리', '농림/축산/어업', '생활/문화/법률')
  ),
  keywords TEXT[] NOT NULL DEFAULT '{}',          -- 동의어 포함 확장 키워드 배열
  app_title TEXT NOT NULL,                        -- 앱 카드용 직관적 제목 (30자 이내 권장)
  app_summary_3lines TEXT NOT NULL,               -- 앱 카드용 AI 3줄 요약 (대상/혜택/신청방법)
  app_detail_summary TEXT NOT NULL,               -- 앱 상세 화면용 핵심 요약 본문
  blog_title TEXT,                                -- SEO 최적화 제목
  blog_content_md TEXT,                           -- 30가지 글맛 + 꿀팁 + 체크리스트 마크다운
  persona_style_id INT CHECK (persona_style_id BETWEEN 1 AND 30),
  publish_to_blog BOOLEAN NOT NULL DEFAULT FALSE, -- 웹 블로그 동시 발행 여부
  has_attachment_only BOOLEAN NOT NULL DEFAULT FALSE, -- 본문 없이 HWP/PDF 첨부파일 위주 공고 여부
  ai_confidence INT NOT NULL DEFAULT 80 CHECK (ai_confidence BETWEEN 0 AND 100),
  auto_published BOOLEAN NOT NULL DEFAULT FALSE,  -- 신뢰도 기준 충족 자동 발행 여부
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'published', 'archived')
  ),
  app_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (
    app_status IN ('draft', 'published', 'hidden')
  ),
  app_published_at TIMESTAMPTZ,
  blog_status VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (
    blog_status IN ('none', 'draft', 'published', 'rejected')
  ),
  blog_published_at TIMESTAMPTZ,
  deadline_date DATE,                             -- 신청 마감일 (D-Day 계산용)
  contact_phone TEXT,                             -- 문의처 전화번호
  source_url TEXT NOT NULL,                       -- 공식 공고 원문 링크
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_uldongne_welfare_posts_feed
  ON public.uldongne_welfare_posts (status, region_code, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_uldongne_welfare_posts_deadline
  ON public.uldongne_welfare_posts (status, deadline_date ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_uldongne_welfare_posts_keywords
  ON public.uldongne_welfare_posts USING GIN (keywords);

CREATE INDEX IF NOT EXISTS idx_uldongne_welfare_posts_blog
  ON public.uldongne_welfare_posts (status, publish_to_blog, published_at DESC);

-- ----------------------------------------------------------------------------
-- 3. updated_at 자동 갱신 트리거
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.uldongne_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_uldongne_crawl_targets_updated_at ON public.uldongne_crawl_targets;
CREATE TRIGGER trg_uldongne_crawl_targets_updated_at
  BEFORE UPDATE ON public.uldongne_crawl_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.uldongne_set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Row Level Security (RLS) 정책
--    - 일반 사용자(anon, authenticated): 발행된('published') 공고만 읽기 가능
--    - 수집 워커/어드민(service_role): 전체 접근 가능
-- ----------------------------------------------------------------------------
ALTER TABLE public.uldongne_crawl_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uldongne_welfare_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published uldongne_welfare_posts" ON public.uldongne_welfare_posts;
CREATE POLICY "Public can read published uldongne_welfare_posts"
  ON public.uldongne_welfare_posts
  FOR SELECT
  TO anon, authenticated
  USING (app_status = 'published' OR blog_status = 'published' OR status = 'published');

-- ----------------------------------------------------------------------------
-- 5. Phase 1 홍천군 거점 초기 시드 데이터 (uldongne_crawl_targets)
-- ----------------------------------------------------------------------------
INSERT INTO public.uldongne_crawl_targets (
  region_sido, region_sigungu, region_code, org_name, source_type, target_url, status
) VALUES
  (
    '전국', '전체', '00000',
    '행정안전부 보조금24 공공서비스 API',
    'API_GOV24',
    'https://api.odcloud.kr/api/gov24/v3/serviceList',
    'active'
  ),
  (
    '전국', '전체', '00000',
    '보건복지부 복지로 중앙부처 복지서비스 API',
    'API_WELFARE',
    'https://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001',
    'active'
  ),
  (
    '전국', '전체', '00000',
    '보건복지부 복지로 지자체 복지서비스 API',
    'API_WELFARE',
    'https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfarelist',
    'active'
  ),
  (
    '강원특별자치도', '홍천군', '51720',
    '홍천군청 공지사항',
    'WEB_BOARD',
    'https://www.hongcheon.go.kr/www/selectBbsNttList.do?bbsNo=1&key=255',
    'active'
  ),
  (
    '강원특별자치도', '홍천군', '51720',
    '홍천군청 고시공고',
    'WEB_BOARD',
    'https://www.hongcheon.go.kr/www/selectEminwonList.do?key=278',
    'active'
  ),
  (
    '강원특별자치도', '홍천군', '51720',
    '홍천군가족센터 공지사항',
    'FAMILYNET',
    'https://hongcheon.familynet.or.kr/center/lay1/bbs/S295T311C312/A/6/list.do',
    'active'
  ),
  (
    '강원특별자치도', '홍천군', '51720',
    '홍천군가족센터 프로그램홍보',
    'FAMILYNET',
    'https://hongcheon.familynet.or.kr/center/lay1/program/S295T322C449/receipt/list.do',
    'active'
  ),
  (
    '강원특별자치도', '홍천군', '51720',
    '강원특별자치도홍천교육지원청 알림마당',
    'WEB_BOARD',
    'https://gwhce.gwe.go.kr/boardCnts/list.do?boardID=1515&m=040101&s=gwhce',
    'active'
  )
ON CONFLICT (target_url) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. 권한 부여 (신규 프로젝트/독립 구역 접근 허용)
-- ----------------------------------------------------------------------------
GRANT ALL ON TABLE public.uldongne_crawl_targets TO service_role;
GRANT ALL ON TABLE public.uldongne_welfare_posts TO service_role;
GRANT SELECT ON TABLE public.uldongne_welfare_posts TO anon, authenticated;
