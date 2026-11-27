import {
  collectFromGov24Api,
  collectFromWebBoard,
  collectFromWelfareApi,
  finalizeDailyBlogDrafts
} from './index';
import {
  buildEnvFromProcess,
  installTolerantGetFetch,
  loadDevVarsIfPresent
} from './nodeRunner';
import {
  cleanupOldWelfarePosts,
  fetchOldestActiveTargets,
  recordPatrolBriefing,
  updateCrawlTargetState,
  type PatrolBriefingTargetItem
} from './supabase';
import type { CrawlTarget, Env } from './types';

function parseCliArgs(argv: string[]): { sigungu?: string; finalizeBlog?: boolean } {
  let sigungu: string | undefined;
  let finalizeBlog: boolean | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--sigungu=')) {
      sigungu = arg.slice('--sigungu='.length).trim() || undefined;
    } else if (arg === '--sigungu' && argv[i + 1]) {
      sigungu = argv[++i].trim() || undefined;
    } else if (arg === '--finalize-blog') {
      finalizeBlog = true;
    } else if (arg === '--no-finalize-blog') {
      finalizeBlog = false;
    }
  }

  return { sigungu, finalizeBlog };
}

function isKstDawnWindow(date = new Date()): boolean {
  const kstHour = new Date(date.getTime() + 9 * 60 * 60 * 1000).getUTCHours();
  return kstHour >= 4 && kstHour < 8;
}

async function runSingleTarget(
  env: Env,
  target: CrawlTarget,
  maxNewPosts: number
): Promise<{ ok: boolean; created: number; skippedByHash: number; errorReason?: string }> {
  const nowIso = new Date().toISOString();
  try {
    if (target.source_type === 'API_GOV24') {
      const result = await collectFromGov24Api(env, target, maxNewPosts);
      await updateCrawlTargetState(env, target.id, {
        last_item_title: result.latestTitle,
        fail_count: 0,
        status: 'active',
        last_checked_at: nowIso
      });
      return { ok: true, created: result.created, skippedByHash: 0 };
    }

    if (target.source_type === 'API_WELFARE') {
      const result = await collectFromWelfareApi(env, target, maxNewPosts);
      await updateCrawlTargetState(env, target.id, {
        last_item_title: result.latestTitle,
        fail_count: 0,
        status: 'active',
        last_checked_at: nowIso
      });
      return { ok: true, created: result.created, skippedByHash: 0 };
    }

    const result = await collectFromWebBoard(env, target, maxNewPosts);
    await updateCrawlTargetState(env, target.id, {
      last_page_hash: result.pageHash,
      last_item_title: result.latestTitle,
      fail_count: 0,
      status: 'active',
      last_checked_at: nowIso
    });
    return {
      ok: true,
      created: result.created,
      skippedByHash: result.skippedByHash ? 1 : 0
    };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      created: 0,
      skippedByHash: 0,
      errorReason: errMessage
    };
  }
}

async function main(): Promise<void> {
  installTolerantGetFetch();
  loadDevVarsIfPresent();
  const env = buildEnvFromProcess();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.GEMINI_API_KEY) {
    throw new Error('필수 환경 변수(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY)가 없습니다.');
  }

  const { sigungu, finalizeBlog: cliFinalize } = parseCliArgs(process.argv.slice(2));
  const shouldFinalizeBlog = cliFinalize ?? isKstDawnWindow();
  const maxNewPosts = Number(env.MAX_NEW_POSTS_PER_TARGET || '5');
  const roundStartedAt = new Date().toISOString();

  if (shouldFinalizeBlog && !sigungu) {
    try {
      const preSummary = await finalizeDailyBlogDrafts(env, { clearRemaining: false });
      console.log('[통합 순찰] 새벽 회차 선제 블로그 초안 보장:', JSON.stringify(preSummary));
    } catch (err) {
      console.warn('[통합 순찰] 선제 블로그 보장 실패 (순찰 후 재시도):', err);
    }
  }

  const targets = await fetchOldestActiveTargets(env, 1000, roundStartedAt, sigungu);
  console.log(
    `[울동네 통합 순찰 출동] 대상 ${targets.length}곳${sigungu ? ` (${sigungu})` : ''}, 블로그마무리=${shouldFinalizeBlog}`
  );

  let createdPosts = 0;
  let skippedByHash = 0;
  const retryQueue: CrawlTarget[] = [];

  const CONCURRENCY = 8;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const chunk = targets.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (target) => {
        const res = await runSingleTarget(env, target, maxNewPosts);
        if (res.ok) {
          createdPosts += res.created;
          skippedByHash += res.skippedByHash;
          if (res.created > 0) {
            console.log(`  [새 글 +${res.created}] ${target.org_name}`);
          }
        } else {
          retryQueue.push(target);
        }
      })
    );
    const done = Math.min(i + CONCURRENCY, targets.length);
    if (done % 80 === 0 || done === targets.length) {
      console.log(`  진행 현황: ${done}/${targets.length} (새글=${createdPosts}, 재시도대기=${retryQueue.length})`);
    }
  }

  // 일시적 지연이나 접속 오류 난 곳은 끝난 직후 1회 자동 재시도해 별도 예비순찰 대기 없이 즉시 수습
  const problemTargets: PatrolBriefingTargetItem[] = [];
  if (retryQueue.length > 0) {
    console.log(`[통합 순찰 2차 재확인] 지연·오류 ${retryQueue.length}곳 즉시 재점검`);
    const RETRY_CONCURRENCY = 4;
    for (let i = 0; i < retryQueue.length; i += RETRY_CONCURRENCY) {
      const chunk = retryQueue.slice(i, i + RETRY_CONCURRENCY);
      await Promise.all(
        chunk.map(async (target) => {
          const res = await runSingleTarget(env, target, maxNewPosts);
          if (res.ok) {
            createdPosts += res.created;
            skippedByHash += res.skippedByHash;
            if (res.created > 0) {
              console.log(`  [재확인 새 글 +${res.created}] ${target.org_name}`);
            }
          } else {
            const reason = res.errorReason ?? '접속 실패';
            const isInvalidBoard = reason.startsWith('[주소 점검 필요]');
            const nextFailCount = (target.fail_count ?? 0) + 1;
            const nextStatus = isInvalidBoard || nextFailCount >= 3 ? 'error' : 'active';
            await updateCrawlTargetState(env, target.id, {
              last_item_title: reason.slice(0, 120),
              fail_count: nextFailCount,
              status: nextStatus,
              last_checked_at: new Date().toISOString()
            });
            problemTargets.push({
              org_name: target.org_name,
              region_sido: target.region_sido,
              region_sigungu: target.region_sigungu,
              target_url: target.target_url,
              reason: reason.slice(0, 120)
            });
          }
        })
      );
    }
  }

  const successCount = Math.max(0, targets.length - problemTargets.length);
  if (!sigungu && targets.length > 0) {
    await recordPatrolBriefing(env, {
      patrolType: 'main',
      roundStartedAt,
      checkedCount: targets.length,
      successCount,
      createdPosts,
      problemTargets
    });
  }

  let blogSummary: unknown;
  if (shouldFinalizeBlog && !sigungu) {
    blogSummary = await finalizeDailyBlogDrafts(env, { clearRemaining: true });
    try {
      const cleanedCount = await cleanupOldWelfarePosts(env);
      if (cleanedCount > 0) {
        console.log(`[통합 순찰 자동 청소] 오래된·마감된 일반 앱 소식 ${cleanedCount}건 정리`);
      }
    } catch (err) {
      console.warn('[통합 순찰 자동 청소 실패]', err);
    }
  }

  console.log(
    '[울동네 통합 순찰 완료]',
    JSON.stringify({
      checkedTargets: targets.length,
      successCount,
      createdPosts,
      skippedByHash,
      failedCount: problemTargets.length,
      blogSummary
    })
  );
}

main().catch((err) => {
  console.error('[울동네 통합 순찰 오류]', err);
  process.exit(1);
});
