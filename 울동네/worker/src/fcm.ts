import type { Env, WelfareCategory } from './types';

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

function base64UrlEncode(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const clean = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getGoogleAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64UrlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    })
  );

  const signingInput = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  );
  const jwt = `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!tokenRes.ok) {
    throw new Error(`FCM OAuth2 token failed: ${tokenRes.status}`);
  }
  const tokenJson = (await tokenRes.json()) as { access_token: string };
  return tokenJson.access_token;
}

function toSafeFcmTopic(prefix: string, rawKeyword: string): string {
  const encoded = encodeURIComponent(rawKeyword.trim()).replace(/%/g, '_');
  return `${prefix}_${encoded}`.slice(0, 120);
}

/**
 * 앱 자동 발행 시 지역 토픽 + 키워드 토픽으로 FCM 푸시 알림 자동 발송
 */
export async function sendFcmTopicsForPost(
  env: Env,
  post: {
    external_id: string;
    region_code: string;
    region_sigungu: string;
    category: WelfareCategory;
    keywords: string[];
    app_title: string;
    app_summary_3lines: string;
  }
): Promise<{ sentCount: number; skipped: boolean }> {
  const rawSa = env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawSa) {
    return { sentCount: 0, skipped: true };
  }

  const sa = JSON.parse(rawSa) as ServiceAccount;
  const accessToken = await getGoogleAccessToken(sa);

  const topics = new Set<string>();
  topics.add(`region_${post.region_code}`);
  for (const kw of (post.keywords || []).slice(0, 5)) {
    topics.add(toSafeFcmTopic(`kw_${post.region_code}`, kw));
  }

  const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  let sentCount = 0;

  for (const topic of topics) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          topic,
          notification: {
            title: `[${post.region_sigungu}] ${post.app_title}`,
            body: post.app_summary_3lines.split('\n')[0] || '새 복지·혜택 소식이 도착했어요.'
          },
          data: {
            external_id: post.external_id,
            region_code: post.region_code,
            category: post.category
          }
        }
      })
    });
    if (res.ok) sentCount++;
  }

  return { sentCount, skipped: false };
}
