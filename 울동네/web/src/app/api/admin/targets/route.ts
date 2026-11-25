import { execFile } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import {
  createCrawlTargetAdmin,
  deleteCrawlTargetAdmin,
  findRegionCodeAdmin,
  resetCrawlTargetAdmin,
  updateCrawlTargetStatusAdmin,
  updateCrawlTargetUrlAdmin
} from '@/lib/supabase';
import type { CrawlTarget } from '@/lib/types';

const execFileAsync = promisify(execFile);

async function fetchTitleQuick(targetUrl: string): Promise<string> {
  let html = '';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timer);
    if (res.ok) html = await res.text();
  } catch {
    try {
      const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl';
      const { stdout } = await execFileAsync(
        curlBin,
        ['-s', '-L', '--max-time', '6', '-A', 'Mozilla/5.0', targetUrl],
        { maxBuffer: 2 * 1024 * 1024 }
      );
      html = stdout;
    } catch {
      return '';
    }
  }
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m
    ? m[1]
        .replace(/&gt;/gi, '>')
        .replace(/&lt;/gi, '<')
        .replace(/&amp;/gi, '&')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
}

async function inferBoardName(
  targetUrl: string,
  sigungu: string,
  isFamilynet: boolean
): Promise<string> {
  if (isFamilynet && targetUrl.includes('/receipt/list.do')) {
    return `${sigungu}가족센터 프로그램홍보`;
  }
  const title = await fetchTitleQuick(targetUrl);
  if (title) {
    // 예: "타기관소식 목록 | 속초시청 > 속초소식 > 타기관소식" -> "타기관소식"
    const segments = title
      .split(/[|>|\-\/]/)
      .map((s) => s.replace(/목록|홈페이지|누리집/g, '').trim())
      .filter((s) => s.length >= 2 && !s.includes(sigungu) && !s.includes('시청') && !s.includes('군청') && !s.includes('구청'));

    const boardLabel = segments[0];
    if (boardLabel) {
      return isFamilynet
        ? `${sigungu}가족센터 ${boardLabel}`
        : `${sigungu} ${boardLabel}`;
    }
  }
  return isFamilynet ? `${sigungu}가족센터 게시판` : `${sigungu} 새 게시판`;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = (await request.json()) as {
    region_sido?: string;
    region_sigungu?: string;
    region_code?: string;
    org_name?: string;
    source_type?: CrawlTarget['source_type'];
    target_url?: string;
  };

  if (!body.region_sido || !body.region_sigungu || !body.target_url) {
    return NextResponse.json(
      { error: '시·도, 시·군·구, 게시판 주소를 모두 입력해 주세요.' },
      { status: 400 }
    );
  }

  const trimmedUrl = body.target_url.trim();
  try {
    new URL(trimmedUrl);
  } catch {
    return NextResponse.json({ error: '올바른 주소(http:// 또는 https://)를 입력해 주세요.' }, { status: 400 });
  }

  const sido = body.region_sido.trim();
  const sigungu = body.region_sigungu.trim();
  const isFamilynet = body.source_type === 'FAMILYNET' || trimmedUrl.includes('familynet.or.kr');
  const sourceType: CrawlTarget['source_type'] =
    body.source_type ?? (isFamilynet ? 'FAMILYNET' : 'WEB_BOARD');

  const regionCode = body.region_code?.trim() || (await findRegionCodeAdmin(sido, sigungu));
  const orgName =
    body.org_name?.trim() || (await inferBoardName(trimmedUrl, sigungu, isFamilynet));

  const created = await createCrawlTargetAdmin({
    region_sido: sido,
    region_sigungu: sigungu,
    region_code: regionCode,
    org_name: orgName,
    source_type: sourceType,
    target_url: trimmedUrl
  });

  let extraTarget: CrawlTarget | null = null;
  const isFamilynetNotice = isFamilynet && !trimmedUrl.includes('/receipt/list.do');

  if (isFamilynetNotice) {
    try {
      const origin = new URL(trimmedUrl).origin;
      const promoUrl = `${origin}/center/lay1/program/S295T322C449/receipt/list.do`;
      const promoName = orgName.includes('공지사항')
        ? orgName.replace('공지사항', '프로그램홍보')
        : `${sigungu}가족센터 프로그램홍보`;

      extraTarget = await createCrawlTargetAdmin({
        region_sido: sido,
        region_sigungu: sigungu,
        region_code: regionCode,
        org_name: promoName,
        source_type: 'FAMILYNET',
        target_url: promoUrl
      });
    } catch {
      // 이미 등록되어 있거나 주소 형식이 다른 경우 기본 등록만 유지
    }
  }

  return NextResponse.json({ ok: true, target: created, extraTarget });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id, target_url, org_name, status } = (await request.json()) as {
    id?: string;
    target_url?: string;
    org_name?: string;
    status?: 'active' | 'paused';
  };
  if (!id) {
    return NextResponse.json({ error: '타겟 ID가 필요합니다.' }, { status: 400 });
  }

  if (status === 'active' || status === 'paused') {
    const updated = await updateCrawlTargetStatusAdmin(id, status);
    return NextResponse.json({ ok: true, target: updated });
  }

  if (target_url && target_url.trim()) {
    const trimmed = target_url.trim();
    try {
      new URL(trimmed);
    } catch {
      return NextResponse.json({ error: '올바른 주소 형식이 아닙니다.' }, { status: 400 });
    }
    const updated = await updateCrawlTargetUrlAdmin(id, trimmed, org_name);
    return NextResponse.json({ ok: true, target: updated });
  }

  await resetCrawlTargetAdmin(id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: '타겟 ID가 필요합니다.' }, { status: 400 });
  }

  await deleteCrawlTargetAdmin(id);
  return NextResponse.json({ ok: true });
}
