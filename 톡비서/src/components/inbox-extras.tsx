import { QUOTA_BYTES, fmtBytes, trialDaysLeft, type Usage } from "@/lib/storage-quota";
import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Eye,
  FileText,
  Link2,
  Lock,
  Mic,
  Moon,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  StickyNote,
  Sun,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { CUSTOM_CATEGORY_LIMIT, NOTE_CATEGORIES, registerCustomCategories } from "@/lib/notes";
import { CUSTOM_ICON_CHOICES, CategoryIcon, CustomIcon } from "@/components/category-icon";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { t as tr, locale, useLang, setLang, LANGS, LANG_LABEL } from "@/lib/i18n";
import { downloadFile } from "@/lib/doc-text";

type Note = Tables<"notes">;
const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** 날짜별 요약용 종류 라벨 */
const KIND_SUMMARY = [
  { kind: "image", Icon: Camera, label: "스샷" },
  { kind: "link", Icon: Link2, label: "링크" },
  { kind: "text", Icon: StickyNote, label: "메모" },
  { kind: "voice", Icon: Mic, label: "음성" },
] as const;

const parseTagTokens = (raw: string, base: string[], max = 8) => {
  const added = raw.split(/[\s,]+/).map((s) => s.replace(/^#+/, "").trim()).filter(Boolean);
  return [...new Set([...base, ...added])].slice(0, max);
};

function TagChipsInput({
  tags,
  onTagsChange,
  input,
  onInputChange,
  placeholder,
  max = 8,
  inputClassName = "rounded-xl bg-muted px-3 py-1.5",
  textClassName = "py-0.5 text-xs",
}: {
  tags: string[];
  onTagsChange: (next: string[]) => void;
  input: string;
  onInputChange: (v: string) => void;
  placeholder: string;
  max?: number;
  inputClassName?: string;
  textClassName?: string;
}) {
  const commit = (raw: string) => {
    onTagsChange(parseTagTokens(raw, tags, max));
    onInputChange("");
  };
  return (
    <div>
      {tags.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
              #{t}
              <button type="button" aria-label={tr("삭제")} onClick={() => onTagsChange(tags.filter((x) => x !== t))} className="text-muted-foreground hover:text-destructive">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className={`flex items-center gap-1 ${inputClassName}`}>
        <span className="font-semibold text-muted-foreground">#</span>
        <input
          value={input}
          onChange={(e) => {
            const v = e.target.value;
            if (/[,\s]$/.test(v) && !(e.nativeEvent as InputEvent).isComposing) commit(v);
            else onInputChange(v.replace(/^#+/, ""));
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(input); }
            else if (e.key === "Backspace" && !input && tags.length > 0) onTagsChange(tags.slice(0, -1));
          }}
          placeholder={placeholder}
          className={`w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground ${textClassName}`}
        />
      </div>
    </div>
  );
}

export function NoteMetaEditor({
  initialCategory,
  initialTags,
  onSave,
  onCancel,
}: {
  initialCategory: string;
  initialTags: string[];
  onSave: (patch: { category: string; tags: string[] }) => void;
  onCancel: () => void;
}) {
  const customCats = useCustomCategories();
  const [category, setCategory] = useState(initialCategory);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const allCats = [...new Set([...NOTE_CATEGORIES, ...customCats.map((c) => c.name), initialCategory])];

  const saveEdit = () => {
    onSave({ category, tags: parseTagTokens(tagInput, tags) });
  };

  return (
    <div className="space-y-2.5 rounded-2xl bg-card p-3 text-xs text-foreground shadow-sm">
      <div>
        <p className="mb-1.5 font-semibold text-muted-foreground">{tr("카테고리")}</p>
        <div className="flex flex-wrap gap-1.5">
          {allCats.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${category === c ? "bg-primary font-semibold text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"}`}>
              <CategoryIcon name={c} className="size-3.5" /> {tr(c)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 font-semibold text-muted-foreground">{tr("키워드")}</p>
        <TagChipsInput
          tags={tags}
          onTagsChange={setTags}
          input={tagInput}
          onInputChange={setTagInput}
          placeholder={tr("띄어쓰기나 쉼표로 구분")}
        />
      </div>
      <div className="flex justify-end gap-1.5">
        <button type="button" onClick={onCancel} className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80">{tr("취소")}</button>
        <button type="button" onClick={saveEdit} className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground">{tr("저장")}</button>
      </div>
    </div>
  );
}

export function NotesCalendar({
  notes,
  urls = {},
  onUpdate,
  onDelete,
}: {
  notes: Note[];
  urls?: Record<string, string>;
  onUpdate?: (id: string, patch: { category: string; tags: string[] }) => void;
  onDelete?: (n: Note) => void;
}) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState<Date | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const byDay = useMemo(() => {
    const m: Record<string, Note[]> = {};
    notes.forEach((n) => { const k = keyOf(new Date(n.created_at)); (m[k] ??= []).push(n); });
    return m;
  }, [notes]);
  const start = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(start).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const todayKey = keyOf(new Date());
  const selNotes = sel ? byDay[keyOf(sel)] ?? [] : [];

  return (
    <div className="flex-1 overflow-y-auto bg-background px-3 py-4">
      <div className="mb-3 flex items-center justify-between">
        <button aria-label={tr("이전 달")} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full p-2 hover:bg-muted"><ChevronLeft className="size-4" /></button>
        <p className="text-sm font-bold text-foreground">{month.toLocaleDateString(locale(), { year: "numeric", month: "long" })}</p>
        <button aria-label={tr("다음 달")} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-full p-2 hover:bg-muted"><ChevronRight className="size-4" /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
        {Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i).toLocaleDateString(locale(), { weekday: "short" })).map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const list = byDay[keyOf(d)] ?? [];
          const cats = [...new Set(list.map((n) => n.category))].slice(0, 3);
          return (
            <button key={i} onClick={() => setSel(d)}
              className={`flex aspect-square flex-col items-center justify-start rounded-xl pt-1.5 text-xs transition-colors hover:bg-muted ${keyOf(d) === todayKey ? "bg-primary/30 font-bold" : "bg-card"} text-foreground`}>
              {d.getDate()}
              {list.length > 0 && (
                <span className="mt-0.5 flex flex-col items-center leading-none">
                  <span className="flex items-center gap-0.5 text-muted-foreground">
                    {cats.map((c) => <CategoryIcon key={c} name={c} className="size-2.5" />)}
                  </span>
                  <span className="mt-0.5 rounded-full bg-primary px-1 text-[0.65rem] font-semibold text-primary-foreground">{list.length}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      {sel && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/30" onClick={() => setSel(null)}>
          <div className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-4 animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-bold text-foreground">{tr("{0}에 던진 것", sel.toLocaleDateString(locale(), { month: "long", day: "numeric" }))}</p>
              <button aria-label={tr("닫기")} onClick={() => setSel(null)} className="rounded-full p-1.5 hover:bg-muted"><X className="size-4" /></button>
            </div>
            {selNotes.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{tr("이 날은 던진 게 없어요")}</p> : (
              <>
                <ul className="space-y-1.5">
                  {KIND_SUMMARY.filter((k) => selNotes.some((n) => n.kind === k.kind)).map((k) => (
                    <li key={k.kind} className="flex items-center gap-2 rounded-2xl bg-muted/60 px-3 py-2.5">
                      <k.Icon className="size-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{tr(k.label)}</span>
                      <span className="ml-auto rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">{tr("{0}건", selNotes.filter((n) => n.kind === k.kind).length)}</span>
                    </li>
                  ))}
                </ul>
                <ul className="mt-3 space-y-2">
                  {selNotes.map((n) => {
                    const isViewing = viewId === n.id;
                    const isEditing = editId === n.id;
                    const isDeleting = delId === n.id;
                    const imgUrl = n.image_path ? urls[n.image_path] : undefined;
                    const audUrl = n.audio_path ? urls[n.audio_path] : undefined;
                    const docUrl = n.file_path ? urls[n.file_path] : undefined;
                    return (
                      <li key={n.id} className="rounded-2xl border border-border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                            <CategoryIcon name={n.category} className="size-3" /> {tr(n.category)}
                          </span>
                          <div className="flex items-center gap-1">
                            <button type="button" aria-label={tr("보기")}
                              onClick={() => { setViewId(isViewing ? null : n.id); setEditId(null); setDelId(null); }}
                              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${isViewing ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                              <Eye className="size-3.5" />{tr("보기")}
                            </button>
                            {onUpdate && (
                              <button type="button" aria-label={tr("수정")}
                                onClick={() => { setEditId(isEditing ? null : n.id); setViewId(null); setDelId(null); }}
                                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${isEditing ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                                <Pencil className="size-3.5" />{tr("수정")}
                              </button>
                            )}
                            {onDelete && (
                              <button type="button" aria-label={tr("삭제")}
                                onClick={() => { setDelId(isDeleting ? null : n.id); setViewId(null); setEditId(null); }}
                                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${isDeleting ? "bg-destructive text-primary-foreground" : "bg-muted text-muted-foreground hover:text-destructive"}`}>
                                <Trash2 className="size-3.5" />{tr("삭제")}
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-1.5 text-sm text-foreground">{n.summary}</p>
                        {n.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">{n.tags.map((t) => <span key={t} className="text-xs text-muted-foreground">#{t}</span>)}</div>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleTimeString(locale(), { hour: "numeric", minute: "2-digit" })}</p>
                        {isViewing && (
                          <div className="mt-2.5 space-y-2 rounded-xl bg-muted/60 p-2.5 text-xs text-foreground">
                            <p className="font-semibold text-muted-foreground">{tr("원본")}</p>
                            {imgUrl && <img src={imgUrl} alt={tr("원본")} className="h-auto max-h-60 w-auto max-w-full rounded-xl object-contain" />}
                            {audUrl && <audio controls preload="none" src={audUrl} className="h-9 w-full" />}
                            {n.link_url && (
                              <a href={n.link_url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate font-medium text-primary underline">
                                <Link2 className="size-3.5 shrink-0" />
                                <span className="truncate">{n.link_title ?? n.link_url}</span>
                              </a>
                            )}
                            {docUrl && (
                              <button type="button" onClick={() => void downloadFile(docUrl, n.file_name)} className="inline-flex items-center gap-1 font-semibold text-primary underline">
                                <Download className="size-3.5 shrink-0" /> {n.file_name ?? tr("원본 받기")}
                              </button>
                            )}
                            {n.content && <p className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed">{n.content}</p>}
                          </div>
                        )}
                        {isEditing && onUpdate && (
                          <div className="mt-2.5">
                            <NoteMetaEditor
                              initialCategory={n.category}
                              initialTags={n.tags}
                              onSave={(patch) => { onUpdate(n.id, patch); setEditId(null); }}
                              onCancel={() => setEditId(null)}
                            />
                          </div>
                        )}
                        {isDeleting && onDelete && (
                          <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs">
                            <span className="font-medium text-destructive">{tr("삭제할까요?")}</span>
                            <div className="flex gap-1.5">
                              <button type="button" onClick={() => setDelId(null)} className="rounded-full bg-card px-2.5 py-1 font-medium text-muted-foreground">{tr("취소")}</button>
                              <button type="button" onClick={() => { onDelete(n); setDelId(null); }} className="rounded-full bg-destructive px-2.5 py-1 font-semibold text-primary-foreground">{tr("삭제")}</button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
      <SummaryCard title={tr("{0}에 던진 것", month.toLocaleDateString(locale(), { month: "long" }))} notes={notes.filter((n) => { const d = new Date(n.created_at); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth(); })} />
      <SummaryCard title={tr("지금까지 던진 것")} notes={notes} />
    </div>
  );
}

const FORMS = [
  { key: "image", Icon: Camera, label: "스샷" },
  { key: "doc", Icon: FileText, label: "문서" },
  { key: "link", Icon: Link2, label: "링크" },
  { key: "text", Icon: StickyNote, label: "메모" },
  { key: "voice", Icon: Mic, label: "음성" },
] as const;
const formOf = (n: Note) => (n.file_name ? "doc" : n.kind);

function SummaryCard({ title, notes }: { title: string; notes: Note[] }) {
  const customCats = useCustomCategories();
  const [showAll, setShowAll] = useState(false);
  const cats = [...new Set([...NOTE_CATEGORIES, ...customCats.map((c) => c.name), ...notes.map((x) => x.category)])]
    .map((c) => ({ c, n: notes.filter((x) => x.category === c).length }))
    .sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...cats.map((x) => x.n));
  const shownCats = showAll || cats.length <= 8 ? cats : cats.slice(0, 8);
  return (
    <section className="mt-4 rounded-3xl bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">{tr("총 {0}건", notes.length)}</span>
      </div>
      {notes.length === 0 ? <p className="py-3 text-center text-sm text-muted-foreground">{tr("아직 던진 게 없어요")}</p> : (
        <>
          <div className="grid grid-cols-5 gap-1.5">
            {FORMS.map((f) => {
              const c = notes.filter((n) => formOf(n) === f.key).length;
              return (
                <div key={f.key} className={`flex flex-col items-center rounded-2xl bg-muted/60 py-2 ${c ? "" : "opacity-40"}`}>
                  <f.Icon className="mb-1 size-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{tr(f.label)}</span>
                  <span className="text-sm font-bold text-foreground">{c}</span>
                </div>
              );
            })}
          </div>
          <ul className="mt-3 space-y-1.5">
            {shownCats.map((x) => (
              <li key={x.c} className={`flex items-center gap-2 text-xs ${x.n === 0 ? "opacity-45" : ""}`}>
                <span className="inline-flex w-24 shrink-0 items-center gap-1.5 truncate text-foreground">
                  <CategoryIcon name={x.c} className="size-3.5 text-muted-foreground" />
                  <span className="truncate">{tr(x.c)}</span>
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${(x.n / max) * 100}%` }} /></span>
                <span className="w-8 text-right font-semibold text-foreground">{tr("{0}건", x.n)}</span>
              </li>
            ))}
          </ul>
          {cats.length > 8 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2.5 w-full rounded-xl bg-muted/60 py-1.5 text-center text-xs font-medium text-muted-foreground hover:bg-muted">
              {showAll ? tr("접기 ▲") : tr("카테고리 {0}개 모두 보기 ▼", cats.length)}
            </button>
          )}
        </>
      )}
    </section>
  );
}

export type Plan = "free" | "premium" | "lifetime";
export const PLAN_LABEL: Record<Plan, string> = { free: "무료 사용자", premium: "프리미엄", lifetime: "평생 소장" };
export const PLAN_META: Record<Plan, { Icon: typeof Crown; badge: string; perks: string[] }> = {
  free: { Icon: Sparkles, badge: "border border-border bg-background text-muted-foreground", perks: ["하루 AI 자동 정리 20회", "기본 카테고리 8개", "7일 무료 체험 · 보관함 100MB"] },
  premium: { Icon: Crown, badge: "border border-primary bg-primary/20 text-foreground", perks: ["하루 AI 자동 정리 50회 (공정 사용)", "스샷·문서 정밀 분석", "나만의 카테고리 10개", "선제적 일정 알림", "보관함 20GB · 원본 파일 보관"] },
  lifetime: { Icon: Crown, badge: "border border-primary bg-primary/20 text-foreground", perks: ["하루 AI 자동 정리 50회 (공정 사용)", "스샷·문서 정밀 분석", "나만의 카테고리 10개", "선제적 일정 알림", "보관함 20GB · 원본 파일 보관"] },
};

export function PlanBadge({ plan, size = "sm" }: { plan: Plan; size?: "sm" | "md" }) {
  const m = PLAN_META[plan];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${m.badge} ${size === "sm" ? "px-2 py-0.5 text-[0.7rem]" : "px-2.5 py-1 text-xs"}`}>
      <m.Icon className="size-3 shrink-0" aria-hidden="true" />{tr(PLAN_LABEL[plan])}
    </span>
  );
}
const COMPARE: { label: string; v: [string, string] }[] = [
  { label: "가격", v: ["7일 무료", "월 4,900원"] },
  { label: "AI 자동 정리", v: ["하루 20회", "하루 50회*"] },
  { label: "카테고리", v: ["기본 8개", "+ 나만의 10개"] },
  { label: "보관함", v: ["100MB", "20GB"] },
  { label: "원본 파일 받기", v: ["—", "✓"] },
  { label: "일정 미리 알림", v: ["—", "✓"] },
  { label: "이용 기간", v: ["가입 후 7일", "구독 중"] },
];

export function PlanCompare({ current }: { current?: Plan }) {
  const plans: Plan[] = ["free", "premium"];
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-[1fr_repeat(2,minmax(0,1fr))] bg-muted text-center text-xs font-bold text-foreground">
        <span className="py-2" />
        {plans.map((p) => {
          const PIcon = PLAN_META[p].Icon;
          return (
            <span key={p} className={`inline-flex items-center justify-center gap-1 py-2 ${current === p ? "bg-primary text-primary-foreground" : ""}`}>
              <PIcon className="size-3.5" />{tr(PLAN_LABEL[p].replace(" 사용자", ""))}
            </span>
          );
        })}
      </div>
      {COMPARE.map((r) => (
        <div key={r.label} className="grid grid-cols-[1fr_repeat(2,minmax(0,1fr))] border-t border-border text-center text-xs">
          <span className="py-2 pl-2 text-left font-semibold text-muted-foreground">{tr(r.label)}</span>
          {r.v.map((v, i) => <span key={i} className="whitespace-pre-line py-2 text-foreground">{tr(v)}</span>)}
        </div>
      ))}
      <p className="border-t border-border px-2 py-1.5 text-[0.7rem] text-muted-foreground">{tr("* 공정 사용 기준 (하루 최대 50회)")}</p>
    </div>
  );
}

type UserCat = { id: string; name: string; emoji: string; hint: string };
export function useCustomCategories() {
  const q = useQuery({
    queryKey: ["user_categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_categories").select("id, name, emoji, hint").order("created_at");
      if (error) throw error;
      return data as UserCat[];
    },
  });
  registerCustomCategories(q.data ?? []);
  return q.data ?? [];
}

function CustomCategories({ plan, onUpgrade }: { plan: Plan; onUpgrade: () => void }) {
  const cats = useCustomCategories();
  const qc = useQueryClient();
  const limit = CUSTOM_CATEGORY_LIMIT[plan];
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("book");
  const [hintTags, setHintTags] = useState<string[]>([]);
  const [hintInput, setHintInput] = useState("");
  const [err, setErr] = useState("");
  const add = async () => {
    const n = name.trim();
    if (!n) return;
    if ((NOTE_CATEGORIES as readonly string[]).includes(n) || cats.some((c) => c.name === n)) { setErr(tr("이미 있는 카테고리예요")); return; }
    if (cats.length >= limit) { setErr(tr("최대 {0}개까지 만들 수 있어요", limit)); return; }
    const finalTags = parseTagTokens(hintInput, hintTags, 10);
    const hintStr = finalTags.map((t) => `#${t}`).join(" ").slice(0, 80);
    const { error } = await supabase.from("user_categories").insert({ name: n.slice(0, 12), emoji, hint: hintStr });
    if (error) { setErr(tr("추가하지 못했어요")); return; }
    setName(""); setHintTags([]); setHintInput(""); setErr("");
    qc.invalidateQueries({ queryKey: ["user_categories"] });
  };
  const remove = async (id: string) => {
    await supabase.from("user_categories").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["user_categories"] });
  };
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {NOTE_CATEGORIES.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            <CategoryIcon name={c} className="size-3" /> {tr(c)}
          </span>
        ))}
      </div>
      {limit === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border p-3 text-center">
          <p className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-foreground">
            <Lock className="size-4 text-muted-foreground" />
            {tr("나만의 카테고리는 프리미엄 혜택이에요")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{tr("학습 · 사업 · 육아 처럼 만들면 AI가 알아서 그 칸으로 분류해요")}</p>
        </div>
      ) : (
        <>
          <p className="mt-3 text-xs font-semibold text-foreground">{tr("나만의 카테고리")} <span className="text-muted-foreground">{cats.length}/{limit}</span></p>
          <ul className="mt-1.5 space-y-1.5">
            {cats.map((c) => (
              <li key={c.id} className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
                <CustomIcon iconKey={c.emoji} className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-foreground">{c.name}</p>{c.hint && <p className="truncate text-xs text-muted-foreground">{c.hint}</p>}</div>
                <button aria-label={tr("{0} 삭제", c.name)} onClick={() => remove(c.id)} className="rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
              </li>
            ))}
          </ul>
          {cats.length < limit && (
            <div className="mt-2.5 space-y-2 rounded-xl border border-border p-3">
              <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
                {CUSTOM_ICON_CHOICES.map(({ key, Icon }) => (
                  <button key={key} type="button" onClick={() => setEmoji(key)}
                    className={`flex h-9 w-full items-center justify-center rounded-lg text-foreground transition-colors ${emoji === key ? "bg-primary/30 ring-1 ring-foreground" : "bg-muted/60 hover:bg-muted"}`}>
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={12} placeholder={tr("이름 (예: 학습)")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none" />
              <TagChipsInput
                tags={hintTags}
                onTagsChange={setHintTags}
                input={hintInput}
                onInputChange={setHintInput}
                placeholder={tr("AI 힌트 (선택) 단어 입력 후 스페이스")}
                max={10}
                inputClassName="rounded-lg border border-border bg-background px-3 py-2"
                textClassName="text-sm"
              />
              {err && <p className="text-xs text-destructive">{err}</p>}
              <button onClick={add} disabled={!name.trim()} className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                <Plus className="size-4" />{tr("카테고리 추가")}
              </button>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{tr("다음에 던지는 것부터 AI가 이 카테고리로도 분류해요")}</p>
        </>
      )}
    </>
  );
}

export type Prefs = { alarm: boolean; mode: "light" | "dark"; accent: "yellow" | "mint" | "pink" | "sky"; plan: Plan };
const DEFAULT: Prefs = { alarm: true, mode: "light", accent: "yellow", plan: "free" };

const PAY_PLANS = [
  { key: "monthly", plan: "premium" as Plan, name: "월간 구독", price: "4,900원", unit: "/월" },
];
const METHODS = ["카카오페이", "토스페이", "신용/체크카드"];

function PaymentModal({ onClose, onPaid }: { onClose: () => void; onPaid: (p: Plan) => void }) {
  const [sel, setSel] = useState("monthly");
  const [method, setMethod] = useState(METHODS[0]);
  const [step, setStep] = useState<"form" | "paying" | "done">("form");
  const chosen = PAY_PLANS.find((p) => p.key === sel)!;
  const pay = () => { setStep("paying"); setTimeout(() => { setStep("done"); onPaid(chosen.plan); }, 1400); };
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-foreground/40" onClick={onClose}>
      <div className="max-h-[90%] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold text-foreground">{tr("결제하기")} <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[0.7rem] text-muted-foreground">{tr("테스트")}</span></p>
          <button aria-label={tr("닫기")} onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"><X className="size-4" /></button>
        </div>
        {step === "done" ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <p className="mt-2 font-bold text-foreground">{tr("결제 완료!")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tr("{0}이(가) 적용되었어요.", tr(chosen.name))}</p>
            <button onClick={onClose} className="mt-5 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">{tr("확인")}</button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {PAY_PLANS.map((p) => (
                <button key={p.key} onClick={() => setSel(p.key)} className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left ${sel === p.key ? "border-primary bg-primary/15" : "border-border"}`}>
                  <span className="text-sm font-semibold text-foreground">{tr(p.name)}</span>
                  <span className="text-sm text-foreground"><b>{tr(p.price)}</b><span className="text-xs text-muted-foreground">{tr(p.unit)}</span></span>
                </button>
              ))}
            </div>
            <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-foreground">{tr("플랜별 차이 보기")}</summary><div className="mt-2"><PlanCompare /></div></details>
            <p className="mb-2 mt-4 text-xs font-semibold text-muted-foreground">{tr("결제 수단")}</p>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`rounded-xl border px-1 py-2 text-xs text-foreground ${method === m ? "border-foreground font-semibold" : "border-border"}`}>{tr(m)}</button>
              ))}
            </div>
            <button disabled={step === "paying"} onClick={pay} className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
              {step === "paying" ? tr("결제 진행 중...") : tr("{0} 결제하기", tr(chosen.price))}
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">{tr("목업 결제창이에요. 실제로 돈이 나가지 않아요.")}</p>
          </>
        )}
      </div>
    </div>
  );
}
export function applyPrefs(p: Prefs) {
  document.documentElement.classList.toggle("dark", p.mode === "dark");
  document.documentElement.dataset["accent"] = p.accent;
}
export function usePrefs() {
  const [p, setP] = useState<Prefs>(DEFAULT);
  useEffect(() => { try { const s = localStorage.getItem("jungbi-prefs"); if (s) setP({ ...DEFAULT, ...JSON.parse(s) }); } catch { /* ignore */ } }, []);
  useEffect(() => { applyPrefs(p); localStorage.setItem("jungbi-prefs", JSON.stringify(p)); }, [p]);
  return [p, setP] as const;
}

const ACCENTS = [
  { key: "yellow", label: "카카오 옐로우", cls: "bg-[oklch(0.9_0.17_100)]" },
  { key: "mint", label: "민트", cls: "bg-[oklch(0.82_0.12_170)]" },
  { key: "pink", label: "핑크", cls: "bg-[oklch(0.82_0.11_0)]" },
  { key: "sky", label: "스카이", cls: "bg-[oklch(0.8_0.11_235)]" },
] as const;

const PRIVACY_URL = "https://yjstudio.app/tokbiseo#privacy";
const TERMS_URL = "https://yjstudio.app/tokbiseo#terms";
/** 1차 스토어 심사용 결제 모달 비활성화 (2차 구글 인앱 결제 연동 시 true로 전환). */
const BILLING_ENABLED = false;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl bg-card p-4 shadow-sm"><p className="mb-2 text-xs font-semibold text-muted-foreground">{title}</p>{children}</section>;
}

function LangPicker() {
  const cur = useLang();
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {LANGS.map((l) => (
          <button key={l} onClick={() => setLang(l)} className={`rounded-xl border py-2 text-xs text-foreground ${cur === l ? "border-foreground font-semibold" : "border-border"}`}>{LANG_LABEL[l]}</button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{tr("AI 답변과 음성 입력도 이 언어로 바뀌어요")}</p>
    </>
  );
}

export function SettingsSheet({ usage, email, joinedAt, prefs, setPrefs, onLogout, onDeleteAccount, onClose }: {
  usage?: Usage | undefined; email: string; joinedAt: string | null; prefs: Prefs; setPrefs: (p: Prefs) => void; onLogout: () => void; onDeleteAccount: () => Promise<void>; onClose: () => void;
}) {
  const [tab, setTab] = useState<"plan" | "organize" | "display">("plan");
  const [quitting, setQuitting] = useState(false);
  const [quitText, setQuitText] = useState("");
  const [quitBusy, setQuitBusy] = useState(false);
  const [quitErr, setQuitErr] = useState("");
  const [paying, setPaying] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-foreground/30" onClick={onClose}>
      <div className="relative flex h-full w-full max-w-md flex-col bg-background animate-in slide-in-from-right" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-3">
          <button aria-label={tr("뒤로")} onClick={onClose} className="rounded-full p-2 hover:bg-muted"><ChevronLeft className="size-5" /></button>
          <h2 className="font-bold text-foreground">{tr("설정")}</h2>
        </header>
        <div className="grid grid-cols-3 gap-1 border-b border-border bg-card px-3 py-2">
          {([
            { k: "plan", Icon: Crown, label: tr("구독·보관함") },
            { k: "organize", Icon: Tag, label: tr("정리·알림") },
            { k: "display", Icon: Settings, label: tr("화면·계정") },
          ] as const).map((t) => (
            <button key={t.k} type="button" onClick={() => setTab(t.k)}
              className={`inline-flex items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-semibold transition-colors ${tab === t.k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}>
              <t.Icon className="size-3.5 shrink-0" />
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {tab === "plan" && (
            <>
              <Section title={tr("결제 정보")}>
                <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                  {(() => {
                    const PlanIcon = PLAN_META[prefs.plan].Icon;
                    return (
                      <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground">
                        <PlanIcon className="size-5" />
                      </span>
                    );
                  })()}
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{tr("현재 플랜")}</p>
                    <p className="text-base font-bold text-foreground">{tr(PLAN_LABEL[prefs.plan])}</p>
                  </div>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[0.7rem] font-semibold text-foreground">{tr("이용 중")}</span>
                </div>
                <ul className="mt-2.5 space-y-1">
                  {PLAN_META[prefs.plan].perks.map((p) => <li key={p} className="text-xs text-foreground">✓ {tr(p)}</li>)}
                </ul>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-foreground">{tr("플랜별 혜택 한눈에 비교")}</summary>
                  <div className="mt-2"><PlanCompare current={prefs.plan} /></div>
                </details>
                {BILLING_ENABLED && prefs.plan === "free" && (
                  <button onClick={() => setPaying(true)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground">
                    <Crown className="size-4" />{tr("프리미엄으로 업그레이드")}
                  </button>
                )}
                {BILLING_ENABLED && prefs.plan !== "free" && <button onClick={() => setPrefs({ ...prefs, plan: "free" })} className="mt-2 w-full text-xs text-muted-foreground underline">{tr("무료로 되돌리기 (테스트)")}</button>}
              </Section>
              <Section title={tr("내 보관함")}>
                {(() => {
                  const u = usage ?? { image: 0, doc: 0, voice: 0, total: 0 };
                  const cap = QUOTA_BYTES[prefs.plan];
                  const pct = (b: number) => `${Math.min(100, (b / cap) * 100)}%`;
                  const left = trialDaysLeft(joinedAt);
                  return (
                    <>
                      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div className="bg-primary" style={{ width: pct(u.image) }} />
                        <div className="bg-accent-foreground/60" style={{ width: pct(u.doc) }} />
                        <div className="bg-destructive/70" style={{ width: pct(u.voice) }} />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">{tr("{0} / {1} 사용 중", fmtBytes(u.total), fmtBytes(cap))} <span className="text-xs font-normal text-muted-foreground">({((u.total / cap) * 100).toFixed(1)}%)</span></p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-primary" />{tr("스샷")} {fmtBytes(u.image)}</span>
                        <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-accent-foreground/60" />{tr("문서")} {fmtBytes(u.doc)}</span>
                        <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-destructive/70" />{tr("음성")} {fmtBytes(u.voice)}</span>
                      </div>
                      {prefs.plan === "free" && <p className="mt-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-foreground">{left > 0 ? tr("무료 체험 {0}일 남았어요 (7일 · 100MB)", left) : tr("무료 체험 7일이 끝났어요. 업그레이드하면 계속 보관할 수 있어요")}</p>}
                      <p className="mt-1.5 text-xs text-muted-foreground">{prefs.plan === "free" ? tr("파일 1개당 최대 20MB (프리미엄 50MB)") : tr("파일 1개당 최대 50MB")}</p>
                    </>
                  );
                })()}
              </Section>
            </>
          )}
          {tab === "organize" && (
            <>
              <Section title={tr("카테고리 관리")}>
                <CustomCategories plan={prefs.plan} onUpgrade={() => setPaying(true)} />
              </Section>
              <Section title={tr("알림")}>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{tr("일정 미리 챙겨주기 알림")}</span>
                  <button role="switch" aria-checked={prefs.alarm} onClick={() => setPrefs({ ...prefs, alarm: !prefs.alarm })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${prefs.alarm ? "bg-primary" : "bg-muted"}`}>
                    <span className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-all ${prefs.alarm ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </label>
              </Section>
            </>
          )}
          {tab === "display" && (
            <>
              <Section title={tr("내 가입 정보")}>
                <p className="text-sm font-medium text-foreground">{email}</p>
                {joinedAt && <p className="mt-0.5 text-xs text-muted-foreground">{tr("가입일 {0}", new Date(joinedAt).toLocaleDateString(locale()))}</p>}
                <button onClick={onLogout} className="mt-3 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">{tr("로그아웃")}</button>
              </Section>
              <Section title={tr("언어")}>
                <LangPicker />
              </Section>
              <Section title={tr("앱 테마")}>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  {(["light", "dark"] as const).map((m) => (
                    <button key={m} onClick={() => setPrefs({ ...prefs, mode: m })}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border py-2 text-sm text-foreground ${prefs.mode === m ? "border-foreground font-semibold" : "border-border"}`}>
                      {m === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                      {m === "light" ? tr("라이트") : tr("다크")}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  {ACCENTS.map((a) => (
                    <button key={a.key} onClick={() => setPrefs({ ...prefs, accent: a.key })} className="flex flex-col items-center gap-1">
                      <span className={`size-9 rounded-full ${a.cls} ${prefs.accent === a.key ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : ""}`} />
                      <span className="text-xs text-muted-foreground">{tr(a.label)}</span>
                    </button>
                  ))}
                </div>
              </Section>
              <div className="space-y-1 pt-2 text-center">
                <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                  <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="underline">{tr("개인정보처리방침")}</a>
                  <a href={TERMS_URL} target="_blank" rel="noreferrer" className="underline">{tr("이용약관")}</a>
                </div>
                <p className="text-xs text-muted-foreground">{tr("톡비서 웹 버전 v1.0.0")}</p>
                <button onClick={() => setQuitting(true)} className="pt-2 text-xs text-muted-foreground underline">{tr("회원탈퇴")}</button>
              </div>
            </>
          )}
        </div>
        {BILLING_ENABLED && paying && <PaymentModal onClose={() => setPaying(false)} onPaid={(plan) => setPrefs({ ...prefs, plan })} />}
        {quitting && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/30 p-4" onClick={() => !quitBusy && setQuitting(false)}>
            <div className="w-full max-w-sm rounded-2xl bg-card p-4" onClick={(e) => e.stopPropagation()}>
              <p className="text-base font-bold text-foreground">{tr("정말 떠나시나요?")}</p>
              <p className="mt-2 text-xs text-muted-foreground">{tr("탈퇴하면 저장된 메모, 캘린더 기록, 대화, 나만의 카테고리, 올린 파일이 모두 바로 지워지고 되돌릴 수 없어요.")}</p>
              <p className="mt-3 text-xs text-foreground">계속하려면 <b>{tr("회원탈퇴")}</b>라고 입력해 주세요.</p>
              <input value={quitText} onChange={(e) => setQuitText(e.target.value)} placeholder={tr("회원탈퇴")} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none" />
              {quitErr && <p className="mt-1.5 text-xs text-destructive">{quitErr}</p>}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button disabled={quitBusy} onClick={() => { setQuitting(false); setQuitText(""); }} className="rounded-xl bg-muted py-2 text-sm text-foreground">{tr("취소")}</button>
                <button disabled={quitText.trim() !== tr("회원탈퇴") || quitBusy}
                  onClick={async () => { setQuitBusy(true); setQuitErr(""); try { await onDeleteAccount(); } catch { setQuitErr(tr("탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요")); setQuitBusy(false); } }}
                  className="rounded-xl bg-destructive py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-40">{quitBusy ? tr("지우는 중…") : tr("탈퇴하기")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
