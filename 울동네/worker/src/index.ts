import { sendFcmTopicsForPost } from './fcm';
import { generateBlogDraftArticle, generateWelfarePost, scanBoardNotices } from './gemini';
import { pickPersonaStyle } from './personas';
import { resolveRegionFromApiMetadata, type ResolvedRegion } from './regions';
import {
  checkPostExists,
  clearRemainingBlogCandidates,
  countTodayBlogDrafts,
  fetchBlogCandidates,
  fetchOldestActiveTargets,
  fetchStoppedTargets,
  insertWelfarePost,
  promoteCandidateToBlogDraft,
  updateCrawlTargetState
} from './supabase';
import type { CrawlTarget, Env, GeneratedWelfarePost, ScannedNotice } from './types';
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
 * 순찰 단계 저장·알림 공통 처리:
 * - 앱: AI 확신도 기준(기본 80점) 이상이면 즉시 자동 발행 + 푸시 알림
 * - 블로그: 순찰 중에는 후보('publish_to_blog = true', 'blog_status = none')로만 모아두고,
 *           매일 새벽 5시 최후 순찰 후 최상위 최대 3건만 초안('draft')으로 작성
 */
async function saveAndNotifyPost(
  env: Env,
  params: {
    target: CrawlTarget;
    generated: GeneratedWelfarePost;
    externalId: string;
    orgName: string;
    personaId: number;
    hasAttachmentOnly: boolean;
    sourceUrl: string;
    regionOverride?: ResolvedRegion;
  }
): Promise<void> {
  const { target, generated, externalId, orgName, personaId, hasAttachmentOnly, sourceUrl, regionOverride } = params;
  const region = regionOverride ?? {
    region_sido: target.region_sido,
    region_sigungu: target.region_sigungu,
    region_code: target.region_code
  };
  const nowIso = new Date().toISOString();
  const minConfidence = Number(env.APP_AUTO_PUBLISH_MIN_CONFIDENCE ?? 80);

  const shouldAutoPublishApp =
    env.AUTO_PUBLISH_ENABLED !== 'false' && generated.ai_confidence >= minConfidence;

  await insertWelfarePost(env, {
    ...generated,
    target_id: target.id,
    external_id: externalId,
    region_sido: region.region_sido,
    region_sigungu: region.region_sigungu,
    region_code: region.region_code,
    org_name: orgName,
    persona_style_id: personaId,
    has_attachment_only: hasAttachmentOnly,
    auto_published: shouldAutoPublishApp,
    status: shouldAutoPublishApp ? 'published' : 'draft',
    app_status: shouldAutoPublishApp ? 'published' : 'draft',
    app_published_at: shouldAutoPublishApp ? nowIso : null,
    blog_status: 'none',
    blog_published_at: null,
    source_url: sourceUrl,
    published_at: shouldAutoPublishApp ? nowIso : null
  });

  if (shouldAutoPublishApp) {
    try {
      await sendFcmTopicsForPost(env, {
        external_id: externalId,
        region_code: region.region_code,
        region_sigungu: region.region_sigungu,
        category: generated.category,
        keywords: generated.keywords,
        app_title: generated.app_title,
        app_summary_3lines: generated.app_summary_3lines
      });
    } catch (err) {
      console.warn(`[${orgName}] 앱 자동 푸시 발송 실패 (앱 카드 등록은 완료됨):`, err);
    }
  }
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
  const res = await fetchWithTimeout(apiUrl, 30000);
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
    const resolvedRegion = resolveRegionFromApiMetadata(
      { orgName: item.소관기관명 },
      target
    );
    const effectiveTarget = { ...target, ...resolvedRegion };

    const generated = await generateWelfarePost(env, {
      target: effectiveTarget,
      noticeTitle: title,
      detailUrl,
      detailText: combinedText,
      hasAttachmentOnly: false,
      persona
    });

    await saveAndNotifyPost(env, {
      target,
      generated,
      externalId,
      orgName: item.소관기관명 || target.org_name,
      personaId: persona.id,
      hasAttachmentOnly: false,
      sourceUrl: detailUrl,
      regionOverride: resolvedRegion
    });

    created++;
  }

  return {
    created,
    latestTitle: items[0]?.서비스명 ?? target.last_item_title
  };
}

function extractXmlTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!match) return '';
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * 복지로 API (API_WELFARE: 중앙부처/지자체 복지서비스) 수집 처리
 */
async function collectFromWelfareApi(
  env: Env,
  target: CrawlTarget,
  maxNewPosts: number
): Promise<{ created: number; latestTitle: string | null }> {
  if (!env.WELFARE_API_KEY) {
    console.warn(`[${target.org_name}] WELFARE_API_KEY 미설정으로 스킵`);
    return { created: 0, latestTitle: target.last_item_title };
  }

  const sep = target.target_url.includes('?') ? '&' : '?';
  const apiUrl = `${target.target_url}${sep}serviceKey=${encodeURIComponent(env.WELFARE_API_KEY)}&callTp=L&pageNo=1&numOfRows=10&srchKeyCode=003`;
  const res = await fetchWithTimeout(apiUrl, 30000);
  if (!res.ok) {
    throw new Error(`Welfare API HTTP ${res.status}`);
  }

  const xml = await res.text();
  const blocks = xml.match(/<servList>[\s\S]*?<\/servList>/gi) ?? [];
  if (blocks.length === 0) {
    return { created: 0, latestTitle: target.last_item_title };
  }

  let created = 0;
  let lastPersonaId: number | null = null;
  let firstTitle: string | null = null;

  for (const block of blocks) {
    if (created >= maxNewPosts) break;
    const servId = extractXmlTag(block, 'servId');
    const title = extractXmlTag(block, 'servNm');
    if (!servId || !title) continue;
    if (!firstTitle) firstTitle = title;

    const externalId = `welfare_${servId}`;
    if (await checkPostExists(env, externalId)) continue;

    const ctpvNm = extractXmlTag(block, 'ctpvNm');
    const sggNm = extractXmlTag(block, 'sggNm');
    const jurMnofNm = extractXmlTag(block, 'jurMnofNm');
    const orgName = [ctpvNm, sggNm, jurMnofNm].filter(Boolean).join(' ') || target.org_name;
    const detailUrl =
      extractXmlTag(block, 'servDtlLink') ||
      `https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=${servId}`;

    const combinedText = [
      `서비스명: ${title}`,
      `소관기관/지역: ${orgName}`,
      `요약: ${extractXmlTag(block, 'servDgst')}`,
      `생애주기: ${extractXmlTag(block, 'lifeNmArray')}`,
      `대상특성: ${extractXmlTag(block, 'trgterIndvdlNmArray')}`,
      `관심주제: ${extractXmlTag(block, 'intrsThemaNmArray')}`,
      `최종수정일: ${extractXmlTag(block, 'lastModYmd')}`
    ].join('\n');

    const persona = pickPersonaStyle(lastPersonaId);
    lastPersonaId = persona.id;
    const resolvedRegion = resolveRegionFromApiMetadata(
      { ctpvNm, sggNm, orgName },
      target
    );
    const effectiveTarget = { ...target, ...resolvedRegion };

    const generated = await generateWelfarePost(env, {
      target: effectiveTarget,
      noticeTitle: title,
      detailUrl,
      detailText: combinedText,
      hasAttachmentOnly: false,
      persona
    });

    await saveAndNotifyPost(env, {
      target,
      generated,
      externalId,
      orgName,
      personaId: persona.id,
      hasAttachmentOnly: false,
      sourceUrl: detailUrl,
      regionOverride: resolvedRegion
    });

    created++;
  }

  return {
    created,
    latestTitle: firstTitle ?? target.last_item_title
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
  const res = await fetchWithTimeout(target.target_url, 30000);
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
      const detailRes = await fetchWithTimeout(notice.detail_url, 30000);
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

    await saveAndNotifyPost(env, {
      target,
      generated,
      externalId,
      orgName: target.org_name,
      personaId: persona.id,
      hasAttachmentOnly,
      sourceUrl: notice.detail_url
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
 * 새벽 5시 전용: 낮 12:30 ~ 오후 6:00 ~ 새벽 5:00까지 모인 블로그 후보 중
 * 가장 검색 가치·정확도가 높은 최상위 최대 3건만 골라 심층 블로그 초안 작성 후,
 * 나머지 후보는 다음 날과 섞이지 않도록 정리
 */
export async function finalizeDailyBlogDrafts(env: Env): Promise<{
  candidatesFound: number;
  draftsCreated: number;
  clearedCandidates: number;
}> {
  const maxBlogPerDay = Number(env.MAX_BLOG_DRAFTS_PER_DAY || '3');
  let todayBlogCount = 0;
  try {
    todayBlogCount = await countTodayBlogDrafts(env);
  } catch (err) {
    console.warn('오늘 블로그 초안 수 조회 실패 (0으로 간주):', err);
  }

  const remaining = Math.max(0, maxBlogPerDay - todayBlogCount);
  const candidates = await fetchBlogCandidates(env);
  if (candidates.length === 0) {
    return { candidatesFound: 0, draftsCreated: 0, clearedCandidates: 0 };
  }

  const selected = candidates.slice(0, remaining);
  const discarded = candidates.slice(remaining);

  let draftsCreated = 0;
  let lastPersonaId: number | null = null;

  for (const candidate of selected) {
    const persona = pickPersonaStyle(lastPersonaId ?? candidate.persona_style_id);
    lastPersonaId = persona.id;

    try {
      const article = await generateBlogDraftArticle(env, candidate, persona);
      await promoteCandidateToBlogDraft(
        env,
        candidate.id,
        article.blog_title,
        article.blog_content_md
      );
      draftsCreated++;
    } catch (err) {
      console.error(`[블로그 초안 작성 실패] ${candidate.app_title}:`, err);
    }
  }

  if (discarded.length > 0) {
    try {
      await clearRemainingBlogCandidates(
        env,
        discarded.map((c) => c.id)
      );
    } catch (err) {
      console.warn('남은 블로그 후보 정리 실패:', err);
    }
  }

  return {
    candidatesFound: candidates.length,
    draftsCreated,
    clearedCandidates: discarded.length
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface PatrolRunOptions {
  roundStartedAt?: string;
  batchIndex?: number;
  workerBaseUrl?: string;
}

/**
 * 분산 순찰 메인 실행 함수 (50곳 단위 이어달리기 지원)
 * - active: 정상 작동 중인 기관 순찰 (새벽 05:00, 낮 12:30)
 * - recovery: 오류/정지로 멈춘 기관 재점검 (평일 오후 18:00)
 * - 1회 최대 MAX_TARGETS_PER_RUN(50곳)만 처리한 뒤, 남은 창구가 있으면 짧은 텀(기본 5초)을 두고 다음 요원에게 바통 전달
 * - finalizeBlogDrafts: true일 때(새벽 05:00) 해당 회차의 마지막 배치가 끝난 뒤 최상위 최대 3건 블로그 초안 작성
 */
export async function runPatrol(
  env: Env,
  mode: 'active' | 'recovery' = 'active',
  finalizeBlogDrafts = false,
  options: PatrolRunOptions = {}
): Promise<{
  mode: 'active' | 'recovery';
  batchIndex: number;
  roundStartedAt: string;
  checkedTargets: number;
  createdPosts: number;
  skippedByHash: number;
  errors: number;
  relayedToNextBatch: boolean;
  blogSummary?: {
    candidatesFound: number;
    draftsCreated: number;
    clearedCandidates: number;
  };
}> {
  const maxTargets = Number(env.MAX_TARGETS_PER_RUN || '50');
  const maxNewPosts = Number(env.MAX_NEW_POSTS_PER_TARGET || '5');
  const relayDelayMs = Math.max(1000, Number(env.PATROL_RELAY_DELAY_MS || '5000'));
  const maxBatches = Math.max(1, Number(env.PATROL_MAX_BATCHES || '20'));
  const batchIndex = Math.max(1, options.batchIndex ?? 1);
  const roundStartedAt = options.roundStartedAt || new Date().toISOString();
  const workerBaseUrl = (options.workerBaseUrl || env.WORKER_PUBLIC_URL || '').replace(/\/$/, '');

  const targets =
    mode === 'recovery'
      ? await fetchStoppedTargets(env, maxTargets, roundStartedAt)
      : await fetchOldestActiveTargets(env, maxTargets, roundStartedAt);

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
      } else if (target.source_type === 'API_WELFARE') {
        const result = await collectFromWelfareApi(env, target, maxNewPosts);
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
      const nextStatus =
        mode === 'recovery' ? target.status : nextFailCount >= 3 ? 'error' : 'active';
      console.error(`[${target.org_name}] 순찰 실패 (${nextFailCount}/3):`, err);

      await updateCrawlTargetState(env, target.id, {
        fail_count: nextFailCount,
        status: nextStatus,
        last_checked_at: nowIso
      });
    }
  }

  const canRelay =
    targets.length === maxTargets &&
    batchIndex < maxBatches &&
    Boolean(workerBaseUrl) &&
    Boolean(env.WORKER_ADMIN_SECRET);

  let relayedToNextBatch = false;
  if (canRelay) {
    try {
      await sleep(relayDelayMs);
      const nextUrl =
        `${workerBaseUrl}/run?mode=${encodeURIComponent(mode)}` +
        `&finalize=${finalizeBlogDrafts ? 'true' : 'false'}` +
        `&roundStartedAt=${encodeURIComponent(roundStartedAt)}` +
        `&batch=${batchIndex + 1}` +
        `&async=true`;

      const relayRes = await fetchWithTimeout(nextUrl, 10000, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.WORKER_ADMIN_SECRET}`
        }
      });

      if (relayRes.ok) {
        relayedToNextBatch = true;
        console.log(
          `[울동네 이어달리기] ${batchIndex}조(${targets.length}곳) 완료 -> ${relayDelayMs / 1000}초 휴식 후 ${batchIndex + 1}조 출동`
        );
      } else {
        console.warn(`[울동네 이어달리기] ${batchIndex + 1}조 호출 응답 오류: HTTP ${relayRes.status}`);
      }
    } catch (err) {
      console.warn(`[울동네 이어달리기] ${batchIndex + 1}조 바통 전달 실패:`, err);
    }
  }

  const shouldFinalizeNow = finalizeBlogDrafts && !relayedToNextBatch;
  const blogSummary = shouldFinalizeNow ? await finalizeDailyBlogDrafts(env) : undefined;

  return {
    mode,
    batchIndex,
    roundStartedAt,
    checkedTargets: targets.length,
    createdPosts,
    skippedByHash,
    errors,
    relayedToNextBatch,
    blogSummary
  };
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const isRecovery = event.cron === '0 9 * * 1-5';
    const isDawnFinal = event.cron === '0 20 * * 1-5';
    const mode = isRecovery ? 'recovery' : 'active';

    ctx.waitUntil(
      runPatrol(env, mode, isDawnFinal).then((summary) => {
        console.log(
          `[울동네 ${isRecovery ? '오류·정지 재점검' : isDawnFinal ? '새벽 5시 최종 순찰·초안 작성' : '낮 12:30 순찰·후보 수집'} 완료]`,
          JSON.stringify(summary)
        );
      })
    );
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
      const mode = url.searchParams.get('mode') === 'recovery' ? 'recovery' : 'active';
      const finalize = url.searchParams.get('finalize') === 'true';
      const roundStartedAt = url.searchParams.get('roundStartedAt') || undefined;
      const batchIndex = Number(url.searchParams.get('batch') || '1') || 1;
      const isAsync = url.searchParams.get('async') === 'true';
      const options: PatrolRunOptions = {
        roundStartedAt,
        batchIndex,
        workerBaseUrl: env.WORKER_PUBLIC_URL || url.origin
      };

      if (isAsync) {
        ctx.waitUntil(
          runPatrol(env, mode, finalize, options).then((summary) => {
            console.log(`[울동네 이어달리기 ${summary.batchIndex}조 완료]`, JSON.stringify(summary));
          })
        );
        return Response.json({ ok: true, queued: true, batchIndex }, { status: 202 });
      }

      const summary = await runPatrol(env, mode, finalize, options);
      return Response.json({ ok: true, summary });
    }

    return Response.json({ error: 'Not Found' }, { status: 404 });
  }
};
