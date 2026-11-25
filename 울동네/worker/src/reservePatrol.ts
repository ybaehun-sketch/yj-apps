import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { collectFromWebBoard } from './index';
import { fetchReserveTargets, updateCrawlTargetState } from './supabase';
import type { Env } from './types';

function fetchViaNodeHttp(urlStr: string, headers: Record<string, string>, redirectsLeft = 5): Promise<Response> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(
      parsed,
      { method: 'GET', headers, timeout: 30000 },
      (res) => {
        const status = res.statusCode ?? 200;
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location && redirectsLeft > 0) {
          res.resume();
          const nextUrl = new URL(res.headers.location, urlStr).toString();
          fetchViaNodeHttp(nextUrl, headers, redirectsLeft - 1).then(resolve, reject);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          const resHeaders = new Headers();
          for (const [k, v] of Object.entries(res.headers)) {
            if (typeof v === 'string') resHeaders.set(k, v);
            else if (Array.isArray(v)) resHeaders.set(k, v.join(', '));
          }
          resolve(new Response(body, { status, headers: resHeaders }));
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('Request timeout')));
    req.on('error', reject);
    req.end();
  });
}

function installTolerantGetFetch(): void {
  const nativeFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      return await nativeFetch(input, init);
    } catch (err) {
      const method = (init?.method ?? 'GET').toUpperCase();
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (method === 'GET' && urlStr.startsWith('http')) {
        const hdrs: Record<string, string> = {};
        if (init?.headers) {
          new Headers(init.headers).forEach((v, k) => {
            hdrs[k] = v;
          });
        }
        return await fetchViaNodeHttp(urlStr, hdrs);
      }
      throw err;
    }
  };
}

function loadDevVarsIfPresent(): void {
  const devVarsPath = path.resolve(process.cwd(), '.dev.vars');
  if (!fs.existsSync(devVarsPath)) return;

  const lines = fs.readFileSync(devVarsPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const val = match[2].trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

function buildEnvFromProcess(): Env {
  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
    GEMINI_SCAN_MODEL: process.env.GEMINI_SCAN_MODEL ?? 'gemini-3.5-flash-lite',
    GEMINI_WRITE_MODEL: process.env.GEMINI_WRITE_MODEL ?? 'gemini-3.8-flash',
    BACKUP_LLM_PROVIDER: process.env.BACKUP_LLM_PROVIDER,
    BACKUP_LLM_API_KEY: process.env.BACKUP_LLM_API_KEY,
    BACKUP_LLM_MODEL: process.env.BACKUP_LLM_MODEL,
    SUPABASE_URL: process.env.SUPABASE_URL ?? '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    GOV24_API_KEY: process.env.GOV24_API_KEY,
    FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    WORKER_ADMIN_SECRET: process.env.WORKER_ADMIN_SECRET,
    WORKER_PUBLIC_URL: process.env.WORKER_PUBLIC_URL,
    AUTO_PUBLISH_ENABLED: process.env.AUTO_PUBLISH_ENABLED ?? 'true',
    APP_AUTO_PUBLISH_MIN_CONFIDENCE: process.env.APP_AUTO_PUBLISH_MIN_CONFIDENCE ?? '85',
    MAX_BLOG_DRAFTS_PER_DAY: process.env.MAX_BLOG_DRAFTS_PER_DAY ?? '3',
    MAX_TARGETS_PER_RUN: process.env.MAX_TARGETS_PER_RUN ?? '50',
    MAX_NEW_POSTS_PER_TARGET: process.env.MAX_NEW_POSTS_PER_TARGET ?? '5',
    PATROL_RELAY_DELAY_MS: process.env.PATROL_RELAY_DELAY_MS ?? '5000',
    PATROL_MAX_BATCHES: process.env.PATROL_MAX_BATCHES ?? '20'
  };
}

function parseCliArgs(argv: string[]): { sigungu?: string; limit: number } {
  let sigungu: string | undefined;
  let limit = 50;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--sigungu=')) {
      sigungu = arg.slice('--sigungu='.length).trim() || undefined;
    } else if (arg === '--sigungu' && argv[i + 1]) {
      sigungu = argv[++i].trim() || undefined;
    } else if (arg.startsWith('--limit=')) {
      limit = Math.max(1, Number(arg.slice('--limit='.length)) || 50);
    } else if (arg === '--limit' && argv[i + 1]) {
      limit = Math.max(1, Number(argv[++i]) || 50);
    }
  }

  return { sigungu, limit };
}

function formatReserveSuccessTitle(latestTitle: string | null): string {
  const clean = (latestTitle ?? '').replace(/^\[예비순찰대 (?:필요|완료)\]\s*/g, '').trim();
  return clean ? `[예비순찰대 완료] ${clean}`.slice(0, 140) : '[예비순찰대 완료] 정상 확인';
}

async function main(): Promise<void> {
  installTolerantGetFetch();
  loadDevVarsIfPresent();
  const env = buildEnvFromProcess();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.GEMINI_API_KEY) {
    throw new Error('필수 환경 변수(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY)가 없습니다.');
  }

  const { sigungu, limit } = parseCliArgs(process.argv.slice(2));
  const maxNewPosts = Number(env.MAX_NEW_POSTS_PER_TARGET || '5');
  const targets = await fetchReserveTargets(env, limit, sigungu);

  console.log(
    `[무료 예비순찰대 출동] 대상 ${targets.length}곳${sigungu ? ` (${sigungu})` : ''}`
  );

  let recovered = 0;
  let createdPosts = 0;
  let skippedByHash = 0;
  let failed = 0;

  for (const target of targets) {
    const nowIso = new Date().toISOString();
    try {
      const result = await collectFromWebBoard(env, target, maxNewPosts);
      createdPosts += result.created;
      if (result.skippedByHash) skippedByHash++;

      const nextTitle = formatReserveSuccessTitle(result.latestTitle);
      await updateCrawlTargetState(env, target.id, {
        last_page_hash: result.pageHash,
        last_item_title: nextTitle,
        fail_count: 0,
        status: 'active',
        last_checked_at: nowIso
      });
      recovered++;
      console.log(
        `  [성공] ${target.org_name} (${target.region_sigungu}) -> 새 글 ${result.created}건${result.skippedByHash ? ' (변동 없음 0원)' : ''}`
      );
    } catch (err) {
      failed++;
      const errMessage = err instanceof Error ? err.message : String(err);
      const isInvalidBoard = errMessage.startsWith('[주소 점검 필요]');
      const failureLabel = isInvalidBoard
        ? errMessage.slice(0, 120)
        : '[예비순찰대 접속 실패] 일반 접속도 지연/차단됨';
      const nextFailCount = (target.fail_count ?? 0) + 1;

      await updateCrawlTargetState(env, target.id, {
        last_item_title: failureLabel,
        fail_count: nextFailCount,
        status: isInvalidBoard || nextFailCount >= 3 ? 'error' : target.status,
        last_checked_at: nowIso
      });
      console.error(`  [실패] ${target.org_name} (${target.region_sigungu}): ${errMessage}`);
    }
  }

  console.log(
    `[무료 예비순찰대 완료] 점검=${targets.length}, 복구=${recovered}, 새글=${createdPosts}, 변동없음(0원)=${skippedByHash}, 실패=${failed}`
  );
}

main().catch((err) => {
  console.error('[무료 예비순찰대 치명적 오류]', err);
  process.exit(1);
});
