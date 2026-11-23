import { cookies } from 'next/headers';

const COOKIE_NAME = 'uldongne_admin_session';

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'fallback-dev-secret';
}

async function signValue(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${payload}.${hex}`;
}

export async function createAdminSessionCookie(): Promise<void> {
  const exp = Date.now() + 1000 * 60 * 60 * 12; // 12시간 유효
  const token = await signValue(`admin:${exp}`);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payload] = parts;
  const expected = await signValue(payload);
  if (token !== expected) return false;

  const [, expStr] = payload.split(':');
  const exp = Number(expStr);
  return Number.isFinite(exp) && Date.now() < exp;
}
