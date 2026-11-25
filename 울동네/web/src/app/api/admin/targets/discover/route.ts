import { execFile } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';

const execFileAsync = promisify(execFile);

async function fetchHtmlWithFallback(targetUrl: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      }
    });
    clearTimeout(timer);
    if (res.ok) {
      return await res.text();
    }
  } catch {
    // 행정기관 인증서/프로토콜 호환 문제 시 OS 표준 curl로 재시도
  }

  const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl';
  const { stdout } = await execFileAsync(
    curlBin,
    [
      '-s',
      '-L',
      '--max-time',
      '15',
      '-A',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      targetUrl
    ],
    { maxBuffer: 5 * 1024 * 1024 }
  );
  if (!stdout || stdout.trim().length < 50) {
    throw new Error('Empty response from curl');
  }
  return stdout;
}

export interface DiscoveredBoard {
  label: string;
  url: string;
  sourceType: 'WEB_BOARD' | 'FAMILYNET';
  score: number;
}

const INCLUDE_KEYWORDS: Array<{ word: string; weight: number }> = [
  { word: '고시공고', weight: 10 },
  { word: '고시·공고', weight: 10 },
  { word: '고시/공고', weight: 10 },
  { word: '공지사항', weight: 10 },
  { word: '프로그램홍보', weight: 10 },
  { word: '프로그램 홍보', weight: 10 },
  { word: '새소식', weight: 8 },
  { word: '시정소식', weight: 8 },
  { word: '군정소식', weight: 8 },
  { word: '구정소식', weight: 8 },
  { word: '알림마당', weight: 7 },
  { word: '타기관소식', weight: 7 },
  { word: '타기관 고시', weight: 6 },
  { word: '교육·문화', weight: 6 },
  { word: '교육문화', weight: 6 },
  { word: '시험공고', weight: 6 },
  { word: '채용공고', weight: 6 },
  { word: '일자리', weight: 5 },
  { word: '복지', weight: 5 },
  { word: '지원', weight: 4 },
  { word: '모집', weight: 4 },
  { word: '소식', weight: 3 },
  { word: '공고', weight: 3 },
  { word: '행사', weight: 2 }
];

const EXCLUDE_KEYWORDS =
  /로그인|회원가입|오시는길|찾아오시는|조직도|청사안내|인사말|연혁|개인정보|사이트맵|이메일|저작권|의회|운동장|체육관|사용료|주차|화장장|장례|자유게시판|질문|Q&A|FAQ|갤러리|포토|사진|동영상|유튜브|인스타|페이스북|블로그|더보기|바로가기|입찰|분묘|수의계약|문화관광/i;

function scoreAnchor(text: string, href: string): number {
  if (!text || text.length < 2 || text.length > 35) return 0;
  if (EXCLUDE_KEYWORDS.test(text)) return 0;
  if (
    href.startsWith('javascript:') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#')
  ) {
    return 0;
  }

  let score = 0;
  for (const item of INCLUDE_KEYWORDS) {
    if (text.includes(item.word)) {
      score += item.weight;
    }
  }
  if (/selectBbsNttList|selectEminwonList|boardCnts|bbsArticle|saeolGosi|receipt\/list\.do|notice|gosi/i.test(href)) {
    score += 3;
  }
  return score;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = (await request.json()) as { url?: string };
  const rawUrl = body.url?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: '홈페이지 주소를 입력해 주세요.' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
  } catch {
    return NextResponse.json({ error: '올바른 홈페이지 주소 형식이 아닙니다.' }, { status: 400 });
  }

  try {
    const candidateEntryUrls = [parsedUrl.toString()];
    if (parsedUrl.pathname === '/' || parsedUrl.pathname === '') {
      candidateEntryUrls.push(
        `${parsedUrl.origin}/www/index.do`,
        `${parsedUrl.origin}/portal/main.do`,
        `${parsedUrl.origin}/kor/index.do`,
        `${parsedUrl.origin}/main.do`
      );
    }

    let bestCandidates: DiscoveredBoard[] = [];
    const seenUrls = new Set<string>();
    const isFamilynet = parsedUrl.hostname.includes('familynet.or.kr');

    for (const entryUrl of candidateEntryUrls) {
      let currentUrl = entryUrl;
      let html = '';
      try {
        html = await fetchHtmlWithFallback(currentUrl);
      } catch {
        continue;
      }

      const jsRedirect = html.match(/(?:location\.href|location\.replace)\s*(?:=|\()\s*["']([^"']+)["']/i);
      if (html.length < 3000 && jsRedirect?.[1]) {
        try {
          currentUrl = new URL(jsRedirect[1], currentUrl).toString();
          html = await fetchHtmlWithFallback(currentUrl);
        } catch {
          // 무시하고 기존 HTML 사용
        }
      }

      const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let m: RegExpExecArray | null;
      while ((m = anchorRegex.exec(html)) !== null) {
        const href = m[1].trim().replace(/&amp;/g, '&');
        const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const score = scoreAnchor(text, href);
        if (score <= 0) continue;

        let absUrl: string;
        try {
          const u = new URL(href, currentUrl);
          if (u.hostname !== parsedUrl.hostname) continue;
          if (u.pathname === '/' || /\/(main|index)\.(do|jsp|html?|php|asp)$/i.test(u.pathname)) {
            continue;
          }
          absUrl = u.toString();
        } catch {
          continue;
        }

        if (seenUrls.has(absUrl)) continue;
        seenUrls.add(absUrl);

        bestCandidates.push({
          label: text,
          url: absUrl,
          sourceType: isFamilynet ? 'FAMILYNET' : 'WEB_BOARD',
          score
        });
      }

      if (bestCandidates.length >= 3) break;
    }

    if (isFamilynet) {
      const promoUrl = `${parsedUrl.origin}/center/lay1/program/S295T322C449/receipt/list.do`;
      if (!seenUrls.has(promoUrl)) {
        bestCandidates.unshift({
          label: '프로그램홍보 (접수중 자동 선별)',
          url: promoUrl,
          sourceType: 'FAMILYNET',
          score: 20
        });
      }
    }

    if (bestCandidates.length === 0 && candidateEntryUrls.length > 1) {
      // 접속 자체가 모두 실패했을 때만 에러 반환
    }

    bestCandidates.sort((a, b) => b.score - a.score);
    return NextResponse.json({
      ok: true,
      boards: bestCandidates.slice(0, 20)
    });
  } catch {
    return NextResponse.json(
      { error: '홈페이지 접속 시간이 초과되었거나 보안 설정으로 메뉴를 읽지 못했습니다.' },
      { status: 502 }
    );
  }
}
