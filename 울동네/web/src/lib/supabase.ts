import type { CrawlTarget, PatrolBriefing, WelfarePost } from './types';

function getPublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function getAdminConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

/**
 * 퍼블릭 웹 매거진 목록 조회 (blog_status='published', 검색어/카테고리/페이지네이션 지원)
 */
export async function fetchPublishedBlogPosts(options?: {
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ posts: WelfarePost[]; totalCount: number }> {
  const cfg = getPublicConfig();
  if (!cfg) return { posts: [], totalCount: 0 };

  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, options?.pageSize ?? 10);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query =
    `${cfg.url}/rest/v1/uldongne_welfare_posts` +
    `?blog_status=eq.published&order=blog_published_at.desc.nullslast,created_at.desc`;

  if (options?.category && options.category !== '전체') {
    query += `&category=eq.${encodeURIComponent(options.category)}`;
  }

  const trimmedQ = options?.q?.trim();
  if (trimmedQ) {
    const safeQ = trimmedQ.replace(/[(),*]/g, ' ').trim();
    if (safeQ) {
      const pattern = `*${safeQ}*`;
      query += `&or=(${encodeURIComponent(`blog_title.ilike.${pattern},app_title.ilike.${pattern},blog_content_md.ilike.${pattern}`)})`;
    }
  }

  const res = await fetch(query, {
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      Prefer: 'count=exact',
      Range: `${from}-${to}`
    },
    cache: 'no-store'
  });

  if (!res.ok) return { posts: [], totalCount: 0 };
  const posts = (await res.json()) as WelfarePost[];
  const contentRange = res.headers.get('content-range') ?? '';
  const totalMatch = contentRange.match(/\/(\d+)$/);
  const totalCount = totalMatch ? Number(totalMatch[1]) : posts.length;
  return { posts, totalCount };
}

/**
 * 퍼블릭 웹 매거진 단일 글 조회
 */
export async function fetchPublishedPostById(id: string): Promise<WelfarePost | null> {
  const cfg = getPublicConfig();
  if (!cfg) return null;

  const query =
    `${cfg.url}/rest/v1/uldongne_welfare_posts` +
    `?id=eq.${encodeURIComponent(id)}&blog_status=eq.published&limit=1`;

  const res = await fetch(query, {
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`
    },
    next: { revalidate: 60 }
  });

  if (!res.ok) return null;
  const rows = (await res.json()) as WelfarePost[];
  return rows[0] ?? null;
}

/**
 * 어드민: 블로그 초안 검토 대기(blog_status='draft') 목록 조회
 */
export async function fetchDraftPosts(): Promise<WelfarePost[]> {
  const cfg = getAdminConfig();
  if (!cfg) return [];

  const query =
    `${cfg.url}/rest/v1/uldongne_welfare_posts` +
    `?blog_status=eq.draft&order=created_at.desc&limit=50`;

  const res = await fetch(query, {
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`fetchDraftPosts failed: ${res.status}`);
  }
  return (await res.json()) as WelfarePost[];
}

/**
 * 어드민: AI가 앱에 자동 발행한 카드 목록 조회
 */
export async function fetchAppPublishedPosts(): Promise<WelfarePost[]> {
  const cfg = getAdminConfig();
  if (!cfg) return [];

  const query =
    `${cfg.url}/rest/v1/uldongne_welfare_posts` +
    `?app_status=eq.published&order=app_published_at.desc.nullslast,created_at.desc&limit=30`;

  const res = await fetch(query, {
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`
    },
    cache: 'no-store'
  });

  if (!res.ok) return [];
  return (await res.json()) as WelfarePost[];
}

/**
 * 어드민: 애매한 구간(70~84점) 앱 검토 대기 목록 조회 (app_status='draft')
 */
export async function fetchAppPendingPosts(): Promise<WelfarePost[]> {
  const cfg = getAdminConfig();
  if (!cfg) return [];

  const query =
    `${cfg.url}/rest/v1/uldongne_welfare_posts` +
    `?app_status=eq.draft&ai_confidence=gte.70&ai_confidence=lt.85&order=created_at.desc&limit=50`;

  const res = await fetch(query, {
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`
    },
    cache: 'no-store'
  });

  if (!res.ok) return [];
  return (await res.json()) as WelfarePost[];
}

/**
 * 어드민: 공고 수정 및 상태 변경 (발행/보관)
 */
export async function updateWelfarePostAdmin(
  id: string,
  patch: Partial<WelfarePost>
): Promise<WelfarePost> {
  const cfg = getAdminConfig();
  if (!cfg) throw new Error('Supabase admin config missing');

  const query = `${cfg.url}/rest/v1/uldongne_welfare_posts?id=eq.${encodeURIComponent(id)}`;
  const res = await fetch(query, {
    method: 'PATCH',
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(patch),
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`updateWelfarePostAdmin failed: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as WelfarePost[];
  if (!rows[0]) throw new Error('Updated post not found');
  return rows[0];
}

/**
 * 어드민: AI 순찰대 타겟 전체 조회
 */
export async function fetchCrawlTargetsAdmin(): Promise<CrawlTarget[]> {
  const cfg = getAdminConfig();
  if (!cfg) return [];

  const query = `${cfg.url}/rest/v1/uldongne_crawl_targets?order=status.asc,region_code.asc,org_name.asc`;
  const res = await fetch(query, {
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`fetchCrawlTargetsAdmin failed: ${res.status}`);
  }
  return (await res.json()) as CrawlTarget[];
}

/**
 * 어드민: 신규 순찰 타겟 등록
 */
export async function createCrawlTargetAdmin(input: {
  region_sido: string;
  region_sigungu: string;
  region_code: string;
  org_name: string;
  source_type: CrawlTarget['source_type'];
  target_url: string;
}): Promise<CrawlTarget> {
  const cfg = getAdminConfig();
  if (!cfg) throw new Error('Supabase admin config missing');

  const res = await fetch(`${cfg.url}/rest/v1/uldongne_crawl_targets`, {
    method: 'POST',
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({ ...input, status: 'active' }),
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`createCrawlTargetAdmin failed: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as CrawlTarget[];
  return rows[0];
}

/**
 * 어드민: 오류 타겟 상태 복구 ('active', fail_count=0)
 */
export async function resetCrawlTargetAdmin(id: string): Promise<void> {
  const cfg = getAdminConfig();
  if (!cfg) throw new Error('Supabase admin config missing');

  const res = await fetch(`${cfg.url}/rest/v1/uldongne_crawl_targets?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'active', fail_count: 0 }),
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`resetCrawlTargetAdmin failed: ${res.status}`);
  }
}

/**
 * 어드민: 기존 타겟의 지역코드 조회 (없으면 '00000')
 */
export async function findRegionCodeAdmin(
  regionSido: string,
  regionSigungu: string
): Promise<string> {
  const cfg = getAdminConfig();
  if (!cfg) return '00000';

  const query =
    `${cfg.url}/rest/v1/uldongne_crawl_targets` +
    `?select=region_code&region_sido=eq.${encodeURIComponent(regionSido)}` +
    `&region_sigungu=eq.${encodeURIComponent(regionSigungu)}&limit=1`;
  const res = await fetch(query, {
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`
    },
    cache: 'no-store'
  });
  if (!res.ok) return '00000';
  const rows = (await res.json()) as Array<{ region_code?: string }>;
  return rows[0]?.region_code || '00000';
}

/**
 * 어드민: 타겟 주소(및 이름) 수정 + 정상 상태 복구
 */
export async function updateCrawlTargetUrlAdmin(
  id: string,
  targetUrl: string,
  orgName?: string
): Promise<CrawlTarget> {
  const cfg = getAdminConfig();
  if (!cfg) throw new Error('Supabase admin config missing');

  const payload: Record<string, unknown> = {
    target_url: targetUrl,
    status: 'active',
    fail_count: 0,
    last_page_hash: null,
    last_item_title: null
  };
  if (orgName && orgName.trim()) {
    payload.org_name = orgName.trim();
  }

  const res = await fetch(`${cfg.url}/rest/v1/uldongne_crawl_targets?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(payload),
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`updateCrawlTargetUrlAdmin failed: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as CrawlTarget[];
  return rows[0];
}

/**
 * 어드민: 순찰 타겟 일시정지 / 재개 전환
 */
export async function updateCrawlTargetStatusAdmin(
  id: string,
  status: 'active' | 'paused'
): Promise<CrawlTarget> {
  const cfg = getAdminConfig();
  if (!cfg) throw new Error('Supabase admin config missing');

  const payload =
    status === 'active'
      ? { status: 'active', fail_count: 0 }
      : { status: 'paused' };

  const res = await fetch(`${cfg.url}/rest/v1/uldongne_crawl_targets?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(payload),
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`updateCrawlTargetStatusAdmin failed: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as CrawlTarget[];
  return rows[0];
}

/**
 * 어드민: 순찰 타겟 삭제
 */
export async function deleteCrawlTargetAdmin(id: string): Promise<void> {
  const cfg = getAdminConfig();
  if (!cfg) throw new Error('Supabase admin config missing');

  const res = await fetch(`${cfg.url}/rest/v1/uldongne_crawl_targets?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`deleteCrawlTargetAdmin failed: ${res.status}`);
  }
}

/**
 * 어드민: 최근 순찰 브리핑 이력 조회 (최대 180건 = 약 30~60일치)
 * 테이블 생성 전이거나 일시 오류 시 빈 배열을 반환해 검수실 화면이 깨지지 않게 보호
 */
export async function fetchPatrolBriefingsAdmin(limit = 180): Promise<PatrolBriefing[]> {
  const cfg = getAdminConfig();
  if (!cfg) return [];

  try {
    const query =
      `${cfg.url}/rest/v1/uldongne_patrol_briefings` +
      `?select=*&order=patrol_date.desc,slot.asc,patrol_type.asc&limit=${limit}`;
    const res = await fetch(query, {
      headers: {
        apikey: cfg.serviceKey,
        Authorization: `Bearer ${cfg.serviceKey}`
      },
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as PatrolBriefing[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
