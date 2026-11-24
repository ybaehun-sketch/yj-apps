import type { PersonaStyle } from './personas';
import type { CrawlTarget, Env, GeneratedWelfarePost, ScannedNotice, WelfareCategory } from './types';
import { fetchWithTimeout, parseJsonFromLlm } from './utils';

const VALID_CATEGORIES: WelfareCategory[] = [
  '돌봄/육아',
  '어르신/건강',
  '주거/난방비',
  '소상공인/일자리',
  '생활/문화'
];

async function callGeminiJson<T>(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetchWithTimeout(endpoint, 25000, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini API error (${model}): ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Gemini API returned empty text (${model})`);
  }

  return parseJsonFromLlm<T>(text);
}

/**
 * 1차 AI 스캔 (초저가 경량 모델):
 * 게시판 목록 텍스트(최대 3,000자)에서 입찰·공사·인사발령을 배제하고 주민 혜택 공고만 선별
 */
export async function scanBoardNotices(
  env: Env,
  target: CrawlTarget,
  boardText: string,
  maxItems: number
): Promise<ScannedNotice[]> {
  const systemPrompt = `너는 한국 지자체·공공기관 게시판에서 주민에게 실제 도움이 되는 복지·지원금·돌봄·교육·프로그램 공고만 골라내는 선별 AI다.
반드시 JSON 배열로만 응답하라.

[제외 대상 (100% 버릴 것)]
- 입찰, 공사, 용역, 물품구매, 계약, 수의계약, 인사발령, 채용(공무원/기간제 일반), 단순 행정 고시, 주정차 단속, 분묘 개장, 도로 통제

[선별 대상]
- 보조금, 지원금, 바우처, 난방비/에너지 지원, 방학돌봄, 초등체험, 가족 프로그램, 어르신 건강검진/예방접종, 소상공인 지원, 생활·문화 강좌

[응답 스키마]
[
  {
    "title": "공고 제목",
    "date": "YYYY-MM-DD 또는 null",
    "detail_url": "텍스트에 [URL:...] 형태로 적힌 전체 URL"
  }
]
최대 ${maxItems}건까지만 최신순으로 반환하고, 해당 공고가 없으면 빈 배열 []을 반환하라.`;

  const userPrompt = `기관명: ${target.org_name} (${target.region_sido} ${target.region_sigungu})
기준 URL: ${target.target_url}
직전 수집 최신 제목: ${target.last_item_title ?? '없음'}

[게시판 목록 텍스트]
${boardText.slice(0, 3000)}`;

  const result = await callGeminiJson<ScannedNotice[]>(
    env.GEMINI_API_KEY,
    env.GEMINI_SCAN_MODEL,
    systemPrompt,
    userPrompt
  );

  if (!Array.isArray(result)) return [];
  return result
    .filter((item) => item && item.title && item.detail_url)
    .slice(0, maxItems);
}

/**
 * 2차 AI 가공 (표준 경량 모델):
 * 30가지 글맛 페르소나 적용, 동의어 키워드 확장, 준비서류·탈락 주의사항 체크리스트 결합
 */
export async function generateWelfarePost(
  env: Env,
  params: {
    target: CrawlTarget;
    noticeTitle: string;
    detailUrl: string;
    detailText: string;
    hasAttachmentOnly: boolean;
    persona: PersonaStyle;
  }
): Promise<GeneratedWelfarePost> {
  const { target, noticeTitle, detailUrl, detailText, hasAttachmentOnly, persona } = params;

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentYear = todayStr.slice(0, 4);

  const systemPrompt = `너는 '울동네' 생활복지 큐레이션 매거진의 수석 에디터다.
오늘 날짜는 ${todayStr}(${currentYear}년)이다. 아래 지침을 엄격히 지켜 JSON 객체 하나만 반환하라.

1. category는 반드시 다음 5개 중 정확히 하나만 선택:
   "돌봄/육아", "어르신/건강", "주거/난방비", "소상공인/일자리", "생활/문화"
2. keywords는 알림 매칭 누락 방지를 위해 핵심어 + 표준 카테고리명 + 지역명 + 일상 동의어/유사어를 포함해 4~8개 배열로 작성하라. (예: ["방학돌봄", "초등돌봄", "겨울돌봄", "홍천군", "육아"])
3. app_title은 30자 이내로 직관적으로 작성하라.
4. app_summary_3lines는 반드시 "대상: ...\n혜택: ...\n신청방법: ..." 3줄 형식으로 작성하라.
5. has_attachment_only가 true인 경우, 본문에 없는 세부 금액이나 조건을 절대 추측해 지어내지 말고 제목과 확인된 정보만 요약한 뒤 "상세 자격 및 신청 서식은 하단 원문·첨부파일에서 확인해 주세요"라고 안내하라.
6. publish_to_blog 판별: 전국 공통 제도이거나 본문 정보가 풍부해 검색 유입 가치가 높으면 true, 소수 인원 단기 로컬 모집이거나 첨부파일만 있어 정보량이 적으면 false로 설정하라.
7. blog_content_md 작성 원칙 (검색 품질 및 사람 편집자 문체 유지):
   - 아래 페르소나 문체를 자연스럽게 적용하되, 매 글마다 다른 사람이 쓴 칼럼처럼 서두와 구성을 다양하게 작성하라.
   - "[실생활 절약 꿀팁]", "[신청 전 준비 서류 체크리스트]"처럼 대괄호([])로 묶은 고정 소제목이나 "- [ ]" 체크박스 기호, "---" 구분선은 절대 사용하지 마라. 대신 글 주제에 어울리는 자연스러운 소제목("## 소제목")을 매번 새롭게 지어라.
   - 독자가 자신의 상황인지 1초 만에 이해할 수 있도록 구체적인 가상 상황 예시(예: "예를 들어 월세 50만 원을 내는 사회초년생이라면...", "맞벌이 가정 기준으로...")를 1가지 이상 자연스럽게 포함하라.
   - 원문에 ${currentYear}년 이전의 과거 마감일이나 옛날 기준 연도가 적혀 있으면 그대로 옮기지 말고, "매년 정기 신청 기간(해당 기관 최신 공고 기준)"처럼 현재 시점에 맞게 안내하라. (없는 금액이나 조건은 절대 지어내지 마라.)
   - 준비 서류, 생활 속 절약 포인트, 흔한 탈락 주의사항을 자연스러운 문단과 목록("- 항목")으로 녹여내라.
8. deadline_date는 오늘(${todayStr}) 이후 유효한 마감일이 원문에 명확할 때만 "YYYY-MM-DD"로 적고, 상시 제도이거나 이미 지난 과거 날짜라면 null로 설정하라.
9. ai_confidence는 원문 정보의 명확성과 정확도 확신 수준을 0~100 정수로 평가하라.

[적용할 글맛 페르소나 #${persona.id}: ${persona.name}]
${persona.toneGuide}

[응답 JSON 스키마]
{
  "category": "돌봄/육아",
  "keywords": ["키워드1", "키워드2"],
  "app_title": "30자 이내 직관적 제목",
  "app_summary_3lines": "대상: ...\n혜택: ...\n신청방법: ...",
  "app_detail_summary": "앱 상세 화면용 3~5문장 핵심 요약",
  "publish_to_blog": true,
  "blog_title": "검색 SEO 최적화 제목",
  "blog_content_md": "마크다운 본문",
  "deadline_date": "YYYY-MM-DD 또는 null",
  "contact_phone": "전화번호 또는 null",
  "ai_confidence": 85
}`;

  const userPrompt = `기관명: ${target.org_name}
지역: ${target.region_sido} ${target.region_sigungu}
공고 제목: ${noticeTitle}
원문 URL: ${detailUrl}
첨부파일 전용 공고 여부: ${hasAttachmentOnly ? '예(추측 금지)' : '아니오'}

[수집된 상세 내용]
${detailText.slice(0, 5000)}`;

  const raw = await callGeminiJson<GeneratedWelfarePost>(
    env.GEMINI_API_KEY,
    env.GEMINI_WRITE_MODEL,
    systemPrompt,
    userPrompt
  );

  const safeCategory: WelfareCategory = VALID_CATEGORIES.includes(raw.category)
    ? raw.category
    : '생활/문화';

  const validDeadline =
    raw.deadline_date &&
    /^\d{4}-\d{2}-\d{2}$/.test(raw.deadline_date) &&
    raw.deadline_date >= todayStr
      ? raw.deadline_date
      : null;

  return {
    category: safeCategory,
    keywords: Array.isArray(raw.keywords) && raw.keywords.length > 0 ? raw.keywords : [target.region_sigungu],
    app_title: (raw.app_title || noticeTitle).slice(0, 40),
    app_summary_3lines: raw.app_summary_3lines || `대상: ${target.region_sigungu} 주민\n혜택: 공고 본문 확인\n신청방법: 원문 링크 참조`,
    app_detail_summary: raw.app_detail_summary || noticeTitle,
    publish_to_blog: Boolean(raw.publish_to_blog) && !hasAttachmentOnly,
    blog_title: raw.blog_title || noticeTitle,
    blog_content_md: raw.blog_content_md || '',
    deadline_date: validDeadline,
    contact_phone: raw.contact_phone || null,
    ai_confidence: typeof raw.ai_confidence === 'number' ? Math.min(100, Math.max(0, Math.round(raw.ai_confidence))) : 75
  };
}
