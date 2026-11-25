import type { PersonaStyle } from './personas';
import type { BlogCandidateRow, CrawlTarget, Env, GeneratedWelfarePost, ScannedNotice, WelfareCategory } from './types';
import { fetchWithTimeout, parseJsonFromLlm } from './utils';

const VALID_CATEGORIES: WelfareCategory[] = [
  '돌봄/아동/청소년',
  '어르신/건강',
  '주거/난방비',
  '소상공인/일자리',
  '농림/축산/어업',
  '생활/문화/법률',
  '다문화'
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
 * 추후 타사 AI API 키(BACKUP_LLM_API_KEY) 등록 시 자동 백업 호출
 * - anthropic(Claude) 또는 openai 호환(OpenAI, Groq 등) 규격 지원
 */
async function callBackupLlmJson<T>(
  env: Env,
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const apiKey = env.BACKUP_LLM_API_KEY;
  if (!apiKey) {
    throw new Error('BACKUP_LLM_API_KEY is not configured');
  }

  const provider = (env.BACKUP_LLM_PROVIDER || 'openai').toLowerCase();
  const isAnthropic = provider === 'anthropic' || (env.BACKUP_LLM_MODEL || '').toLowerCase().startsWith('claude');

  if (isAnthropic) {
    const baseUrl = (env.BACKUP_LLM_BASE_URL || 'https://api.anthropic.com/v1').replace(/\/$/, '');
    const model = env.BACKUP_LLM_MODEL || 'claude-3-5-haiku-latest';
    const res = await fetchWithTimeout(`${baseUrl}/messages`, 30000, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!res.ok) {
      throw new Error(`Backup Anthropic API error (${model}): ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.text)?.text;
    if (!text) {
      throw new Error(`Backup Anthropic API returned empty text (${model})`);
    }
    return parseJsonFromLlm<T>(text);
  }

  const baseUrl = (env.BACKUP_LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = env.BACKUP_LLM_MODEL || 'gpt-4o-mini';
  const res = await fetchWithTimeout(`${baseUrl}/chat/completions`, 30000, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!res.ok) {
    throw new Error(`Backup OpenAI-compatible API error (${model}): ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(`Backup OpenAI-compatible API returned empty text (${model})`);
  }
  return parseJsonFromLlm<T>(text);
}

/**
 * 1순위 Gemini 모델 -> 2순위 예비 Gemini 모델 자동 전환 -> (등록 시) 3순위 타사 API 백업
 */
async function callAiJsonWithFallback<T>(
  env: Env,
  models: Array<string | undefined>,
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const uniqueModels = Array.from(new Set(models.map((m) => m?.trim()).filter((m): m is string => Boolean(m))));
  let lastError: unknown;

  for (let i = 0; i < uniqueModels.length; i++) {
    const model = uniqueModels[i];
    try {
      return await callGeminiJson<T>(env.GEMINI_API_KEY, model, systemPrompt, userPrompt);
    } catch (err) {
      lastError = err;
      const nextModel = uniqueModels[i + 1];
      if (nextModel) {
        console.warn(`[AI 모델 자동 전환] ${model} 실패 -> 예비 모델(${nextModel})로 재시도:`, err);
      }
    }
  }

  if (env.BACKUP_LLM_API_KEY) {
    console.warn('[AI 타사 백업 전환] Gemini 모델 모두 실패 -> 타사 백업 API 호출');
    return await callBackupLlmJson<T>(env, systemPrompt, userPrompt);
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError ?? 'All AI models failed'));
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
- 입찰, 공사, 용역, 물품구매, 계약, 수의계약, 인사발령, 공무원·정규직·전문직 시험 및 채용, 단순 행정 고시, 주정차 단속, 분묘 개장, 도로 통제
- 위원회·심의위원·모니터단·서포터즈·자문단 모집, 단순 시설 대관·체육시설 사용 안내, 설문조사, 단순 홍보·캠페인(단, 문화누리카드·지역화폐·바우처 혜택 및 잔액소진 이벤트는 제외하지 말고 선별), 소수 특정 단체 대상 보조금
- 이미 '접수마감', '모집마감', '신청마감', '진행종료', '완료' 상태인 공고·프로그램

[선별 대상]
- 일반 주민·가정·아동·청소년·어르신·소상공인·농어업인이 직접 신청해 체감할 수 있는 실질적 보조금, 지원금, 바우처, 난방비/에너지 지원, 돌봄/육아/취학·교육·장학, 건강검진/예방접종, 주거/월세 지원, 취업/창업/일자리 지원, 농림·축산·어업 경영/자재 지원, 무료 법률상담·국선변론·채무조정 등 권리구제 지원
- 문화누리카드·지역화폐·소비쿠폰·바우처 활용 및 잔액소진 혜택 안내 (제목에 '이벤트'가 포함되어도 실질 혜택이면 선별)
- 일반 주민·어르신·청년이 바로 지원해 소득을 얻을 수 있는 지자체 공공일자리 및 단기 근로 모집 (예: 산불감시원, 산림재난대응단, 공공근로, 노인일자리, 환경·교통·돌봄 도우미, 청년 인턴 등)

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

  const result = await callAiJsonWithFallback<ScannedNotice[]>(
    env,
    [env.GEMINI_SCAN_MODEL, env.GEMINI_SCAN_FALLBACK_MODEL ?? env.GEMINI_WRITE_MODEL],
    systemPrompt,
    userPrompt
  );

  if (!Array.isArray(result)) return [];
  return result
    .filter((item) => item && item.title && item.detail_url)
    .slice(0, maxItems);
}

/**
 * 2차 AI 가공 (앱 카드 요약 + 블로그 후보 판별 전용):
 * 순찰 시(12:30, 18:00, 05:00)에는 가벼운 앱 요약과 블로그 후보 여부만 생성하고,
 * 긴 블로그 글은 새벽 5시 최상위 후보 선별 후 별도 작성해 비용·속도를 최적화함.
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
  const { target, noticeTitle, detailUrl, detailText, hasAttachmentOnly } = params;

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentYear = todayStr.slice(0, 4);

  const systemPrompt = `너는 '울동네' 생활복지 큐레이션 플랫폼의 수석 에디터다.
오늘 날짜는 ${todayStr}(${currentYear}년)이다. 아래 지침을 엄격히 지켜 JSON 객체 하나만 반환하라.

1. category는 반드시 다음 7개 중 내용과 가장 정확히 일치하는 하나만 선택:
   - "돌봄/아동/청소년": 임신·출산·육아·보육·어린이집·유치원·취학·초중고 교육비·장학금·방과후 돌봄·청소년 활동/자립 지원·일반 가족센터 프로그램
   - "어르신/건강": 노인·어르신 복지·치매·건강검진·예방접종·의료비·장애인 건강/활동지원
   - "주거/난방비": 전세/월세/주택자금·공공임대·주거급여·난방비·에너지바우처·전기/수도/가스 요금 감면
   - "소상공인/일자리": 실제 취업·공공일자리·채용·창업·직업훈련·구직지원 및 소상공인·자영업 경영/융자 지원에 한정 (농어업, 법률지원, 체육시설, 문화축제, 위원회·멘토단 모집은 절대 여기 넣지 말 것)
   - "농림/축산/어업": 농업·임업·축산·수산·어업인 대상 보조금, 비료·농기계·영농자재 지원, 어선·양식·농어촌 경영/융자/직불금 지원
   - "생활/문화/법률": 무료 법률상담·국선변론·법률구조·채무조정·긴급생계, 문화누리카드/바우처, 체육시설·문화행사·축제·공연·평생학습·도서관·교통·환경·세금/생활정보 전반
   - "다문화": 다문화가족·결혼이민자·외국인 주민 대상 한국어교육·초기 정착 지원·자녀 언어발달/이중언어·통번역·가족센터 다문화 프로그램
2. keywords는 알림 매칭 누락 방지를 위해 핵심어 + 표준 카테고리명 + 지역명 + 일상 동의어/유사어를 포함해 4~8개 배열로 작성하라. (예: ["방학돌봄", "초등돌봄", "겨울돌봄", "홍천군", "돌봄/아동/청소년"])
3. app_title은 30자 이내로 직관적으로 작성하라.
4. app_summary_3lines는 기본 "대상: ...\n혜택: ...\n신청방법: ..." 3줄에 더해, 공고 내용에 따라 필요한 경우 "일정: ...", "장소: ...", "준비물: ...", "문의: ..." 등을 추가해 총 3~5줄로 간결하게 작성하라. (한 줄에 핵심만 짧게 작성)
5. app_detail_summary는 모바일 화면에서 빽빽하지 않도록 핵심만 추려 3~4개의 짧은 문장으로 간단히 요약하라. 문장 사이나 항목마다 줄바꿈(\n\n)을 적극 활용해 한눈에 읽기 편하게 작성하라. (단, 원문에 없는 금액이나 조건은 절대 지어내지 마라.)
6. has_attachment_only가 true인 경우, 본문에 없는 세부 금액이나 조건을 절대 추측해 지어내지 말고 제목과 확인된 정보만 요약한 뒤 "상세 자격 및 신청 서식은 하단 원문·첨부파일에서 확인해 주세요"라고 안내하라.
7. publish_to_blog 판별: 대중적 관심이 높아 키워드 검색량이 풍부할 것으로 예상되는 주제(생활비·주거/월세·난방비·출산/육아·어르신 건강·세금/요금 감면·청년/소상공인 지원 등)이면서 본문 정보가 충실해 검색 유입 가치가 높으면 true, 소수 대상의 지엽적·단기 행사나 특수/전문 분야 한정 모집, 또는 첨부파일만 있어 정보량이 적으면 false로 설정하라.
8. deadline_date는 오늘(${todayStr}) 이후 유효한 마감일이 원문에 명확할 때만 "YYYY-MM-DD"로 적고, 상시 제도이거나 이미 지난 과거 날짜라면 null로 설정하라.
9. ai_confidence는 다음 두 가지를 종합해 0~100 정수로 평가하라:
   - 원문 정보의 명확성과 정확도
   - 일반 주민에게 실질적으로 도움이 되는 생활복지·지원금·돌봄·건강·주거·일자리 및 **문화·여가·공연·전시·생활체육·평생교육·주민자치 프로그램** 혜택인지 여부
   ※ 문화·여가·교육 프로그램도 주민이 직접 참여해 누리는 중요한 생활복지이므로, 대상·혜택·일정·신청방법이 명확하면 **85점 이상** 높은 점수를 부여하라.
   ※ 단, 단순 체육시설 대관료/사용료, 위원회/모니터단 모집, 소수 특정 단체 지원, 단순 행정 홍보/캠페인처럼 일반 주민 혜택과 거리가 먼 공고는 60점 이하로 평가하라.

[응답 JSON 스키마]
{
  "category": "돌봄/육아",
  "keywords": ["키워드1", "키워드2"],
  "app_title": "30자 이내 직관적 제목",
  "app_summary_3lines": "대상: ...\n혜택: ...\n신청방법: ...\n(필요시 일정/장소/문의 등 3~5줄)",
  "app_detail_summary": "줄바꿈(\\n\\n)을 적극 활용한 3~4문장의 간단명료한 상세 설명",
  "publish_to_blog": true,
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

  const raw = await callAiJsonWithFallback<GeneratedWelfarePost>(
    env,
    [env.GEMINI_SCAN_MODEL, env.GEMINI_SCAN_FALLBACK_MODEL ?? env.GEMINI_WRITE_MODEL],
    systemPrompt,
    userPrompt
  );

  const safeCategory: WelfareCategory = VALID_CATEGORIES.includes(raw.category)
    ? raw.category
    : '생활/문화/법률';

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
    blog_title: null,
    blog_content_md: null,
    deadline_date: validDeadline,
    contact_phone: raw.contact_phone || null,
    ai_confidence: Number.isFinite(Number(raw.ai_confidence))
      ? Math.min(100, Math.max(0, Math.round(Number(raw.ai_confidence))))
      : 75
  };
}

/**
 * 3차 AI 심층 글쓰기 (새벽 5시 최상위 최대 3개 후보 전용):
 * 검색 품질과 블로그 점수를 높이기 위해 1,500자 이상 충실한 가이드 글 작성
 */
export async function generateBlogDraftArticle(
  env: Env,
  post: BlogCandidateRow,
  persona: PersonaStyle
): Promise<{ blog_title: string; blog_content_md: string }> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentYear = todayStr.slice(0, 4);

  const systemPrompt = `너는 '울동네' 생활복지 큐레이션 매거진의 수석 에디터다.
오늘 날짜는 ${todayStr}(${currentYear}년)이다. 아래 지침을 엄격히 지켜 JSON 객체 하나만 반환하라.

1. blog_title 작성 원칙:
   - 이미 거대 블로그가 선점한 1~2단어 대표 키워드 중심 제목("OO 지원금 총정리", "OO 신청 방법" 등)을 피하고, 실제 사용자가 검색창에 길게 쳐서 들어올 법한 롱테일(틈새) 제목(25~45자)으로 작성하라.
   - "구체적 대상/상황(예: 무주택 1인 가구, 65세 이상, 맞벌이 초등맘, 기초수급자 등) + 세부 조건/금액/기한/예외 주의사항"을 자연스럽게 결합하라.
   - 낚시성 어그로나 과장 없이 원문에 근거한 구체적 핵심 포인트를 담아 클릭률과 검색 노출을 동시에 높여라.

2. blog_content_md 작성 원칙 (검색 점수·체류 시간 극대화):
   - 전체 본문 분량은 공백 포함 최소 1,500자 ~ 2,200자 이상으로 충실하게 작성해 '얇은 글' 판정을 피하라.
   - 아래 페르소나 문체를 자연스럽게 적용하되, 매 글마다 다른 사람이 쓴 칼럼처럼 서두와 구성을 다양하게 작성하라.
   - "[실생활 절약 꿀팁]", "[신청 전 준비 서류 체크리스트]"처럼 대괄호([])로 묶은 고정 소제목이나 "- [ ]" 체크박스 기호, "---" 구분선은 절대 사용하지 마라. 대신 글 주제에 어울리는 자연스러운 소제목("## 소제목")을 4~5개 새롭게 지어라.
   - 독자가 자신의 상황인지 1초 만에 이해할 수 있도록 구체적인 가상 상황 예시(예: "예를 들어 월세 50만 원을 내는 사회초년생이라면...")를 1가지 이상 자연스럽게 포함하라.
   - 지원 대상과 제외 조건, 준비 서류 안내, 신청 단계별 주의사항(자주 하는 실수), 독자가 가장 많이 궁금해할 질문 2가지(Q&A 형식)를 자연스럽게 녹여내라. (단, 사실에 없는 금액이나 조건은 절대 지어내지 마라.)
   - 원문에 ${currentYear}년 이전의 과거 마감일이나 옛날 기준 연도가 적혀 있으면 그대로 옮기지 말고, "매년 정기 신청 기간(해당 기관 최신 공고 기준)"처럼 현재 시점에 맞게 안내하라.
   - 노령의 어르신들도 눈이 피로하지 않고 편하게 읽을 수 있도록 한 문단은 반드시 1~2문장 이내로 짧게 끊고, 문단과 문단 사이에 빈 줄(\\n\\n)을 넉넉히 넣어 빽빽하게 쓰지 마라.

[적용할 글맛 페르소나 #${persona.id}: ${persona.name}]
${persona.toneGuide}

[응답 JSON 스키마]
{
  "blog_title": "구체적 상황·조건 중심 롱테일 제목 (25~45자)",
  "blog_content_md": "최소 1,500자 이상의 마크다운 본문"
}`;

  const userPrompt = `기관명: ${post.org_name}
지역: ${post.region_sido} ${post.region_sigungu}
카테고리: ${post.category}
제목: ${post.app_title}
원문 URL: ${post.source_url}
문의처: ${post.contact_phone ?? '공고문 참조'}
마감일: ${post.deadline_date ?? '상시 또는 공고문 참조'}

[핵심 3줄 요약]
${post.app_summary_3lines}

[상세 요약 내용]
${post.app_detail_summary}`;

  const raw = await callAiJsonWithFallback<{ blog_title?: string; blog_content_md?: string }>(
    env,
    [env.GEMINI_WRITE_MODEL, env.GEMINI_WRITE_FALLBACK_MODEL ?? env.GEMINI_SCAN_MODEL],
    systemPrompt,
    userPrompt
  );

  return {
    blog_title: (raw.blog_title || post.app_title).trim(),
    blog_content_md: (raw.blog_content_md || post.app_detail_summary).trim()
  };
}
