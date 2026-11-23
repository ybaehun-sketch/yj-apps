import { generateWelfarePost, scanBoardNotices } from './gemini';
import { pickPersonaStyle } from './personas';
import {
  checkPostExists,
  fetchOldestActiveTargets,
  insertWelfarePost,
  updateCrawlTargetState
} from './supabase';
import type { CrawlTarget, Env, ScannedNotice } from './types';
import {
  detectAttachmentOnlyNotice,
  extractCleanTextFromHtml,
  extractDetailBodyText,
  fetchWithTimeout,
  sha256Hex
} from './utils';

interface Gov24ServiceItem {
  서비스ID?: string;
  서비스명?: string;
  서비스목적요약?: string;
  지원대상?: string;
  지원내용?: string;
  신청방법?: string;
  신청기한?: string;
  소관기관명?: string;
  상세조회URL?: string;
  문의처?: string;
}

/**
 * 보조금24 API (API_GOV24) 수집 처리
 */
async function collectFromGov24Api(
  env: Env,
  target: CrawlTarget,
  maxNewPosts: number
): Promise<{ created: number; latestTitle: string | null }> {
  if (!env.GOV24_API_KEY) {
    console.warn(`[${target.org_name}] GOV24_API_KEY 미설정으로 스킵`);
    return { created: 0, latestTitle: target.last_item_title };
  }

  const apiUrl = `${target.target_url}?page=1&perPage=10&serviceKey=${encodeURIComponent(env.GOV24_API_KEY)}`;
  const res = await fetchWithTimeout(apiUrl, 15000);
  if (!res.ok) {
    throw new Error(`Gov24 API HTTP ${res.status}`);
  }

  const json = (await res.json()) as { data?: Gov24ServiceItem[] };
  const items = Array.isArray(json.data) ? json.data : [];
  if (items.length === 0) {
    return { created: 0, latestTitle: target.last_item_title };
  }

  let created = 0;
  let lastPersonaId: number | null = null;

  for (const item of items) {
    if (created >= maxNewPosts) break;
    const serviceId = item.서비스ID;
    const title = item.서비스명;
    if (!serviceId || !title) continue;

    const externalId = `gov24_${serviceId}`;
    if (await checkPostExists(env, externalId)) continue;

    const detailUrl = item.상세조회URL || `https://www.gov.kr/portal/rcvfvrSvc/dtlEx/${serviceId}`;
    const combinedText = [
      `서비스명: ${title}`,
      `소관기관: ${item.소관기관명 ?? '중앙부처'}`,
      `요약: ${item.서비스목적요약 ?? ''}`,
      `지원대상: ${item.지원대상 ?? ''}`,
      `지원내용: ${item.지원내용 ?? ''}`,
      `신청방법: ${item.신청방법 ?? ''}`,
      `신청기한: ${item.신청기한 ?? ''}`,
      `문의처: ${item.문의처 ?? ''}`
    ].join('\n');

    const persona = pickPersonaStyle(lastPersonaId);
    lastPersonaId = persona.id;

    const generated = await generateWelfarePost(env, {
      target,
      noticeTitle: title,
      detailUrl,
      detailText: combinedText,
      hasAttachmentOnly: false,
      persona
    });

    const shouldAutoPublish =
      env.AUTO_PUBLISH_ENABLED === 'true' && generated.ai_confidence >= 90;

    await insertWelfarePost(env, {
      ...generated,
      target_id: target.id,
      external_id: externalId,
      region_sido: target.region_sido,
      region_sigungu: target.region_sigungu,
      region_code: target.region_code,
      org_name: item.소관기관명 || target.org_name,
      persona_style_id: persona.id,
      has_attachment_only: false,
      auto_published: shouldAutoPublish,
      status: shouldAutoPublish ? 'published' : 'draft',
      source_url: detailUrl,
      published_at: shouldAutoPublish ? new Date().toISOString() : null
    });

    created++;
  }

  return {
    created,
    latestTitle: items[0]?.서비스명 ?? target.last_item_title
  };
}

/**
 * 웹 게시판 (WEB_BOARD / FAMILYNET) 수집 처리
 */
async function collectFromWebBoard(
  env: Env,
  target: CrawlTarget,
  maxNewPosts: number
): Promise<{ created: number; latestTitle: string | null; pageHash: string; skippedByHash: boolean }> {
  const res = await fetchWithTimeout(target.target_url, 15000);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${target.target_url}`);
  }

  const html = await res.text();
  const cleanListText = extractCleanTextFromHtml(html, target.target_url, 3000);
  const pageHash = await sha256Hex(cleanListText);

  // 해시 기반 0원 방어: 페이지 변경 없으면 AI 호출 없이 즉시 종료
  if (target.last_page_hash && target.last_page_hash === pageHash) {
    return {
      created: 0,
      latestTitle: target.last_item_title,
      pageHash,
      skippedByHash: true
    };
  }

  const candidates: ScannedNotice[] = await scanBoardNotices(
    env,
    target,
    cleanListText,
    maxNewPosts
  );

  let created = 0;
  let lastPersonaId: number | null = null;

  for (const notice of candidates) {
    if (created >= maxNewPosts) break;

    const externalId = await sha256Hex(notice.detail_url);
    if (await checkPostExists(env, externalId)) continue;

    let detailBody = notice.title;
    let hasAttachmentOnly = false;

    try {
      const detailRes = await fetchWithTimeout(notice.detail_url, 15000);
      if (detailRes.ok) {
        const detailHtml = await detailRes.text();
        detailBody = extractDetailBodyText(detailHtml, 5000);
        hasAttachmentOnly = detectAttachmentOnlyNotice(detailHtml, detailBody);
      }
    } catch (err) {
      console.warn(`[${target.org_name}] 상세 페이지 조회 지연/실패, 제목 기반 요약 진행:`, err);
      hasAttachmentOnly = true;
    }

    const persona = pickPersonaStyle(lastPersonaId);
    lastPersonaId = persona.id;

    const generated = await generateWelfarePost(env, {
      target,
      noticeTitle: notice.title,
      detailUrl: notice.detail_url,
      detailText: detailBody || notice.title,
      hasAttachmentOnly,
      persona
    });

    const shouldAutoPublish =
      env.AUTO_PUBLISH_ENABLED === 'true' &&
      !hasAttachmentOnly &&
      generated.ai_confidence >= 90;

    await insertWelfarePost(env, {
      ...generated,
      target_id: target.id,
      external_id: externalId,
      region_sido: target.region_sido,
      region_sigungu: target.region_sigungu,
      region_code: target.region_code,
      org_name: target.org_name,
      persona_style_id: persona.id,
      has_attachment_only: hasAttachmentOnly,
      auto_published: shouldAutoPublish,
      status: shouldAutoPublish ? 'published' : 'draft',
      source_url: notice.detail_url,
      published_at: shouldAutoPublish ? new Date().toISOString() : null
    });

    created++;
  }

  return {
    created,
    latestTitle: candidates[0]?.title ?? target.last_item_title,
    pageHash,
    skippedByHash: false
  };
}

/**
 * 분산 순찰 메인 실행 함수
 */
export async function runPatrol(env: Env): Promise<{
  checkedTargets: number;
  createdPosts: number;
  skippedByHash: number;
  errors: number;
}> {
  const maxTargets = Number(env.MAX_TARGETS_PER_RUN || '12');
  const maxNewPosts = Number(env.MAX_NEW_POSTS_PER_TARGET || '5');
  const targets = await fetchOldestActiveTargets(env, maxTargets);

  let createdPosts = 0;
  let skippedByHash = 0;
  let errors = 0;

  for (const target of targets) {
    const nowIso = new Date().toISOString();
    try {
      if (target.source_type === 'API_GOV24') {
        const result = await collectFromGov24Api(env, target, maxNewPosts);
        createdPosts += result.created;
        await updateCrawlTargetState(env, target.id, {
          last_item_title: result.latestTitle,
          fail_count: 0,
          status: 'active',
          last_checked_at: nowIso
        });
      } else {
        const result = await collectFromWebBoard(env, target, maxNewPosts);
        createdPosts += result.created;
        if (result.skippedByHash) skippedByHash++;

        await updateCrawlTargetState(env, target.id, {
          last_page_hash: result.pageHash,
          last_item_title: result.latestTitle,
          fail_count: 0,
          status: 'active',
          last_checked_at: nowIso
        });
      }
    } catch (err) {
      errors++;
      const nextFailCount = (target.fail_count ?? 0) + 1;
      const nextStatus = nextFailCount >= 3 ? 'error' : 'active';
      console.error(`[${target.org_name}] 순찰 실패 (${nextFailCount}/3):`, err);

      await updateCrawlTargetState(env, target.id, {
        fail_count: nextFailCount,
        status: nextStatus,
        last_checked_at: nowIso
      });
    }
  }

  return {
    checkedTargets: targets.length,
    createdPosts,
    skippedByHash,
    errors
  };
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runPatrol(env).then((summary) => {
        console.log('[울동네 순찰 완료]', JSON.stringify(summary));
      })
    );
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/') {
      return Response.json({
        service: 'uldongne-patrol-worker',
        status: 'ok'
      });
    }

    if (request.method === 'POST' && url.pathname === '/run') {
      const auth = request.headers.get('Authorization') ?? '';
      if (!env.WORKER_ADMIN_SECRET || auth !== `Bearer ${env.WORKER_ADMIN_SECRET}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const summary = await runPatrol(env);
      return Response.json({ ok: true, summary });
    }

    return Response.json({ error: 'Not Found' }, { status: 404 });
  }
};
