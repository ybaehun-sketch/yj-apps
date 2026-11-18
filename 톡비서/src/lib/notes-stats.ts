import type { Lang } from "./i18n";

export type SearchRow = {
  id: string;
  created_at: string;
  kind: string;
  content: string;
  summary: string;
  category: string;
  detected_date: string | null;
  tags: string[];
  link_title: string | null;
  file_name?: string | null;
};

type PeriodKey = "today" | "yesterday" | "week" | "month" | "lastMonth" | "year" | "all";
type KindKey = "image" | "doc" | "link" | "voice" | "text" | "all";

const PERIOD_LABEL: Record<PeriodKey, Record<Lang, string>> = {
  today: { ko: "오늘", en: "today", ja: "今日" },
  yesterday: { ko: "어제", en: "yesterday", ja: "昨日" },
  week: { ko: "이번 주에", en: "this week", ja: "今週" },
  month: { ko: "이번 달에", en: "this month", ja: "今月" },
  lastMonth: { ko: "지난 달에", en: "last month", ja: "先月" },
  year: { ko: "올해", en: "this year", ja: "今年" },
  all: { ko: "지금까지", en: "so far", ja: "これまで" },
};

const KIND_LABEL: Record<KindKey, Record<Lang, string>> = {
  image: { ko: "스샷", en: "screenshots", ja: "スクショ" },
  doc: { ko: "문서", en: "documents", ja: "文書" },
  link: { ko: "링크", en: "links", ja: "リンク" },
  voice: { ko: "음성 메모", en: "voice memos", ja: "音声メモ" },
  text: { ko: "텍스트 메모", en: "text notes", ja: "テキストメモ" },
  all: { ko: "메모", en: "notes", ja: "メモ" },
};

function toLocalDate(iso: string, tzOffsetMin: number): Date {
  return new Date(Date.parse(iso) - tzOffsetMin * 60_000);
}

function inPeriod(iso: string, period: PeriodKey, tzOffsetMin: number, nowMs: number): boolean {
  if (period === "all") return true;
  const d = toLocalDate(iso, tzOffsetMin);
  const now = new Date(nowMs - tzOffsetMin * 60_000);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const day = now.getUTCDate();
  if (period === "today") return d.getUTCFullYear() === y && d.getUTCMonth() === m && d.getUTCDate() === day;
  if (period === "yesterday") {
    const yd = new Date(Date.UTC(y, m, day - 1));
    return d.getUTCFullYear() === yd.getUTCFullYear() && d.getUTCMonth() === yd.getUTCMonth() && d.getUTCDate() === yd.getUTCDate();
  }
  if (period === "week") {
    const start = new Date(Date.UTC(y, m, day - now.getUTCDay()));
    return d.getTime() >= start.getTime();
  }
  if (period === "month") return d.getUTCFullYear() === y && d.getUTCMonth() === m;
  if (period === "lastMonth") {
    const lm = new Date(Date.UTC(y, m - 1, 1));
    return d.getUTCFullYear() === lm.getUTCFullYear() && d.getUTCMonth() === lm.getUTCMonth();
  }
  return d.getUTCFullYear() === y;
}

function matchKind(r: SearchRow, kind: KindKey): boolean {
  if (kind === "all") return true;
  if (kind === "doc") return Boolean(r.file_name) || r.kind === "doc";
  if (kind === "text") return r.kind === "text" && !r.file_name;
  return r.kind === kind;
}

/**
 * 순수 기간·종류 통계/목록 질문(예: "이번 달에 올린 스샷은 몇개야?")이면
 * AI를 호출하지 않고 즉시 정확하게 계산해 응답한다. 주제 검색어면 null 반환.
 */
export function tryAnswerStatsLocally(
  question: string,
  rows: SearchRow[],
  tzOffsetMin: number,
  lang: Lang = "ko",
  nowMs = Date.now(),
): { answer: string; noteIds: string[] } | null {
  const q = question.trim();
  if (!q || q.length > 60) return null;

  const asksCount = /(몇\s*(개|건|장|번)|개수|총\s*몇|얼마나|how many|何件|いくつ|何枚|何個)/i.test(q);
  const asksList = /(보여\s*줘|보여\s*주|목록|알려\s*줘|뭐\s*있|show|list|見せて|教えて)/i.test(q);
  if (!asksCount && !asksList) return null;

  let period: PeriodKey | null = null;
  if (/(오늘|today|今日)/i.test(q)) period = "today";
  else if (/(어제|yesterday|昨日)/i.test(q)) period = "yesterday";
  else if (/(이번\s*주|금주|this week|今週)/i.test(q)) period = "week";
  else if (/(이번\s*달|이달|금월|this month|今月)/i.test(q)) period = "month";
  else if (/(지난\s*달|저번\s*달|전월|last month|先月)/i.test(q)) period = "lastMonth";
  else if (/(올해|금년|this year|今年)/i.test(q)) period = "year";
  else if (/(전체|지금까지|모두|전부|총|all|total|全部|これまで)/i.test(q)) period = "all";

  let kind: KindKey | null = null;
  if (/(스샷|스크린샷|사진|이미지|캡처|screenshot|photo|image|スクショ|画像|写真)/i.test(q)) kind = "image";
  else if (/(문서|파일|pdf|피디에프|워드|document|file|文書|ファイル)/i.test(q)) kind = "doc";
  else if (/(링크|url|주소|사이트|link|リンク)/i.test(q)) kind = "link";
  else if (/(음성|녹음|보이스|voice|音声)/i.test(q)) kind = "voice";
  else if (/(메모|기록|던진|올린|저장한|notes?|メモ)/i.test(q)) kind = "all";

  if (!period && !kind) return null;

  // 기간·종류·통계 기능어 외에 특정 주제어(예: "자격증", "드론")가 남아있으면 AI 검색에 맡긴다.
  const leftover = q
    .replace(/[?？!.,~]/g, " ")
    .replace(/(오늘|어제|이번\s*주|금주|이번\s*달|이달|금월|지난\s*달|저번\s*달|전월|올해|금년|전체|지금까지|모두|전부|총)/gi, " ")
    .replace(/(스샷|스크린샷|사진|이미지|캡처|문서|파일|pdf|피디에프|워드|링크|url|주소|사이트|음성|녹음|보이스|메모|기록)/gi, " ")
    .replace(/(에|에서|은|는|이|가|을|를|도|만|의|로|으로)/g, " ")
    .replace(/(올린|던진|저장한|보낸|넣은|찍은|적은|한|거|것|건|개|장|몇|개수|얼마나|있어|있나|있나요|야|이야|예요|에요|인가요|일까|보여줘|보여주|목록|알려줘|알려주|뭐|찾아줘)/g, " ")
    .replace(/(how|many|show|list|all|total|notes?|screenshots?|documents?|files?|links?|voice|this|month|week|today|yesterday|year|saved|in)/gi, " ")
    .trim();
  if (leftover.length > 0) return null;

  const p = period ?? "all";
  const k = kind ?? "all";
  const matched = rows.filter((r) => inPeriod(r.created_at, p, tzOffsetMin, nowMs) && matchKind(r, k));
  const pText = PERIOD_LABEL[p][lang];
  const kText = KIND_LABEL[k][lang];
  const count = matched.length;

  let answer: string;
  if (lang === "en") {
    answer = count === 0
      ? `There are no ${kText} saved ${pText}.`
      : `You saved ${count} ${kText} ${pText}.`;
  } else if (lang === "ja") {
    answer = count === 0
      ? `${pText}保存した${kText}はまだありません。`
      : `${pText}保存した${kText}は全部で${count}件です。`;
  } else {
    answer = count === 0
      ? `${pText} 올린 ${kText}는 아직 없어요.`
      : `${pText} 올린 ${kText}는 모두 ${count}건이에요.`;
  }

  return { answer, noteIds: matched.slice(0, 20).map((r) => r.id) };
}

/**
 * AI 검색용 경량 문서 목록 생성:
 * 전체는 목차(요약·카테고리·태그·제목·날짜)만 보내고, 질문 키워드와 겹치는 상위 15건만 짧은 본문을 포함한다.
 */
export function buildCompactSearchDocs(question: string, rows: SearchRow[]) {
  const tokens = question
    .toLowerCase()
    .split(/[\s,?.!]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);

  const scored = rows.map((r, idx) => {
    const hay = `${r.summary} ${r.category} ${r.tags.join(" ")} ${r.link_title ?? ""} ${r.content.slice(0, 300)}`.toLowerCase();
    let score = 0;
    for (const tk of tokens) {
      if (hay.includes(tk)) score += 2;
    }
    return { idx, score };
  });

  const withBody = new Set(
    scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map((s) => s.idx),
  );
  // 키워드 매칭이 하나도 없으면 최근 10건만 짧은 본문 포함
  if (withBody.size === 0) {
    for (let i = 0; i < Math.min(10, rows.length); i++) withBody.add(i);
  }

  return rows.map((r, i) => ({
    id: r.id,
    saved: r.created_at.slice(0, 10),
    kind: r.file_name ? "doc" : r.kind,
    category: r.category,
    summary: r.summary,
    date: r.detected_date,
    tags: r.tags,
    title: r.link_title,
    ...(withBody.has(i) && r.content ? { text: r.content.slice(0, 160) } : {}),
  }));
}
