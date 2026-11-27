import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import type { Env } from './types';

function fetchViaNodeHttp(urlStr: string, headers: Record<string, string>, redirectsLeft = 5): Promise<Response> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    let settled = false;
    const req = client.request(
      parsed,
      { method: 'GET', headers, timeout: 10000 },
      (res) => {
        const status = res.statusCode ?? 200;
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location && redirectsLeft > 0) {
          res.resume();
          clearTimeout(hardTimer);
          const nextUrl = new URL(res.headers.location, urlStr).toString();
          fetchViaNodeHttp(nextUrl, headers, redirectsLeft - 1).then(resolve, reject);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          clearTimeout(hardTimer);
          if (settled) return;
          settled = true;
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
    const hardTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        req.destroy(new Error('Request hard timeout (10s)'));
      }
    }, 10000);
    req.on('timeout', () => {
      clearTimeout(hardTimer);
      req.destroy(new Error('Request timeout (10s)'));
    });
    req.on('error', (err) => {
      clearTimeout(hardTimer);
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
    req.end();
  });
}

/**
 * Node.js 환경에서 인증서·헤더 제한이 까다로운 국내 기관 웹사이트도 안전하게 읽을 수 있도록 GET 요청을 보강한다.
 */
export function installTolerantGetFetch(): void {
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

export function loadDevVarsIfPresent(): void {
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

export function buildEnvFromProcess(): Env {
  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
    GEMINI_SCAN_MODEL: process.env.GEMINI_SCAN_MODEL ?? 'gemini-3.5-flash-lite',
    GEMINI_WRITE_MODEL: process.env.GEMINI_WRITE_MODEL ?? 'gemini-3.8-flash',
    BACKUP_LLM_PROVIDER: process.env.BACKUP_LLM_PROVIDER,
    BACKUP_LLM_API_KEY: process.env.BACKUP_LLM_API_KEY,
    BACKUP_LLM_MODEL: process.env.BACKUP_LLM_MODEL,
    WELFARE_API_KEY: process.env.WELFARE_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL ?? '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    GOV24_API_KEY: process.env.GOV24_API_KEY,
    FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    WORKER_ADMIN_SECRET: process.env.WORKER_ADMIN_SECRET,
    WORKER_PUBLIC_URL: process.env.WORKER_PUBLIC_URL,
    AUTO_PUBLISH_ENABLED: process.env.AUTO_PUBLISH_ENABLED ?? 'true',
    APP_AUTO_PUBLISH_MIN_CONFIDENCE: process.env.APP_AUTO_PUBLISH_MIN_CONFIDENCE ?? '85',
    MAX_BLOG_DRAFTS_PER_DAY: process.env.MAX_BLOG_DRAFTS_PER_DAY ?? '3',
    MAX_TARGETS_PER_RUN: process.env.MAX_TARGETS_PER_RUN ?? '1000',
    MAX_NEW_POSTS_PER_TARGET: process.env.MAX_NEW_POSTS_PER_TARGET ?? '5',
    PATROL_RELAY_DELAY_MS: process.env.PATROL_RELAY_DELAY_MS ?? '2000',
    PATROL_MAX_BATCHES: process.env.PATROL_MAX_BATCHES ?? '35'
  };
}
