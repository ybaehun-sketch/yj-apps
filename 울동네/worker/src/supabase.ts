import type { CrawlTarget, Env, WelfarePostInsert } from './types';

function getHeaders(env: Env): HeadersInit {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };
}

/**
 * status = 'active' 이고 last_checked_at 이 가장 오래된 타겟 N개 조회
 */
export async function fetchOldestActiveTargets(env: Env, limit: number): Promise<CrawlTarget[]> {
  const url =
    `${env.SUPABASE_URL}/rest/v1/uldongne_crawl_targets` +
    `?status=eq.active&order=last_checked_at.asc.nullsfirst&limit=${limit}`;

  const res = await fetch(url, { headers: getHeaders(env) });
  if (!res.ok) {
    throw new Error(`Supabase fetch targets failed: ${res.status} ${await res.text()}`);
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
