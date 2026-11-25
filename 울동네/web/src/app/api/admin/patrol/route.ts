import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { fetchCrawlTargetsAdmin } from '@/lib/supabase';

function readWorkerSecretFallback(): string {
  const envSecret = process.env.WORKER_ADMIN_SECRET?.trim();
  if (envSecret) return envSecret;

  // 로컬 개발 환경에서 web/.env.local에 별도 복제하지 않아도 worker/.dev.vars의 키를 보조 참조
  try {
    const devVarsPath = path.resolve(process.cwd(), '..', 'worker', '.dev.vars');
    if (!fs.existsSync(devVarsPath)) return '';
    const content = fs.readFileSync(devVarsPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*WORKER_ADMIN_SECRET\s*=\s*(.+)\s*$/);
      if (match) {
        return match[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // 무시
  }
  return '';
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    sigungu?: string;
    targetId?: string;
  };
  const sigungu = body.sigungu?.trim() ?? '';
  const targetId = body.targetId?.trim() ?? '';
  if (!sigungu && !targetId) {
    return NextResponse.json({ error: '순찰할 대상 또는 지역명이 필요합니다.' }, { status: 400 });
  }

  const workerUrl = (process.env.WORKER_URL?.trim() || 'http://127.0.0.1:8787').replace(/\/+$/, '');
  const workerSecret = readWorkerSecretFallback();
  if (!workerSecret) {
    return NextResponse.json(
      { error: '순찰대 연결 키가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const query = targetId
    ? `targetId=${encodeURIComponent(targetId)}`
    : `sigungu=${encodeURIComponent(sigungu)}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);
    const res = await fetch(`${workerUrl}/run?${query}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${workerSecret}`
      },
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timer);

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      summary?: {
        checkedTargets?: number;
        createdPosts?: number;
        skippedByHash?: number;
        errors?: number;
      };
      error?: string;
    };

    if (!res.ok || !data.ok) {
      return NextResponse.json(
        { error: data.error || '순찰대 실행 중 오류가 발생했습니다.' },
        { status: res.status || 502 }
      );
    }

    const allTargets = await fetchCrawlTargetsAdmin().catch(() => []);
    const updatedTargets = targetId
      ? allTargets.filter((t) => t.id === targetId)
      : allTargets.filter((t) => t.region_sigungu.trim() === sigungu);

    return NextResponse.json({
      ok: true,
      summary: data.summary,
      updatedTargets
    });
  } catch {
    return NextResponse.json(
      { error: '순찰대 서버에 연결하지 못했습니다. 순찰기가 실행 중인지 확인해 주세요.' },
      { status: 502 }
    );
  }
}
