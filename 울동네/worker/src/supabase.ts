import type { BlogCandidateRow, CrawlTarget, Env, WelfarePostInsert } from './types';

function getHeaders(env: Env): HeadersInit {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };
}

/**
 * status = 'active' 이고 last_checked_at 이 가장 오래된 타겟 N개 조회
 * (이어달리기 회차에서는 roundStartedAt 이전에 점검된 타겟만 조회)
 */
export async function fetchOldestActiveTargets(
  env: Env,
  limit: number,
  checkedBeforeIso?: string,
  sigungu?: string
): Promise<CrawlTarget[]> {
  const roundFilter = checkedBeforeIso
    ? `&or=(last_checked_at.is.null,last_checked_at.lt.${encodeURIComponent(checkedBeforeIso)})`
    : '';
  const sigunguFilter = sigungu
    ? `&region_sigungu=eq.${encodeURIComponent(sigungu)}`
    : '';
  const url =
    `${env.SUPABASE_URL}/rest/v1/uldongne_crawl_targets` +
    `?status=eq.active${roundFilter}${sigunguFilter}&order=last_checked_at.asc.nullsfirst&limit=${limit}`;

  const res = await fetch(url, { headers: getHeaders(env) });
  if (!res.ok) {
    throw new Error(`Supabase fetch targets failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as CrawlTarget[];
}

/**
 * 특정 타겟 ID 1건 조회 (개별 주소 재순찰용)
 */
export async function fetchTargetById(env: Env, targetId: string): Promise<CrawlTarget[]> {
  const url =
    `${env.SUPABASE_URL}/rest/v1/uldongne_crawl_targets` +
    `?id=eq.${encodeURIComponent(targetId)}&limit=1`;

  const res = await fetch(url, { headers: getHeaders(env) });
  if (!res.ok) {
    throw new Error(`Supabase fetchTargetById failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as CrawlTarget[];
}

/**
 * 오류('error') 또는 일시정지('paused')로 멈춘 타겟 N개 조회 (오후 6시 재점검용)
 */
export async function fetchStoppedTargets(
  env: Env,
  limit: number,
  checkedBeforeIso?: string
): Promise<CrawlTarget[]> {
  const roundFilter = checkedBeforeIso
    ? `&or=(last_checked_at.is.null,last_checked_at.lt.${encodeURIComponent(checkedBeforeIso)})`
    : '';
  const url =
    `${env.SUPABASE_URL}/rest/v1/uldongne_crawl_targets` +
    `?status=in.(error,paused)${roundFilter}&order=last_checked_at.asc.nullsfirst&limit=${limit}`;

  const res = await fetch(url, { headers: getHeaders(env) });
  if (!res.ok) {
    throw new Error(`Supabase fetch stopped targets failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as CrawlTarget[];
}

/**
 * 무료 일반 접속 예비순찰대 대상 조회
 * - 본순찰대 접속 실패('[예비순찰대 필요]') 또는 오류/일시정지 상태인 웹 게시판 타겟
 */
export async function fetchReserveTargets(
  env: Env,
  limit: number,
  sigungu?: string
): Promise<CrawlTarget[]> {
  const sigunguFilter = sigungu
    ? `&region_sigungu=eq.${encodeURIComponent(sigungu)}`
    : '';
  const reserveOr = `&or=(last_item_title.like.${encodeURIComponent('[예비순찰대 필요]%')},last_item_title.like.${encodeURIComponent('[예비순찰대 접속 실패]%')},status.eq.error)`;
  const url =
    `${env.SUPABASE_URL}/rest/v1/uldongne_crawl_targets` +
    `?source_type=in.(WEB_BOARD,FAMILYNET)${reserveOr}${sigunguFilter}&order=last_checked_at.asc.nullsfirst&limit=${limit}`;

  const res = await fetch(url, { headers: getHeaders(env) });
  if (!res.ok) {
    throw new Error(`Supabase fetch reserve targets failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as CrawlTarget[];
}

/**
 * 타겟 순찰 결과 갱신 (성공 시 해시/시간 업데이트, 3회 연속 실패 시 'error' 전환)
 */
export async function updateCrawlTargetState(
  env: Env,
  targetId: string,
  patch: Partial<Pick<CrawlTarget, 'last_page_hash' | 'last_item_title' | 'status' | 'fail_count' | 'last_checked_at'>>
): Promise<void> {
  const url = `${env.SUPABASE_URL}/rest/v1/uldongne_crawl_targets?id=eq.${encodeURIComponent(targetId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(env),
    body: JSON.stringify(patch)
  });

  if (!res.ok) {
    throw new Error(`Supabase update target failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * external_id 중복 여부 확인 (이미 저장된 공고면 2차 AI 호출 방지)
 */
export async function checkPostExists(env: Env, externalId: string): Promise<boolean> {
  const url =
    `${env.SUPABASE_URL}/rest/v1/uldongne_welfare_posts` +
    `?external_id=eq.${encodeURIComponent(externalId)}&select=id&limit=1`;

  const res = await fetch(url, { headers: getHeaders(env) });
  if (!res.ok) {
    throw new Error(`Supabase checkPostExists failed: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as Array<{ id: string }>;
  return rows.length > 0;
}

/**
 * 오늘(KST 기준) 생성된 블로그 초안/발행 글 수 조회 (하루 최대 2~3건 제한용)
 */
export async function countTodayBlogDrafts(env: Env): Promise<number> {
  const now = new Date();
  const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const kstStartIso = new Date(`${kstDate}T00:00:00+09:00`).toISOString();

  const url =
    `${env.SUPABASE_URL}/rest/v1/uldongne_welfare_posts` +
    `?blog_status=in.(draft,published)&created_at=gte.${encodeURIComponent(kstStartIso)}&select=id`;

  const res = await fetch(url, { headers: getHeaders(env) });
  if (!res.ok) {
    throw new Error(`Supabase countTodayBlogDrafts failed: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as Array<{ id: string }>;
  return rows.length;
}

/**
 * 가공된 복지 공고 저장 (중복 external_id 충돌 시 무시)
 */
export async function insertWelfarePost(env: Env, post: WelfarePostInsert): Promise<void> {
  const url = `${env.SUPABASE_URL}/rest/v1/uldongne_welfare_posts`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...getHeaders(env),
      Prefer: 'resolution=ignore-duplicates,return=minimal'
    },
    body: JSON.stringify(post)
  });

  if (!res.ok) {
    throw new Error(`Supabase insertWelfarePost failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * 모아둔 블로그 후보 목록 조회 (publish_to_blog = true && blog_status = 'none')
 * ai_confidence(정확도+검색가치) 높은 순으로 정렬해 반환
 */
export async function fetchBlogCandidates(env: Env): Promise<BlogCandidateRow[]> {
  const url =
    `${env.SUPABASE_URL}/rest/v1/uldongne_welfare_posts` +
    `?publish_to_blog=eq.true&blog_status=eq.none` +
    `&select=id,region_sido,region_sigungu,org_name,category,app_title,app_summary_3lines,app_detail_summary,source_url,contact_phone,deadline_date,persona_style_id,ai_confidence` +
    `&order=ai_confidence.desc,created_at.desc&limit=50`;

  const res = await fetch(url, { headers: getHeaders(env) });
  if (!res.ok) {
    throw new Error(`Supabase fetchBlogCandidates failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as BlogCandidateRow[];
}

/**
 * 선별된 후보 1건을 블로그 초안('draft')으로 승격 저장
 */
export async function promoteCandidateToBlogDraft(
  env: Env,
  postId: string,
  blogTitle: string,
  blogContentMd: string
): Promise<void> {
  const url = `${env.SUPABASE_URL}/rest/v1/uldongne_welfare_posts?id=eq.${encodeURIComponent(postId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(env),
    body: JSON.stringify({
      blog_title: blogTitle,
      blog_content_md: blogContentMd,
      blog_status: 'draft'
    })
  });

  if (!res.ok) {
    throw new Error(`Supabase promoteCandidateToBlogDraft failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * 새벽 5시 선별에서 제외된 나머지 후보 정리 (다음 날 후보와 섞이지 않도록)
 */
export async function clearRemainingBlogCandidates(env: Env, postIds: string[]): Promise<void> {
  if (postIds.length === 0) return;
  const inClause = postIds.map((id) => encodeURIComponent(id)).join(',');
  const url = `${env.SUPABASE_URL}/rest/v1/uldongne_welfare_posts?id=in.(${inClause})`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(env),
    body: JSON.stringify({
      publish_to_blog: false
    })
  });

  if (!res.ok) {
    throw new Error(`Supabase clearRemainingBlogCandidates failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * 오래된·마감된 일반 앱 소식 자동 청소 (매일 새벽 5시 1회 실행)
 * - 블로그 글(draft/published)은 영구 보존(blog_status = 'none'만 대상)
 * - 검토 대기(app_status = 'draft') 14일 경과, 마감일 14일 경과, 게시 60일 경과 글 정리
 */
export async function cleanupOldWelfarePosts(env: Env): Promise<number> {
  const now = Date.now();
  const iso14DaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
  const iso60DaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();
  const kst14DaysAgoDate = new Date(now + 9 * 60 * 60 * 1000 - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const orClause =
    `or=(` +
    `and(app_status.eq.draft,created_at.lt.${encodeURIComponent(iso14DaysAgo)}),` +
    `and(deadline_date.not.is.null,deadline_date.lt.${encodeURIComponent(kst14DaysAgoDate)}),` +
    `created_at.lt.${encodeURIComponent(iso60DaysAgo)}` +
    `)`;

  const url =
    `${env.SUPABASE_URL}/rest/v1/uldongne_welfare_posts` +
    `?blog_status=eq.none&${orClause}&select=id`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...getHeaders(env),
      Prefer: 'return=representation'
    }
  });

  if (!res.ok) {
    throw new Error(`Supabase cleanupOldWelfarePosts failed: ${res.status} ${await res.text()}`);
  }

  const deleted = (await res.json()) as Array<{ id: string }>;
  return deleted.length;
}
