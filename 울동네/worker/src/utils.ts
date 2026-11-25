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
 * HTML에서 본문 컨테이너(<main>, #contents 등)가 있으면 그 시작점부터 잘라
 * 좌측/상단 메뉴가 글자 수 제한(maxChars)을 먼저 차지하지 않도록 함
 */
function narrowToMainContent(html: string): string {
  const mainMatch = html.match(
    /<(?:main\b[^>]*|(?:div|section|article)\b[^>]*\b(?:id|class)=["'][^"']*\b(?:contents?|sub_?contents?|main_?contents?|body_?content)\b[^"']*["'][^>]*)>/i
  );
  if (mainMatch && mainMatch.index !== undefined) {
    const sliced = html.slice(mainMatch.index);
    if (sliced.length >= 300) {
      return sliced;
    }
  }
  return html;
}

/**
 * HTML에서 불필요한 태그(script/style/header/footer/nav/aside)를 제거하고 순수 텍스트와 링크만 정제
 */
export function extractCleanTextFromHtml(html: string, baseUrl: string, maxChars = 3000): string {
  const scopedHtml = narrowToMainContent(html);
  let cleaned = scopedHtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ');

  // <a> 태그의 href를 텍스트 옆에 보존해 1차 AI가 detail_url을 추출할 수 있도록 함
  cleaned = cleaned.replace(
    /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
    (_match, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
      const href = hrefMatch ? hrefMatch[1] : '#';

      // 속초시청 게시판 등 href="#nolink" + data-key / data-seq 형태 지원
      if ((href === '#nolink' || href === '#') && baseUrl.includes('sokcho.go.kr') && text) {
        const keyMatch = attrs.match(/\bdata-key=["'](\d+)["']/i);
        if (keyMatch && baseUrl.includes('/sokchonews/notification')) {
          const u = new URL(baseUrl);
          return ` ${text} [URL:${u.origin}${u.pathname}?notAncmtMgtNo=${keyMatch[1]}] `;
        }
        const seqMatch = attrs.match(/\bdata-seq=["'](\d+)["']/i);
        if (seqMatch) {
          const u = new URL(baseUrl);
          return ` ${text} [URL:${u.origin}${u.pathname}?articleSeq=${seqMatch[1]}] `;
        }
      }

      // 양양군청 게시판 등 href="#a" + onclick="pf_readForm('번호')" 형태 지원
      if (href.startsWith('#') && baseUrl.includes('yangyang.go.kr') && text) {
        const readMatch = attrs.match(/\bonclick=["'][^"']*pf_readForm\(\s*['"]?(\d+)['"]?\s*\)/i);
        if (readMatch) {
          const u = new URL(baseUrl);
          return ` ${text} [URL:${u.origin}${u.pathname}?mode=readForm&articleSeq=${readMatch[1]}] `;
        }
      }

      if (!text || href.startsWith('javascript:') || href.startsWith('#')) {
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

const SUSPICIOUS_BOARD_KEYWORDS =
  /운동장|체육시설|체육관|사용료|수영장|캠핑장|주차장|장례식장|화장장|오시는길|찾아오시는|조직도|청사안내|자유게시판|주민자치센터/;

const ERROR_PAGE_PATTERNS =
  /페이지를\s*찾을\s*수\s*없|존재하지\s*않는\s*페이지|잘못된\s*접근|요청하신\s*페이지|404\s*error|not\s*found|서비스\s*점검\s*중/i;

function stripTagsQuick(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 수집 대상 웹 게시판이 실제 공지·고시·소식 페이지가 맞는지 자가 검증
 * (엉뚱한 시설/자유게시판/메인페이지/오류페이지 오연결 방지)
 */
export function validateBoardPageHtml(
  html: string,
  targetUrl: string,
  orgName: string
): { ok: boolean; reason?: string } {
  try {
    const pathname = new URL(targetUrl).pathname;
    if (pathname === '/' || /\/(main|index)\.(do|jsp|html?|php|asp)$/i.test(pathname)) {
      return { ok: false, reason: '기관 첫 화면(메인 페이지)으로 연결됨' };
    }
  } catch {
    return { ok: false, reason: '잘못된 형식의 주소' };
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTagsQuick(titleMatch[1]) : '';

  const headings: string[] = [];
  const hRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let m: RegExpExecArray | null;
  while ((m = hRegex.exec(html)) !== null && headings.length < 5) {
    const t = stripTagsQuick(m[1]);
    if (t && t.length < 80) headings.push(t);
  }
  const combinedTitleAndHeadings = `${title} ${headings.join(' ')}`.trim();

  const bodySample = stripTagsQuick(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  ).slice(0, 800);

  if (ERROR_PAGE_PATTERNS.test(title) || ERROR_PAGE_PATTERNS.test(bodySample)) {
    return { ok: false, reason: '존재하지 않거나 오류 페이지로 연결됨' };
  }

  const suspiciousMatch = combinedTitleAndHeadings.match(SUSPICIOUS_BOARD_KEYWORDS);
  if (suspiciousMatch && !orgName.includes(suspiciousMatch[0])) {
    return {
      ok: false,
      reason: `엉뚱한 페이지(${title.slice(0, 40) || suspiciousMatch[0]})로 연결됨`
    };
  }

  const hasStructuredTitle = /[-|>|\/]/.test(title);
  if (hasStructuredTitle) {
    if (orgName.includes('고시공고') && !/고시|공고|입찰|입법/.test(combinedTitleAndHeadings)) {
      return {
        ok: false,
        reason: `고시공고가 아닌 페이지(${title.slice(0, 40)})로 연결됨`
      };
    }
    if (
      orgName.includes('공지사항') &&
      !/공지|알림|새소식|소식|뉴스|안내|게시판/.test(combinedTitleAndHeadings)
    ) {
      return {
        ok: false,
        reason: `공지사항이 아닌 페이지(${title.slice(0, 40)})로 연결됨`
      };
    }
  }

  return { ok: true };
}

/**
 * 가족센터 프로그램홍보(/receipt/list.do) 목록 HTML에서 '접수중' 카드만 추출
 * - 접수마감/완료 카드는 제외하여 마감된 행사 수집 및 불필요한 AI 호출 방지
 */
export function filterFamilynetOngoingProgramsHtml(html: string): {
  filteredHtml: string;
  totalCards: number;
  ongoingCards: number;
} {
  const listMarker = '<div class="program_list">';
  const listIdx = html.indexOf(listMarker);
  if (listIdx === -1) {
    return { filteredHtml: html, totalCards: 0, ongoingCards: 0 };
  }

  const section = html.slice(listIdx);
  const cards: string[] = [];
  let cursor = 0;

  while (true) {
    const start = section.indexOf('<li class="clearfix"', cursor);
    if (start === -1) break;

    let depth = 0;
    let pos = start;
    let end = -1;

    while (pos < section.length) {
      const nextOpen = section.indexOf('<li', pos);
      const nextClose = section.indexOf('</li>', pos);
      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        pos = nextOpen + 3;
      } else {
        depth--;
        pos = nextClose + 5;
        if (depth === 0) {
          end = pos;
          break;
        }
      }
    }

    if (end === -1) break;
    cards.push(section.slice(start, end));
    cursor = end;
  }

  if (cards.length === 0) {
    return { filteredHtml: html, totalCards: 0, ongoingCards: 0 };
  }

  const ongoing = cards.filter((card) => {
    const text = stripTagsQuick(card);
    return text.includes('접수중') && !text.includes('접수마감');
  });

  return {
    filteredHtml: `<ul>${ongoing.join('\n')}</ul>`,
    totalCards: cards.length,
    ongoingCards: ongoing.length
  };
}
