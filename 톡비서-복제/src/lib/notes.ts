// Browser-safe helpers for 톡비서 notes (shared by client and server).
export const NOTE_CATEGORIES = ["일정", "쇼핑", "아이디어", "금융", "맛집", "할일", "기타"] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export const CATEGORY_EMOJI: Record<NoteCategory, string> = {
  일정: "📅", 쇼핑: "🛍️", 아이디어: "💡", 금융: "💰", 맛집: "🍝", 할일: "✅", 기타: "🗂️",
};

/** 사용자 맞춤 카테고리 이모지 (클라이언트에서 등록). */
const customEmoji: Record<string, string> = {};
export function registerCustomCategories(list: { name: string; emoji: string }[]) {
  for (const k of Object.keys(customEmoji)) delete customEmoji[k];
  for (const c of list) customEmoji[c.name] = c.emoji;
}
export function catEmoji(name: string): string {
  return (CATEGORY_EMOJI as Record<string, string>)[name] ?? customEmoji[name] ?? "🏷️";
}

/** 플랜별 맞춤 카테고리 최대 개수 (무료 0). */
export const CUSTOM_CATEGORY_LIMIT = { free: 0, premium: 10, lifetime: 30 } as const;

export type Analysis = {
  summary: string;
  category: string;
  has_date: boolean;
  detected_date: string | null;
  remind_at: string | null;
  remind_message: string | null;
  tags: string[];
  secretary_reply: string;
};

const validIso = (v: unknown) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

/** Default reminder: 20:00 the evening before the event (local offset given in minutes). */
export function defaultRemindAt(detectedIso: string, tzOffsetMin: number): string {
  const local = new Date(Date.parse(detectedIso) - tzOffsetMin * 60000);
  local.setUTCDate(local.getUTCDate() - 1);
  local.setUTCHours(20, 0, 0, 0);
  return new Date(local.getTime() + tzOffsetMin * 60000).toISOString();
}

/** Coerce raw model JSON into a safe Analysis. */
export function normalizeAnalysis(raw: unknown, fallbackText: string, tzOffsetMin = -540, extraCategories: string[] = []): Analysis {
  const p = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof Analysis, unknown>>;
  const allowed = [...NOTE_CATEGORIES, ...extraCategories] as string[];
  const category = allowed.includes(String(p.category)) ? String(p.category) : "기타";
  const detected = validIso(p.detected_date);
  const has_date = Boolean(p.has_date) && detected !== null;
  let remind_at = has_date ? validIso(p.remind_at) : null;
  if (has_date && detected && (!remind_at || Date.parse(remind_at) > Date.parse(detected))) {
    remind_at = defaultRemindAt(detected, tzOffsetMin);
  }
  const tags = Array.isArray(p.tags)
    ? p.tags.filter((t): t is string => typeof t === "string" && t.trim() !== "").slice(0, 5).map((t) => t.replace(/^#/, "").trim())
    : [];
  const summary = String(p.summary ?? "").trim() || fallbackText.slice(0, 40) || "스크린샷";
  return {
    summary: summary.slice(0, 80),
    category,
    has_date,
    detected_date: has_date ? detected : null,
    remind_at,
    remind_message: has_date && typeof p.remind_message === "string" ? p.remind_message.slice(0, 120) : null,
    tags,
    secretary_reply: String(p.secretary_reply ?? "").trim().slice(0, 120) || "잘 보관해 두었어요! 📂",
  };
}

/** True when the input looks like a question/search over saved notes rather than a new dump. */
export function isQuestion(text: string): boolean {
  const t = text.trim();
  if (!t || /^https?:\/\//.test(t)) return false;
  if (/[?？]\s*$/.test(t)) return true;
  return /(찾아\s*줘|찾아줘|보여\s*줘|알려\s*줘|모아\s*줘|있었지|였지|이었지|언제야|언제지|언제였|어디였|어디야|뭐였|뭐야|뭐지|얼마였|얼마야|몇\s*시|몇\s*일|누구였|누구지|저장한\s|적어둔|던져둔|기억나)/.test(t);
}

/** True when the user's reply confirms the pending save ("그래", "응", "저장해줘"...). */
export function isYes(text: string): boolean {
  return /^(그래|응|웅|ㅇㅇ|ㅇㅋ|오케이|ok|okay|yes|네|넵|예|좋아|저장|저장해|저장해줘|그래줘|그렇게\s*해줘?|yeah|yep|sure|save( it)?|はい|うん|いいよ|保存して|保存)[!.~ 。！]*$/i.test(text.trim());
}

/** Extract the first http(s) URL from a text. */
export function firstUrl(text: string): string | null {
  return text.match(/https?:\/\/[^\s<>"']+/)?.[0] ?? null;
}

/** Pull Open Graph title/description/image out of raw HTML. */
export function parseOg(html: string, baseUrl: string): { title: string | null; description: string | null; image: string | null } {
  const meta = (key: string) => {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i");
    const tag = html.match(re)?.[0];
    return tag?.match(/content=["']([^"']*)["']/i)?.[1]?.trim() || null;
  };
  const dec = (s: string | null) => s?.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">") ?? null;
  const title = dec(meta("og:title") ?? meta("twitter:title") ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null);
  const description = dec(meta("og:description") ?? meta("description"));
  let image = dec(meta("og:image") ?? meta("twitter:image"));
  if (image) { try { image = new URL(image, baseUrl).toString(); } catch { image = null; } }
  return { title: title?.slice(0, 200) || null, description: description?.slice(0, 300) || null, image };
}

/** 직전 메모를 고쳐달라는 말인지 ("알람은 화요일 10시로 부탁해", "카테고리 할일로 바꿔줘"). */
export function isEdit(text: string): boolean {
  const t = text.trim();
  if (!t || /^https?:\/\//.test(t) || t.length > 120) return false;
  return /(바꿔|변경|수정|고쳐|옮겨|미뤄|당겨|로\s*해\s*줘|으로\s*해\s*줘|로\s*부탁|으로\s*부탁|알람|알림|태그.*(추가|넣어|빼)|지워\s*줘|취소|꺼\s*줘|없애)/.test(t);
}

/** "~라고 저장해줘", "메모해줘", "기록해 둬", "적어줘", "남겨줘", "보관해줘" 처럼 명확한 저장 지시. */
export function isSaveCommand(text: string): boolean {
  return /(저장|메모|기록|적어|남겨|보관|킵)\s*(해|좀|해\s*줘|해\s*둬|해\s*놔|해\s*주세요|줘|둬|놔|부탁)/.test(text.trim()) && !/(저장한|저장해\s*둔|적어\s*둔|기록한).*(뭐|어디|언제|찾아|보여|[?？])/.test(text);
}

export type OffTopicKind = "web" | "create" | "chat" | "self";

/** 톡비서가 하지 않는 요청 유형 (웹검색 / 표·글 창작 / 잡담 / 톡비서 자기소개). 해당 없으면 null. */
export function offTopicKind(text: string): OffTopicKind | null {
  const t = text.trim();
  if (!t || /^https?:\/\//.test(t) || t.length > 60) return null;
  // 명시적 저장 지시("~라고 저장해줘", "메모해 둬", "기록해줘")는 무조건 메모로 통과
  if (isSaveCommand(t) && !/(검색해|찾아봐|구글링)/.test(t)) return null;
  const aboutNotes = /(메모|저장한|저장해\s*둔|던진|던져\s*둔|적어\s*둔|기록)/.test(t);
  // 톡비서 정체성 질문 ("너 이름이 뭐니?", "너 누구야", "톡비서가 뭐야", "너 뭐 할 수 있어?")
  if (!aboutNotes && t.length <= 40 && /((^|\s)(너|넌|니|당신|톡비서)\s*(는|은|가|의|이)?\s*(이름|누구|정체|뭐\s*하는|뭘\s*할|뭐\s*할\s*수|무엇|몇\s*살|나이|어디서|만든|만들었)|^(이름|정체)\s*(이|은|가)?\s*(뭐|머)|자기\s*소개|톡비서(가|는|란)\s*(뭐|머|무엇))/i.test(t)) return "self";
  // 웹검색: 실시간 정보를 '물어보거나 찾아달라고' 할 때만 ("오늘 날씨 추움" 같은 기록은 통과)
  const liveTopic = /(날씨|뉴스|주가|주식\s*시세|환율|실시간|인터넷|구글|네이버)/.test(t);
  const asking = /([?？]\s*$|어때|어떄|알려|검색|찾아|봐\s*줘|몇\s*도|어떻게\s*돼|나와|궁금)/.test(t);
  if (!aboutNotes && ((liveTopic && asking) || /(검색해|찾아봐\s*줘|구글링)/.test(t))) return "web";
  if (/(표\s*(로|를)?\s*(만들|작성|그려|정리해)|글\s*(써|작성)|시\s*써|작사|소설|에세이|보고서\s*(써|작성)|번역해)/.test(t) && !aboutNotes) return "create";
  if (t.length <= 40 && /^(안녕|하이|hi|hello|ㅎㅇ|ㅋ+|ㅎ+|심심|뭐\s*해|누구(야|니|세요)|고마워|고맙|사랑해|잘\s*자|배고파|졸려|힘들|놀자|재밌는|농담)/i.test(t)) return "chat";
  // 일상 의문문 ("오늘 뭐 먹을까?", "심심한데 뭐하지?", "졸린데 어떡해?")
  if (!aboutNotes && t.length <= 40 && /(뭐\s*먹(을까|지)|뭐\s*하지|뭐\s*할까|어떡해|어떻게\s*해|심심|졸려|졸린|배고|피곤|우울|기분\s*(이|어때)|잘\s*지내|밥\s*먹었)/.test(t)) return "chat";
  // 호칭·역할놀이·장난 ("나한테 형이라고 해봐", "반말해봐", "노래해봐")
  if (t.length <= 40 && /((이)?라고\s*(해\s*봐|해\s*줘|불러)|반말\s*해|존댓말\s*해|(노래|랩|춤|성대모사|애교)\s*(해|좀)|너\s*(사람|로봇|ai)\s*(이)?(야|니|지))/i.test(t)) return "chat";
  return null;
}

/** 정리와 무관한 요청인지 (하위 호환). */
export function isChitchat(text: string): boolean {
  return offTopicKind(text) !== null;
}

export const OFFTOPIC_REPLY: Record<OffTopicKind, string> = {
  web: "저는 톡비서예요~ 🧹 실시간 웹검색은 서툴지만, 저장해주신 메모 검색·정리는 자신 있어요! 화면을 캡처하거나 링크로 툭 던져주시면 깔끔하게 보관해 드릴게요 📂",
  create: "저는 톡비서예요~ 🧹 표 작성이나 문서 창작은 서툴지만, 던져주신 메모 정리와 검색은 전문이에요! 📂",
  chat: "저는 톡비서예요~ 🧹 일상 잡담이나 역할놀이는 서툴지만, 저장해주신 메모 정리·검색·알림 수정은 자신 있어요! 뭐든 툭 던져 주세요 📂",
  self: "저는 초간편 AI 톡비서예요! 🧹 스크린샷·링크·메모를 툭 던져주시면 알아서 분류하고, 필요할 때 쏙쏙 찾아드리고, 중요한 날짜는 먼저 챙겨드려요 📂",
};

export const CHITCHAT_REPLY = OFFTOPIC_REPLY.chat;

export function offTopicReply(text: string): string {
  return OFFTOPIC_REPLY[offTopicKind(text) ?? "chat"];
}

export type NoteEdit = { remind_at?: string | null; category?: string; summary?: string; tags?: string[]; detected_date?: string | null };

/** 모델이 제안한 수정 사항을 안전한 컬럼 업데이트로 변환. */
export function sanitizeEdit(raw: unknown, currentTags: string[], allowedCategories: string[]): NoteEdit {
  const p = (raw && typeof raw === "object" ? raw : {}) as { remind_at?: unknown; detected_date?: unknown; category?: unknown; summary?: unknown; tags_add?: unknown; tags_remove?: unknown };
  const out: NoteEdit = {};
  if (p.remind_at === null) out.remind_at = null;
  else { const r = validIso(p.remind_at); if (r) out.remind_at = r; }
  if (typeof p.detected_date === "string" && validIso(p.detected_date)) out.detected_date = validIso(p.detected_date);
  if (typeof p.category === "string" && allowedCategories.includes(p.category)) out.category = p.category;
  if (typeof p.summary === "string" && p.summary.trim()) out.summary = p.summary.trim().slice(0, 80);
  const add = Array.isArray(p.tags_add) ? p.tags_add.filter((x): x is string => typeof x === "string") : [];
  const rm = Array.isArray(p.tags_remove) ? p.tags_remove.filter((x): x is string => typeof x === "string") : [];
  if (add.length || rm.length) {
    const clean = (s: string) => s.replace(/^#/, "").trim();
    const rmSet = new Set(rm.map(clean));
    out.tags = [...new Set([...currentTags.filter((t) => !rmSet.has(t)), ...add.map(clean).filter(Boolean)])].slice(0, 8);
  }
  return out;
}
