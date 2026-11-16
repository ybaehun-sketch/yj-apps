import { QUOTA_BYTES, fmtBytes, trialDaysLeft, type Usage } from "@/lib/storage-quota";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { CUSTOM_CATEGORY_LIMIT, NOTE_CATEGORIES, catEmoji, registerCustomCategories } from "@/lib/notes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { t as tr, locale, useLang, setLang, LANGS, LANG_LABEL } from "@/lib/i18n";

type Note = Tables<"notes">;
const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** 날짜별 요약용 종류 라벨 (이모지 + 이름) */
const KIND_SUMMARY = [
  { kind: "image", emoji: "📸", label: "스샷" },
  { kind: "link", emoji: "🔗", label: "링크" },
  { kind: "text", emoji: "📝", label: "메모" },
  { kind: "voice", emoji: "🎙️", label: "음성" },
] as const;

export function NotesCalendar({ notes }: { notes: Note[] }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState<Date | null>(null);
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
      <div className="grid grid-cols-7 text-center text-[11px] text-muted-foreground">
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
                  <span className="text-[11px]">{cats.map((c) => catEmoji(c)).join("")}</span>
                  <span className="mt-0.5 rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">{list.length}</span>
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
            {selNotes.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{tr("이 날은 던진 게 없어요 🍃")}</p> : (
              <>
                <ul className="space-y-1.5">
                  {KIND_SUMMARY.filter((k) => selNotes.some((n) => n.kind === k.kind)).map((k) => (
                    <li key={k.kind} className="flex items-center gap-2 rounded-2xl bg-muted/60 px-3 py-2.5">
                      <span className="text-lg">{k.emoji}</span>
                      <span className="text-sm font-semibold text-foreground">{tr(k.label)}</span>
                      <span className="ml-auto rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">{tr("{0}건", selNotes.filter((n) => n.kind === k.kind).length)}</span>
                    </li>
                  ))}
                </ul>
                <ul className="mt-3 space-y-2">
                  {selNotes.map((n) => (
                    <li key={n.id} className="rounded-2xl border border-border p-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{catEmoji(n.category)} {tr(n.category)}</span>
                      <p className="mt-1.5 text-sm text-foreground">{n.summary}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleTimeString(locale(), { hour: "numeric", minute: "2-digit" })}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
      <SummaryCard title={tr("📅 {0}에 던진 것", month.toLocaleDateString(locale(), { month: "long" }))} notes={notes.filter((n) => { const d = new Date(n.created_at); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth(); })} />
      <SummaryCard title={tr("🗂️ 지금까지 던진 것")} notes={notes} />
    </div>
  );
}

const FORMS = [
  { key: "image", emoji: "📸", label: "스샷" },
  { key: "doc", emoji: "📄", label: "문서" },
  { key: "link", emoji: "🔗", label: "링크" },
  { key: "text", emoji: "📝", label: "메모" },
  { key: "voice", emoji: "🎙️", label: "음성" },
] as const;
const formOf = (n: Note) => (n.file_name ? "doc" : n.kind);

function SummaryCard({ title, notes }: { title: string; notes: Note[] }) {
  const cats = [...new Set([...NOTE_CATEGORIES, ...notes.map((x) => x.category)])]
    .map((c) => ({ c, e: catEmoji(c), n: notes.filter((x) => x.category === c).length }))
    .filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...cats.map((x) => x.n));
  return (
    <section className="mt-4 rounded-3xl bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">{tr("총 {0}건", notes.length)}</span>
      </div>
      {notes.length === 0 ? <p className="py-3 text-center text-sm text-muted-foreground">{tr("아직 던진 게 없어요 🍃")}</p> : (
        <>
          <div className="grid grid-cols-5 gap-1.5">
            {FORMS.map((f) => {
              const c = notes.filter((n) => formOf(n) === f.key).length;
              return (
                <div key={f.key} className={`flex flex-col items-center rounded-2xl bg-muted/60 py-2 ${c ? "" : "opacity-40"}`}>
                  <span className="text-lg">{f.emoji}</span>
                  <span className="text-[11px] text-muted-foreground">{tr(f.label)}</span>
                  <span className="text-sm font-bold text-foreground">{c}</span>
                </div>
              );
            })}
          </div>
          <ul className="mt-3 space-y-1.5">
            {cats.map((x) => (
              <li key={x.c} className="flex items-center gap-2 text-xs">
                <span className="w-16 shrink-0 text-foreground">{x.e} {tr(x.c)}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${(x.n / max) * 100}%` }} /></span>
                <span className="w-8 text-right font-semibold text-foreground">{tr("{0}건", x.n)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export type Plan = "free" | "premium" | "lifetime";
export const PLAN_LABEL: Record<Plan, string> = { free: "무료 사용자", premium: "프리미엄", lifetime: "평생 소장" };
export const PLAN_META: Record<Plan, { icon: string; badge: string; perks: string[] }> = {
  free: { icon: "🌱", badge: "border border-border bg-background text-muted-foreground", perks: ["하루 AI 자동 정리 20회", "기본 카테고리 7개", "7일 무료 체험 · 보관함 100MB"] },
  premium: { icon: "⭐", badge: "border border-primary bg-primary/20 text-foreground", perks: ["AI 정리 무제한 (공정 사용)", "스샷·문서 정밀 분석", "나만의 카테고리 10개", "선제적 일정 알림", "보관함 10GB · 원본 파일 보관"] },
  lifetime: { icon: "👑", badge: "border-2 border-foreground bg-primary text-primary-foreground shadow-sm", perks: ["프리미엄 기능 평생 이용", "한 번 결제, 추가 비용 없음", "나만의 카테고리 30개", "얼리버드 전용 뱃지", "보관함 30GB"] },
};

export function PlanBadge({ plan, size = "sm" }: { plan: Plan; size?: "sm" | "md" }) {
  const m = PLAN_META[plan];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${m.badge} ${size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}`}>
      <span aria-hidden>{m.icon}</span>{tr(PLAN_LABEL[plan])}
    </span>
  );
}
const COMPARE: { label: string; v: [string, string, string] }[] = [
  { label: "가격", v: ["7일 무료", "월 4,900원\n연 39,000원", "89,000원 1회"] },
  { label: "AI 자동 정리", v: ["하루 20회", "무제한*", "무제한*"] },
  { label: "카테고리", v: ["기본 7개", "+ 나만의 10개", "+ 나만의 30개"] },
  { label: "보관함", v: ["100MB", "10GB", "30GB"] },
  { label: "원본 파일 받기", v: ["—", "✓", "✓"] },
  { label: "일정 미리 알림", v: ["—", "✓", "✓"] },
  { label: "이용 기간", v: ["가입 후 7일", "구독 중", "평생"] },
];

export function PlanCompare({ current }: { current?: Plan }) {
  const plans: Plan[] = ["free", "premium", "lifetime"];
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] bg-muted text-center text-[11px] font-bold text-foreground">
        <span className="py-2" />
        {plans.map((p) => <span key={p} className={`py-2 ${current === p ? "bg-primary text-primary-foreground" : ""}`}>{PLAN_META[p].icon} {tr(PLAN_LABEL[p].replace(" 사용자", ""))}</span>)}
      </div>
      {COMPARE.map((r) => (
        <div key={r.label} className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] border-t border-border text-center text-[11px]">
          <span className="py-2 pl-2 text-left font-semibold text-muted-foreground">{tr(r.label)}</span>
          {r.v.map((v, i) => <span key={i} className="whitespace-pre-line py-2 text-foreground">{tr(v)}</span>)}
        </div>
      ))}
      <p className="border-t border-border px-2 py-1.5 text-[10px] text-muted-foreground">{tr("* 공정 사용 범위 안에서 무제한")}</p>
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

const EMOJI_CHOICES = ["📚", "💼", "👶", "🏥", "✈️", "🏋️", "🎮", "🐶", "🎵", "🏠", "🚗", "🏷️"];

function CustomCategories({ plan, onUpgrade }: { plan: Plan; onUpgrade: () => void }) {
  const cats = useCustomCategories();
  const qc = useQueryClient();
  const limit = CUSTOM_CATEGORY_LIMIT[plan];
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [hint, setHint] = useState("");
  const [err, setErr] = useState("");
  const add = async () => {
    const n = name.trim();
    if (!n) return;
    if ((NOTE_CATEGORIES as readonly string[]).includes(n) || cats.some((c) => c.name === n)) { setErr(tr("이미 있는 카테고리예요")); return; }
    if (cats.length >= limit) { setErr(tr("최대 {0}개까지 만들 수 있어요", limit)); return; }
    const { error } = await supabase.from("user_categories").insert({ name: n.slice(0, 12), emoji, hint: hint.trim().slice(0, 80) });
    if (error) { setErr(tr("추가하지 못했어요")); return; }
    setName(""); setHint(""); setErr("");
    qc.invalidateQueries({ queryKey: ["user_categories"] });
  };
  const remove = async (id: string) => {
    await supabase.from("user_categories").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["user_categories"] });
  };
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {NOTE_CATEGORIES.map((c) => <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{catEmoji(c)} {tr(c)}</span>)}
      </div>
      {limit === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border p-3 text-center">
          <p className="text-sm font-semibold text-foreground">{tr("🔒 나만의 카테고리는 프리미엄 혜택이에요")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{tr("학습📚 · 사업💼 · 육아👶 처럼 만들면 AI가 알아서 그 칸으로 분류해요")}</p>
        </div>
      ) : (
        <>
          <p className="mt-3 text-xs font-semibold text-foreground">{tr("나만의 카테고리")} <span className="text-muted-foreground">{cats.length}/{limit}</span></p>
          <ul className="mt-1.5 space-y-1.5">
            {cats.map((c) => (
              <li key={c.id} className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
                <span className="text-lg">{c.emoji}</span>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-foreground">{c.name}</p>{c.hint && <p className="truncate text-[11px] text-muted-foreground">{c.hint}</p>}</div>
                <button aria-label={tr("{0} 삭제", c.name)} onClick={() => remove(c.id)} className="rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
              </li>
            ))}
          </ul>
          {cats.length < limit && (
            <div className="mt-2.5 space-y-2 rounded-xl border border-border p-3">
              <div className="flex flex-wrap gap-1">
                {EMOJI_CHOICES.map((e) => <button key={e} onClick={() => setEmoji(e)} className={`size-8 rounded-lg text-lg ${emoji === e ? "bg-primary/30 ring-1 ring-foreground" : "bg-muted/60"}`}>{e}</button>)}
              </div>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={12} placeholder={tr("이름 (예: 학습)")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none" />
              <input value={hint} onChange={(e) => setHint(e.target.value)} maxLength={80} placeholder={tr("AI 힌트 (선택) 예: 자격증, 강의, 스터디")} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none" />
              {err && <p className="text-xs text-destructive">{err}</p>}
              <button onClick={add} disabled={!name.trim()} className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{tr("➕ 카테고리 추가")}</button>
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">{tr("다음에 던지는 것부터 AI가 이 카테고리로도 분류해요")}</p>
        </>
      )}
    </>
  );
}

export type Prefs = { alarm: boolean; mode: "light" | "dark"; accent: "yellow" | "mint" | "pink" | "sky"; plan: Plan };
const DEFAULT: Prefs = { alarm: true, mode: "light", accent: "yellow", plan: "free" };

const PAY_PLANS = [
  { key: "monthly", plan: "premium" as Plan, name: "월간 구독", price: "4,900원", unit: "/월" },
  { key: "yearly", plan: "premium" as Plan, name: "연간 구독", price: "39,000원", unit: "/년" },
  { key: "lifetime", plan: "lifetime" as Plan, name: "평생 소장", price: "89,000원", unit: " 1회" },
];
const METHODS = ["🟡 카카오페이", "🔵 토스페이", "💳 신용/체크카드"];

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
          <p className="font-bold text-foreground">{tr("결제하기")} <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{tr("테스트")}</span></p>
          <button aria-label={tr("닫기")} onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"><X className="size-4" /></button>
        </div>
        {step === "done" ? (
          <div className="py-8 text-center">
            <p className="text-4xl">🎉</p>
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
            <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-foreground">{tr("📋 플랜별 차이 보기")}</summary><div className="mt-2"><PlanCompare /></div></details>
            <p className="mb-2 mt-4 text-xs font-semibold text-muted-foreground">{tr("결제 수단")}</p>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`rounded-xl border px-1 py-2 text-xs text-foreground ${method === m ? "border-foreground font-semibold" : "border-border"}`}>{tr(m)}</button>
              ))}
            </div>
            <button disabled={step === "paying"} onClick={pay} className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
              {step === "paying" ? tr("결제 진행 중...") : tr("{0} 결제하기", tr(chosen.price))}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">{tr("목업 결제창이에요. 실제로 돈이 나가지 않아요.")}</p>
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

const PRIVACY = `톡비서 개인정보처리방침

1. 수집 항목: 이메일 주소, 사용자가 업로드한 메모·스크린샷·링크
2. 이용 목적: AI 자동 분류·요약, 검색 및 일정 알림 제공
3. 보관 기간: 회원 탈퇴 시 지체 없이 파기
4. 제3자 제공: AI 분석을 위해 업로드 내용이 AI 모델 제공사에 전송될 수 있으며, 학습에 사용되지 않습니다.
5. 문의: 앱 내 고객센터

(본 문서는 초안이며 정식 서비스 전 법률 검토가 필요합니다.)`;
const TERMS = `톡비서 서비스 이용약관

제1조 (목적) 본 약관은 톡비서 서비스 이용에 관한 조건을 정합니다.
제2조 (서비스) 메모·스크린샷·링크의 AI 자동 정리, 검색, 알림 기능을 제공합니다.
제3조 (유료 서비스) 월간 4,900원, 연간 39,000원, 평생 소장 89,000원 플랜이 있으며, 공정 사용 한도가 적용될 수 있습니다.
제4조 (이용자 의무) 타인의 권리를 침해하는 콘텐츠를 업로드해서는 안 됩니다.
제5조 (면책) AI 분석 결과의 정확성은 보장되지 않습니다.

(본 문서는 초안이며 정식 서비스 전 법률 검토가 필요합니다.)`;

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
      <p className="mt-2 text-[11px] text-muted-foreground">{tr("AI 답변과 음성 입력도 이 언어로 바뀌어요")}</p>
    </>
  );
}

export function SettingsSheet({ usage, email, joinedAt, prefs, setPrefs, onLogout, onDeleteAccount, onClose }: {
  usage?: Usage | undefined; email: string; joinedAt: string | null; prefs: Prefs; setPrefs: (p: Prefs) => void; onLogout: () => void; onDeleteAccount: () => Promise<void>; onClose: () => void;
}) {
  const [doc, setDoc] = useState<null | "privacy" | "terms">(null);
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
        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          <Section title={tr("내 가입 정보")}>
            <p className="text-sm font-medium text-foreground">{email}</p>
            {joinedAt && <p className="mt-0.5 text-xs text-muted-foreground">{tr("가입일 {0}", new Date(joinedAt).toLocaleDateString(locale()))}</p>}
            <button onClick={onLogout} className="mt-3 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">{tr("로그아웃")}</button>
          </Section>
          <Section title={tr("결제 정보")}>
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-2xl">{PLAN_META[prefs.plan].icon}</span>
              <div className="flex-1">
                <p className="text-[11px] text-muted-foreground">{tr("현재 플랜")}</p>
                <p className="text-base font-bold text-foreground">{tr(PLAN_LABEL[prefs.plan])}</p>
              </div>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-foreground">{tr("● 이용 중")}</span>
            </div>
            <ul className="mt-2.5 space-y-1">
              {PLAN_META[prefs.plan].perks.map((p) => <li key={p} className="text-xs text-foreground">✓ {tr(p)}</li>)}
            </ul>
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold text-foreground">{tr("📋 플랜별 혜택 한눈에 비교")}</summary>
              <div className="mt-2"><PlanCompare current={prefs.plan} /></div>
            </details>
            {prefs.plan !== "lifetime" && <button onClick={() => setPaying(true)} className="mt-3 w-full rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground">{prefs.plan === "free" ? tr("프리미엄으로 업그레이드 👑") : tr("평생 소장으로 변경 👑")}</button>}
            {prefs.plan !== "free" && <button onClick={() => setPrefs({ ...prefs, plan: "free" })} className="mt-2 w-full text-xs text-muted-foreground underline">{tr("무료로 되돌리기 (테스트)")}</button>}
          </Section>
          <Section title={tr("🏷️ 카테고리 관리")}>
            <CustomCategories plan={prefs.plan} onUpgrade={() => setPaying(true)} />
          </Section>
          <Section title={tr("📦 내 보관함")}>
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
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-primary" />📸 {tr("스샷")} {fmtBytes(u.image)}</span>
                    <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-accent-foreground/60" />📄 {tr("문서")} {fmtBytes(u.doc)}</span>
                    <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-destructive/70" />🎙️ {tr("음성")} {fmtBytes(u.voice)}</span>
                  </div>
                  {prefs.plan === "free" && <p className="mt-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-foreground">{left > 0 ? tr("🌱 무료 체험 {0}일 남았어요 (7일 · 100MB)", left) : tr("⏰ 무료 체험 7일이 끝났어요. 업그레이드하면 계속 보관할 수 있어요")}</p>}
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{tr("파일 1개당 최대 5MB")}</p>
                </>
              );
            })()}
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
          <Section title={tr("언어")}>
            <LangPicker />
          </Section>
          <Section title={tr("앱 테마")}>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {(["light", "dark"] as const).map((m) => (
                <button key={m} onClick={() => setPrefs({ ...prefs, mode: m })}
                  className={`rounded-xl border py-2 text-sm text-foreground ${prefs.mode === m ? "border-foreground font-semibold" : "border-border"}`}>
                  {m === "light" ? tr("☀️ 라이트") : tr("🌙 다크")}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              {ACCENTS.map((a) => (
                <button key={a.key} onClick={() => setPrefs({ ...prefs, accent: a.key })} className="flex flex-col items-center gap-1">
                  <span className={`size-9 rounded-full ${a.cls} ${prefs.accent === a.key ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : ""}`} />
                  <span className="text-[11px] text-muted-foreground">{tr(a.label)}</span>
                </button>
              ))}
            </div>
          </Section>
          <div className="space-y-1 pt-4 text-center">
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <button onClick={() => setDoc("privacy")} className="underline">{tr("개인정보처리방침")}</button>
              <button onClick={() => setDoc("terms")} className="underline">{tr("이용약관")}</button>
            </div>
            <p className="text-[11px] text-muted-foreground">{tr("톡비서 웹 버전 v1.0.0")}</p>
            <button onClick={() => setQuitting(true)} className="pt-2 text-[11px] text-muted-foreground underline">{tr("회원탈퇴")}</button>
          </div>
        </div>
        {paying && <PaymentModal onClose={() => setPaying(false)} onPaid={(plan) => setPrefs({ ...prefs, plan })} />}
        {quitting && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/30 p-4" onClick={() => !quitBusy && setQuitting(false)}>
            <div className="w-full max-w-sm rounded-2xl bg-card p-4" onClick={(e) => e.stopPropagation()}>
              <p className="text-base font-bold text-foreground">{tr("정말 떠나시나요? 🥲")}</p>
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
        {doc && (
          <div className="absolute inset-0 z-10 flex justify-center bg-foreground/30" onClick={() => setDoc(null)}>
            <div className="m-4 mt-16 w-full max-w-md overflow-y-auto rounded-2xl bg-card p-4" onClick={(e) => e.stopPropagation()}>
              <div className="mb-2 flex justify-end"><button aria-label={tr("닫기")} onClick={() => setDoc(null)} className="rounded-full p-1.5 hover:bg-muted"><X className="size-4" /></button></div>
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{doc === "privacy" ? PRIVACY : TERMS}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
