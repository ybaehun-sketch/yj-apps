import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { createCrawlTargetAdmin, resetCrawlTargetAdmin } from '@/lib/supabase';
import type { CrawlTarget } from '@/lib/types';

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

  if (
    !body.region_sido ||
    !body.region_sigungu ||
    !body.region_code ||
    !body.org_name ||
    !body.source_type ||
    !body.target_url
  ) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해 주세요.' }, { status: 400 });
  }

  const created = await createCrawlTargetAdmin({
    region_sido: body.region_sido.trim(),
    region_sigungu: body.region_sigungu.trim(),
    region_code: body.region_code.trim(),
    org_name: body.org_name.trim(),
    source_type: body.source_type,
    target_url: body.target_url.trim()
  });

  return NextResponse.json({ ok: true, target: created });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: '타겟 ID가 필요합니다.' }, { status: 400 });
  }

  await resetCrawlTargetAdmin(id);
  return NextResponse.json({ ok: true });
}
