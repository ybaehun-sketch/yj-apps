import { sendFcmTopicsForPost } from './fcm';
import { generateWelfarePost, scanBoardNotices } from './gemini';
import { pickPersonaStyle } from './personas';
import {
  checkPostExists,
  countTodayBlogDrafts,
  fetchOldestActiveTargets,
  insertWelfarePost,
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

interface BlogBudget {
  remaining: number;
}

/**
 * 투톱 전략 저장·알림 공통 처리:
 * - 앱: AI 확신도 기준(기본 80점) 이상이면 대표님 검토 없이 즉시 자동 발행 + 푸시 알림
 * - 블로그: 검색 가치 높은 공고만 하루 최대 2~3건(기본 3건) 초안('draft')으로 생성
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
    blogBudget: BlogBudget;
  }
): Promise<void> {
  const { target, generated, externalId, orgName, personaId, hasAttachmentOnly, sourceUrl, blogBudget } = params;
  const nowIso = new Date().toISOString();
  const minConfidence = Number(env.APP_AUTO_PUBLISH_MIN_CONFIDENCE ?? 80);

  const shouldAutoPublishApp =
    env.AUTO_PUBLISH_ENABLED !== 'false' && generated.ai_confidence >= minConfidence;

  const canCreateBlogDraft =
    generated.publish_to_blog && !hasAttachmentOnly && blogBudget.remaining > 0;

  if (canCreateBlogDraft) {
    blogBudget.remaining--;
  }

  await insertWelfarePost(env, {
    ...generated,
    target_id: target.id,
    external_id: externalId,
    region_sido: target.region_sido,
    region_sigungu: target.region_sigungu,
    region_code: target.region_code,
    org_name: orgName,
    persona_style_id: personaId,
    has_attachment_only: hasAttachmentOnly,
    auto_published: shouldAutoPublishApp,
    status: shouldAutoPublishApp ? 'published' : 'draft',
    app_status: shouldAutoPublishApp ? 'published' : 'draft',
    app_published_at: shouldAutoPublishApp ? nowIso : null,
    blog_status: canCreateBlogDraft ? 'draft' : 'none',
    blog_published_at: null,
    source_url: sourceUrl,
    published_at: shouldAutoPublishApp ? nowIso : null
  });

  if (shouldAutoPublishApp) {
    try {
      await sendFcmTopicsForPost(env, {
        external_id: externalId,
        region_code: target.region_code,
        region_sigungu: target.region_sigungu,
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
  maxNewPosts: number,
  blogBudget: BlogBudget
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

    await saveAndNotifyPost(env, {
      target,
      generated,
      externalId,
      orgName: item.소관기관명 || target.org_name,
      personaId: persona.id,
      hasAttachmentOnly: false,
      sourceUrl: detailUrl,
      blogBudget
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
  maxNewPosts: number,
  blogBudget: BlogBudget
): Promise<{ created: number; latestTitle: string | null }> {
  if (!env.WELFARE_API_KEY) {
    console.warn(`[${target.org_name}] WELFARE_API_KEY 미설정으로 스킵`);
    return { created: 0, latestTitle: target.last_item_title };
  }

  const sep = target.target_url.includes('?') ? '&' : '?';
  const apiUrl = `${target.target_url}${sep}serviceKey=${encodeURIComponent(env.WELFARE_API_KEY)}&callTp=L&pageNo=1&numOfRows=10&srchKeyCode=003`;
  const res = await fetchWithTimeout(apiUrl, 15000);
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

    const generated = await generateWelfarePost(env, {
      target,
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
      blogBudget
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
  maxNewPosts: number,
  blogBudget: BlogBudget
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

    await saveAndNotifyPost(env, {
      target,
      generated,
      externalId,
      orgName: target.org_name,
      personaId: persona.id,
      hasAttachmentOnly,
      sourceUrl: notice.detail_url,
      blogBudget
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
  const maxBlogPerDay = Number(env.MAX_BLOG_DRAFTS_PER_DAY || '3');

  let todayBlogCount = 0;
  try {
    todayBlogCount = await countTodayBlogDrafts(env);
  } catch (err) {
    console.warn('오늘 블로그 초안 수 조회 실패 (0으로 간주):', err);
  }
  const blogBudget: BlogBudget = { remaining: Math.max(0, maxBlogPerDay - todayBlogCount) };

  const targets = await fetchOldestActiveTargets(env, maxTargets);

  let createdPosts = 0;
  let skippedByHash = 0;
  let errors = 0;

  for (const target of targets) {
    const nowIso = new Date().toISOString();
    try {
      if (target.source_type === 'API_GOV24') {
        const result = await collectFromGov24Api(env, target, maxNewPosts, blogBudget);
        createdPosts += result.created;
        await updateCrawlTargetState(env, target.id, {
          last_item_title: result.latestTitle,
          fail_count: 0,
          status: 'active',
          last_checked_at: nowIso
        });
      } else if (target.source_type === 'API_WELFARE') {
        const result = await collectFromWelfareApi(env, target, maxNewPosts, blogBudget);
        createdPosts += result.created;
        await updateCrawlTargetState(env, target.id, {
          last_item_title: result.latestTitle,
          fail_count: 0,
          status: 'active',
          last_checked_at: nowIso
        });
      } else {
        const result = await collectFromWebBoard(env, target, maxNewPosts, blogBudget);
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
