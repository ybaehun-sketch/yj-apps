export type Category = "idea" | "image" | "running" | "link" | "voice" | "todo" | "gear" | "memo";

export const CATEGORIES: Record<Category, { label: string; emoji: string; dot: string }> = {
  idea: { label: "아이디어", emoji: "💡", dot: "bg-cat-idea" },
  image: { label: "이미지/캡처", emoji: "📸", dot: "bg-cat-image" },
  running: { label: "운동/러닝화", emoji: "👟", dot: "bg-cat-running" },
  link: { label: "링크/아티클", emoji: "🔗", dot: "bg-cat-link" },
  voice: { label: "음성", emoji: "🎙️", dot: "bg-cat-voice" },
  todo: { label: "할 일", emoji: "📋", dot: "bg-cat-todo" },
  gear: { label: "운동 장비", emoji: "🏋️", dot: "bg-cat-gear" },
  memo: { label: "메모", emoji: "📝", dot: "bg-cat-memo" },
};

export const PLANS = [
  { id: "trial", name: "7일 무료 체험", price: "0원", note: "현재 이용 중", active: true },
  { id: "monthly", name: "월간 구독", price: "3,900원/월", note: "언제든 해지 가능" },
  { id: "yearly", name: "연간 구독", price: "39,000원/년", note: "2개월 무료 혜택" },
] as const;

export type Item = {
  id: string;
  createdAt: number;
  kind: "text" | "image" | "link" | "voice";
  text: string;
  imageUrl?: string | undefined;
  category: Category;
  summary: string;
  tags: string[];
};

export type Rule = { keyword: string; category: Category };

const KW: [Category, RegExp][] = [
  ["running", /러닝|런닝|운동화|조깅|마라톤|러닝화|신발/],
  ["todo", /해야|할 ?일|까지|예약|사기|구매|잊지|todo|마감/i],
  ["idea", /아이디어|기획|만들면|서비스|스타트업|앱|생각/],
];

export function findCategoryByLabel(label: string): Category | undefined {
  const l = label.replace(/[[\]\s]/g, "");
  return (Object.keys(CATEGORIES) as Category[]).find((c) => {
    const n = CATEGORIES[c].label.replace(/\s/g, "");
    return n === l || n.includes(l) || l.includes(n);
  });
}

export function parseRule(text: string): Rule | null {
  const m = text.match(/(?:앞으로\s*)?(.+?)\s*관련(?:은|된 건|은요)?\s*\[?(.+?)\]?\s*(?:으로|로)\s*분류/);
  if (!m) return null;
  const keyword = (m[1] ?? "").trim();
  const category = findCategoryByLabel(m[2] ?? "") ?? "gear";
  return { keyword, category };
}

export function classify(text: string, kind: Item["kind"], rules: Rule[]): Category {
  for (const r of rules) if (text.toLowerCase().includes(r.keyword.toLowerCase())) return r.category;
  if (kind === "voice") return "voice";
  if (kind === "link" || /https?:\/\//.test(text)) return "link";
  for (const [c, re] of KW) if (re.test(text)) return c;
  if (kind === "image") return "image";
  return "memo";
}

export function makeTags(text: string): string[] {
  const words = text
    .replace(/https?:\/\/\S+/g, "")
    .split(/[\s,.!?~]+/)
    .filter((w) => w.length >= 2 && !/^(그리고|이거|나중에|해야|하기)$/.test(w));
  return [...new Set(words)].slice(0, 3).map((w) => "#" + w.replace(/(을|를|이|가|은|는|에|로|으로)$/, ""));
}

export function summarize(text: string, kind: Item["kind"]): string {
  if (kind === "image" && !text) return "이미지 1장 보관 완료";
  if (kind === "voice") return "음성 메모 → " + (text.slice(0, 30) || "녹음 저장");
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 36 ? t.slice(0, 36) + "…" : t;
}

export function isSearch(text: string) {
  return /찾아|보여|검색|모아|뭐 있|목록/.test(text);
}

export function search(text: string, items: Item[]): Item[] {
  const cats = new Set<Category>();
  if (/러닝|운동화|신발/.test(text)) cats.add("running");
  if (/아이디어/.test(text)) cats.add("idea");
  if (/링크|아티클|식당|맛집/.test(text)) cats.add("link");
  if (/음성|녹음/.test(text)) cats.add("voice");
  if (/할 ?일|투두/.test(text)) cats.add("todo");
  if (/장비|나이키/.test(text)) cats.add("gear");
  const wantImage = /이미지|사진|캡처/.test(text);
  let res = items;
  if (cats.size) res = res.filter((i) => cats.has(i.category) || (cats.has("running") && /러닝|운동화/.test(i.text)));
  if (wantImage) res = res.filter((i) => i.kind === "image");
  if (!cats.size && !wantImage) {
    const kws = text.replace(/찾아줘|보여줘|검색|해줘|내가|저장한|지금까지|만/g, "").split(/\s+/).filter((w) => w.length > 1);
    res = items.filter((i) => kws.some((k) => (i.text + i.tags.join(" ")).includes(k)));
  }
  return res;
}
