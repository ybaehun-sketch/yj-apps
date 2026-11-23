import { NextResponse } from 'next/server';
import { clearAdminSessionCookie, createAdminSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return NextResponse.json({ error: '서버에 ADMIN_PASSWORD가 설정되지 않았습니다.' }, { status: 500 });
  }
  if (!password || password !== expected) {
    return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
  }

  await createAdminSessionCookie();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
