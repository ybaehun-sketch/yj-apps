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
  today: { ko: "오늘", en: "today", ja: "今日", zh: "今天", fr: "aujourd'hui", de: "heute", es: "hoy" },
  yesterday: { ko: "어제", en: "yesterday", ja: "昨日", zh: "昨天", fr: "hier", de: "gestern", es: "ayer" },
  week: { ko: "이번 주에", en: "this week", ja: "今週", zh: "本周", fr: "cette semaine", de: "diese Woche", es: "esta semana" },
  month: { ko: "이번 달에", en: "this month", ja: "今月", zh: "本月", fr: "ce mois-ci", de: "diesen Monat", es: "este mes" },
  lastMonth: { ko: "지난 달에", en: "last month", ja: "先月", zh: "上个月", fr: "le mois dernier", de: "letzten Monat", es: "el mes pasado" },
  year: { ko: "올해", en: "this year", ja: "今年", zh: "今年", fr: "cette année", de: "dieses Jahr", es: "este año" },
  all: { ko: "지금까지", en: "so far", ja: "これまで", zh: "至今", fr: "jusqu'ici", de: "bisher", es: "hasta ahora" },
};

const KIND_LABEL: Record<KindKey, Record<Lang, string>> = {
  image: { ko: "스샷", en: "screenshots", ja: "スクショ", zh: "截图", fr: "captures d'écran", de: "Screenshots", es: "capturas" },
  doc: { ko: "문서", en: "documents", ja: "文書", zh: "文档", fr: "documents", de: "Dokumente", es: "documentos" },
  link: { ko: "링크", en: "links", ja: "リンク", zh: "链接", fr: "liens", de: "Links", es: "enlaces" },
  voice: { ko: "음성 메모", en: "voice memos", ja: "音声メモ", zh: "语音备忘录", fr: "mémos vocaux", de: "Sprachnotizen", es: "notas de voz" },
  text: { ko: "텍스트 메모", en: "text notes", ja: "テキストメモ", zh: "文本备忘录", fr: "notes texte", de: "Textnotizen", es: "notas de texto" },
  all: { ko: "메모", en: "notes", ja: "メモ", zh: "备忘录", fr: "notes", de: "Notizen", es: "notas" },
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

  const asksCount = /(몇\s*(개|건|장|번)|개수|총\s*몇|얼마나|how many|何件|いくつ|何枚|何個|多少|几个|几条|几张|combien|wie\s*viele|cu[áa]nt[oa]s)/i.test(q);
  const asksList = /(보여\s*줘|보여\s*주|목록|알려\s*줘|뭐\s*있|show|list|見せて|教えて|显示|列出|有哪些|montre|liste|zeige|muestra|lista)/i.test(q);
  if (!asksCount && !asksList) return null;

  let period: PeriodKey | null = null;
  if (/(오늘|today|今日|今天|aujourd['’]?hui|heute|hoy)/i.test(q)) period = "today";
  else if (/(어제|yesterday|昨日|昨天|hier|gestern|ayer)/i.test(q)) period = "yesterday";
  else if (/(이번\s*주|금주|this week|今週|本周|这周|cette semaine|diese woche|esta semana)/i.test(q)) period = "week";
  else if (/(이번\s*달|이달|금월|this month|今月|本月|这个月|ce mois(?:-ci)?|diesen monat|este mes)/i.test(q)) period = "month";
  else if (/(지난\s*달|저번\s*달|전월|last month|先月|上个月|上月|le mois dernier|letzten monat|el mes pasado)/i.test(q)) period = "lastMonth";
  else if (/(올해|금년|this year|今年|cette ann[ée]e|dieses jahr|este a[ñn]o)/i.test(q)) period = "year";
  else if (/(전체|지금까지|모두|전부|총|all|total|全部|これまで|至今|tout|tous|jusqu['’]?ici|alle|bisher|todo|todos|hasta ahora)/i.test(q)) period = "all";

  let kind: KindKey | null = null;
  if (/(스샷|스크린샷|사진|이미지|캡처|screenshot|photo|image|スクショ|画像|写真|截图|图片|照片|captures?(?:\s+d['’]?[ée]cran)?|screenshots?|bilder?|fotos?|capturas?)/i.test(q)) kind = "image";
  else if (/(문서|파일|pdf|피디에프|워드|document|file|文書|ファイル|文档|文件|documents?|fichiers?|dokumente?|dateien|documentos?|archivos?)/i.test(q)) kind = "doc";
  else if (/(링크|url|주소|사이트|link|リンク|链接|网址|liens?|links?|enlaces?)/i.test(q)) kind = "link";
  else if (/(음성|녹음|보이스|voice|音声|语音|录音|m[ée]mos?\s+vocaux|audio|sprachnotizen?|notas?\s+de\s+voz)/i.test(q)) kind = "voice";
  else if (/(메모|기록|던진|올린|저장한|notes?|メモ|备忘录|记录|notes?|notizen?|notas?)/i.test(q)) kind = "all";

  if (!period && !kind) return null;

  // 기간·종류·통계 기능어 외에 특정 주제어(예: "자격증", "드론")가 남아있으면 AI 검색에 맡긴다.
  const leftover = q
    .replace(/[?？¿!¡.,~'’"-]/g, " ")
    .replace(/(오늘|어제|이번\s*주|금주|이번\s*달|이달|금월|지난\s*달|저번\s*달|전월|올해|금년|전체|지금까지|모두|전부|총)/gi, " ")
    .replace(/(스샷|스크린샷|사진|이미지|캡처|문서|파일|pdf|피디에프|워드|링크|url|주소|사이트|음성|녹음|보이스|메모|기록)/gi, " ")
    .replace(/(에|에서|은|는|이|가|을|를|도|만|의|로|으로)/g, " ")
    .replace(/(올린|던진|저장한|보낸|넣은|찍은|적은|한|거|것|건|개|장|몇|개수|얼마나|있어|있나|있나요|야|이야|예요|에요|인가요|일까|보여줘|보여주|목록|알려줘|알려주|뭐|찾아줘)/g, " ")
    .replace(/\b(how|many|show|list|all|total|notes?|screenshots?|documents?|files?|links?|voice|this|month|week|today|yesterday|year|saved|in|are|there|have|did|i)\b/gi, " ")
    .replace(/(今天|昨天|本周|这周|本月|这个月|上个月|上月|今年|全部|至今|一共|总共|多少|几|个|条|张|保存|上传|的|有|吗|了|截图|图片|照片|文档|文件|链接|网址|语音|录音|备忘录|记录)/g, " ")
    .replace(/\b(combien|de|d|des|les|la|le|aujourd|hui|hier|cette|semaine|ce|mois|ci|dernier|ann[ée]e|jusqu|ici|tout|tous|captures?|[ée]cran|documents?|fichiers?|liens?|m[ée]mos?|vocaux|notes?|enregistr[ée]s?|sauvegard[ée]s?|ai|je)\b/gi, " ")
    .replace(/\b(wie|viele|heute|gestern|diese|diesen|dieses|woche|monat|letzten|jahr|alle|bisher|screenshots?|bilder?|dokumente?|dateien|links?|sprachnotizen?|notizen?|gespeichert|habe|ich|gibt|es)\b/gi, " ")
    .replace(/\b(cu[áa]nt[oa]s|hoy|ayer|esta|semana|este|mes|el|pasado|a[ñn]o|todo|todos|hasta|ahora|capturas?|documentos?|archivos?|enlaces?|notas?|voz|guardad[oa]s?|tengo|hay)\b/gi, " ")
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
  } else if (lang === "zh") {
    answer = count === 0
      ? `${pText}还没有保存的${kText}。`
      : `${pText}共保存了${count}条${kText}。`;
  } else if (lang === "fr") {
    answer = count === 0
      ? `Aucun(e) ${kText} enregistré(e) ${pText}.`
      : `Vous avez enregistré ${count} ${kText} ${pText}.`;
  } else if (lang === "de") {
    answer = count === 0
      ? `${pText} wurden noch keine ${kText} gespeichert.`
      : `Sie haben ${pText} ${count} ${kText} gespeichert.`;
  } else if (lang === "es") {
    answer = count === 0
      ? `No hay ${kText} guardados ${pText}.`
      : `Guardaste ${count} ${kText} ${pText}.`;
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

  const MAX_CANDIDATES = 60;
  const matchedIndices = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.idx);

  const selectedSet = new Set<number>(matchedIndices.slice(0, MAX_CANDIDATES));
  for (let i = 0; i < rows.length && selectedSet.size < MAX_CANDIDATES; i++) {
    selectedSet.add(i);
  }
  const selectedIndices = rows.map((_, i) => i).filter((i) => selectedSet.has(i));

  const withBody = new Set(matchedIndices.slice(0, 15));
  // 키워드 매칭이 하나도 없으면 최근 10건만 짧은 본문 포함
  if (withBody.size === 0) {
    for (let i = 0; i < Math.min(10, rows.length); i++) withBody.add(i);
  }

  return selectedIndices.map((i) => {
    const r = rows[i]!;
    return {
      id: r.id,
      saved: r.created_at.slice(0, 10),
      kind: r.file_name ? "doc" : r.kind,
      category: r.category,
      summary: r.summary,
      date: r.detected_date,
      tags: r.tags,
      title: r.link_title,
      ...(withBody.has(i) && r.content ? { text: r.content.slice(0, 160) } : {}),
    };
  });
}
