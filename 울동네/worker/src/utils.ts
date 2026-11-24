const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * 지자체 사이트 응답 지연에 대비해 브라우저 헤더와 타임아웃을 적용한 안전한 fetch
 */
export async function fetchWithTimeout(
  url: string,
  timeoutMs = 30000,
  init: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(init.headers);
    if (!headers.has('User-Agent')) {
      headers.set('User-Agent', DEFAULT_USER_AGENT);
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8');
    }
    if (!headers.has('Accept-Language')) {
      headers.set('Accept-Language', 'ko-KR,ko;q=0.9,en;q=0.8');
    }

    return await fetch(url, {
      ...init,
      headers,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * SHA-256 16진수 해시 생성 (페이지 변경 감지 및 external_id 생성용)
 */
export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * HTML에서 불필요한 태그(script/style/header/footer/nav)를 제거하고 순수 텍스트와 링크만 정제
 */
export function extractCleanTextFromHtml(html: string, baseUrl: string, maxChars = 3000): string {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ');

  // <a> 태그의 href를 텍스트 옆에 보존해 1차 AI가 detail_url을 추출할 수 있도록 함
  cleaned = cleaned.replace(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_match, href: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!text || href.startsWith('javascript:') || href === '#') {
        return text ? ` ${text} ` : ' ';
      }
      const absUrl = toAbsoluteUrl(href, baseUrl);
      return ` ${text} [URL:${absUrl}] `;
    }
  );

  // 나머지 HTML 태그 제거 및 공백 정리
  cleaned = cleaned
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.slice(0, maxChars);
}

/**
 * 상세 페이지 HTML에서 본문 텍스트만 추출 (링크 마커 없이 순수 가독 텍스트)
 */
export function extractDetailBodyText(html: string, maxChars = 5000): string {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.slice(0, maxChars);
}

export function toAbsoluteUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

/**
 * JSON 문자열 내부의 이스케이프되지 않은 제어문자를 안전하게 보정
 */
function sanitizeJsonControlChars(input: string): string {
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString) {
      if (ch === '\n') {
        out += '\\n';
        continue;
      }
      if (ch === '\r') {
        out += '\\r';
        continue;
      }
      if (ch === '\t') {
        out += '\\t';
        continue;
      }
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        continue;
      }
    }
    out += ch;
  }

  return out;
}

/**
 * LLM 응답에서 마크다운 코드 펜스를 제거하고 안전하게 JSON 파싱
 */
export function parseJsonFromLlm<T>(rawText: string): T {
  const trimmed = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return JSON.parse(sanitizeJsonControlChars(trimmed)) as T;
  }
}

/**
 * 첨부파일(.hwp, .hwpx, .pdf) 안내 위주 공고인지 판별하는 휴리스틱
 */
export function detectAttachmentOnlyNotice(detailHtml: string, bodyText: string): boolean {
  const hasAttachmentExt = /\.(hwp|hwpx|pdf)\b/i.test(detailHtml);
  const hasShortBody = bodyText.length < 180;
  const mentionsSeeAttachment = /첨부파일\s*(참고|참조|확인)|붙임\s*(문서|파일|참조)/i.test(bodyText);
  return hasAttachmentExt && (hasShortBody || mentionsSeeAttachment);
}
