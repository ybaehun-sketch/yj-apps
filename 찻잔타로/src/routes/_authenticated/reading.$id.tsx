import { QRCodeSVG } from "qrcode.react";
import { stampFor } from "@/lib/stamps";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { RewardedAdDialog } from "@/components/MockAds";
import { CheckoutDialog, type Product } from "@/components/CheckoutDialog";
import { PACKS } from "@/lib/products";
import {
  AD_TURNS,
  LEAF_TURNS,
  addExtraTurns,
  getExtraTurns,
  getMembership,
  setMembership,
  spendLeaf,
  grantAdTurns,
  syncWallet,
  turnsLeft,
} from "@/lib/membership";
import { toast } from "sonner";
import { AD_ONLY_MODE, adsLeftToday, isAdminEmail, recordAdWatched } from "@/lib/access";
import { sfx } from "@/lib/sound";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CardFace, PersonaAvatar } from "@/components/TarotCardView";
import { PERSONAS, cardById, type DrawnCard, type PersonaId } from "@/lib/tarot";
import { grantGuestAdTurn, makePrescription, sendGuestMessage, sendMessage } from "@/lib/tarot.functions";

type Msg = { id: string; role: string; content: string };

type GuestStored = {
  reading: { id: string; concern: string; persona: string; cards: DrawnCard[]; prescription: string | null };
  messages: Msg[];
  turnToken: string;
};

const guestStorageKey = (id: string) => `teacup-guest-reading-${id}`;

const readingQuery = (id: string) =>
  queryOptions({
    queryKey: ["reading", id],
    queryFn: async () => {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(guestStorageKey(id));
        if (raw) {
          const parsed = JSON.parse(raw) as GuestStored;
          return { ...parsed, isGuest: true as const };
        }
      }
      const [r, m] = await Promise.all([
        supabase.from("readings").select("*").eq("id", id).single(),
        supabase
          .from("reading_messages")
          .select("id, role, content")
          .eq("reading_id", id)
          .order("created_at", { ascending: true }),
      ]);
      if (r.error) throw r.error;
      if (m.error) throw m.error;
      return { reading: r.data, messages: m.data as Msg[], isGuest: false as const, turnToken: "" };
    },
  });

export const Route = createFileRoute("/_authenticated/reading/$id")({
  head: () => ({
    meta: [
      { title: "타로 상담 중 — 찻잔 타로" },
      { name: "description", content: "고민과 카드로 이어가는 1:1 타로 대화" },
      { property: "og:title", content: "타로 상담 중 — 찻잔 타로" },
      { property: "og:description", content: "고민과 카드로 이어가는 1:1 타로 대화" },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(readingQuery(params.id)),
  component: ReadingChat,
});

function ReadingChat() {
  const { id } = Route.useParams();
  return <Chat key={id} id={id} />;
}

function Chat({ id }: { id: string }) {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(readingQuery(id));
  const { reading } = data;
  const persona = PERSONAS[reading.persona as PersonaId] ?? PERSONAS.sister;
  const cards = (reading.cards as DrawnCard[]) ?? [];

  const [messages, setMessages] = useState<Msg[]>(data.messages);
  useEffect(() => {
    setMessages((cur) => (data.messages.length >= cur.filter((m) => !m.id.startsWith("tmp-")).length && data.messages.length >= cur.length ? data.messages : cur));
  }, [data.messages]);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [prescription, setPrescription] = useState<string | null>(reading.prescription);
  const [rxOpen, setRxOpen] = useState(false);
  const [rxBusy, setRxBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);
  useEffect(() => {
    if (!pending) inputRef.current?.focus();
  }, [pending]);

  const [premium, setPremium] = useState(false);
  const [extra, setExtra] = useState(0);
  const [leaves, setLeaves] = useState(0);
  const [adOpen, setAdOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAdmin(isAdminEmail(data.user?.email)));
  }, []);
  const openAd = () => {
    if (!admin && adsLeftToday() <= 0) {
      toast.error("오늘 볼 수 있는 광고를 모두 봤어요. 내일 다시 만나요 🍵");
      return;
    }
    setAdOpen(true);
  };
  function refreshLimits() {
    const s = getMembership();
    setPremium(s.premium);
    setLeaves(s.leaves);
    setExtra(getExtraTurns(id));
  }
  useEffect(() => {
    refreshLimits();
    syncWallet().then(refreshLimits);
    const onFocus = () => refreshLimits();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [id]);
  const [buyLeaf, setBuyLeaf] = useState<Product | null>(null);
  const userTurns = messages.filter((m) => m.role === "user").length;
  const left = turnsLeft(userTurns, extra);
  // 찻잎이 있으면 막지 않고, 보낼 때 자동으로 1개 우려 대화를 이어간다
  const locked = left <= 0 && leaves < 1 && !pending;

  async function send() {
    const t = text.trim();
    if (!t || pending || locked) return;
    if (left <= 0) {
      if (!(await spendLeaf(id, userTurns))) {
        toast.error("찻잎을 우리지 못했어요. 잠시 후 다시 시도해 주세요.");
        refreshLimits();
        return;
      }
      refreshLimits();
      toast.success(`찻잎 1개를 우려 대화 ${LEAF_TURNS}번이 이어져요 🌿`, { duration: 2500 });
    }
    setText("");
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: "user", content: t }]);
    setPending(true);
    try {
      let reply = "";
      let nextTurnToken = data.turnToken;
      if (data.isGuest) {
        const res = await Promise.race([
          sendGuestMessage({
            data: {
              turnToken: data.turnToken,
              persona: (reading.persona as PersonaId) ?? "sister",
              concern: reading.concern,
              cards,
              messages: messages.map((m) => ({
                role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
                content: m.content,
              })),
              text: t,
            },
          }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("TIMEOUT")), 40000)),
        ]);
        reply = res.reply;
        nextTurnToken = res.turnToken;
      } else {
        const res = await Promise.race([
          sendMessage({ data: { readingId: id, text: t } }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("TIMEOUT")), 40000)),
        ]);
        reply = res.reply;
      }
      toast.dismiss("chat-error");
      const now = Date.now();
      const userMsg = { id: `tmp-u-${now}`, role: "user", content: t };
      const aiMsg = { id: `tmp-a-${now}`, role: "assistant", content: reply };
      const nextMsgs = [...messages, userMsg, aiMsg];
      setMessages((m) => [...m, aiMsg]);
      sfx.clink();
      if (data.isGuest) {
        localStorage.setItem(
          guestStorageKey(id),
          JSON.stringify({ reading, messages: nextMsgs, turnToken: nextTurnToken }),
        );
      }
      qc.setQueryData(readingQuery(id).queryKey, (old) =>
        old ? { ...old, messages: nextMsgs, turnToken: nextTurnToken } : old,
      );
      qc.invalidateQueries({ queryKey: ["readings"] });
      qc.invalidateQueries({ queryKey: ["reading", id] });
    } catch (e) {
      const timedOut = e instanceof Error && e.message === "TIMEOUT";
      const raw = e instanceof Error ? e.message : "";
      const isNetwork = /failed to fetch|networkerror|load failed|network request failed|fetch/i.test(raw);
      const hasKorean = /[가-힣]/.test(raw);
      // 연결이 끊겼을 수 있으니 서버에 실제로 저장됐는지 다시 확인
      qc.invalidateQueries({ queryKey: ["reading", id] });
      setText(t);
      setMessages((m) => m.slice(0, -1));
      toast.error(
        timedOut
          ? "답장이 늦어지고 있어요. 연결을 확인하고 다시 보내 볼까요?"
          : isNetwork || !hasKorean
            ? "인터넷 연결이 잠시 불안정해요. 다시 보내 볼까요?"
            : raw,
        { id: "chat-error", action: { label: "다시 시도", onClick: () => document.getElementById("chat-send")?.click() } },
      );
    } finally {
      setPending(false);
    }
  }

  async function finish() {
    setRxOpen(true);
    if (prescription) return;
    setRxBusy(true);
    try {
      const { prescription: p } = await makePrescription({ data: { readingId: id } });
      setPrescription(p);
      sfx.clink();
      qc.invalidateQueries({ queryKey: ["readings"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "처방전을 만들지 못했어요.");
      setRxOpen(false);
    } finally {
      setRxBusy(false);
    }
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-68px)] max-h-[calc(100svh-68px)] max-w-2xl flex-col px-3 sm:px-5">
      <div className="flex items-center gap-3 rounded-2xl border bg-card/80 p-3">
        <PersonaAvatar id={persona.id} emoji={persona.emoji} className="size-12 text-2xl" />
        <div className="min-w-0 flex-1">
          <p className="font-serif font-bold">{persona.name}</p>
          <p className="truncate text-xs text-muted-foreground">{reading.concern}</p>
        </div>
        <Button size="sm" onClick={finish}>
          상담 마치기
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        <div className="mx-auto grid max-w-sm grid-cols-3 gap-3">
          {cards.map((c) => (
            <div key={c.position} className="text-center">
              <div className="aspect-[5/8]">
                <CardFace card={cardById(c.id)} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{c.position}</p>
            </div>
          ))}
        </div>

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-cocoa px-4 py-2.5 text-cocoa-foreground">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2">
              <PersonaAvatar id={persona.id} emoji={persona.emoji} className="size-8 border" />
              <div className="flex max-w-[85%] flex-col items-start gap-1.5">
                {m.content
                  .split(/\n\s*\n/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((para, i) => (
                    <p
                      key={i}
                      className={`whitespace-pre-wrap rounded-2xl border bg-card px-4 py-2.5 leading-relaxed text-foreground shadow-warm ${i === 0 ? "rounded-tl-sm" : ""}`}
                    >
                      {para}
                    </p>
                  ))}
              </div>
            </div>
          ),
        )}
        {pending && (
          <div className="flex gap-2">
            <PersonaAvatar id={persona.id} emoji={persona.emoji} className="size-8 border" />
            <p className="flex items-center gap-2 rounded-2xl rounded-tl-sm border bg-card px-4 py-2.5 text-muted-foreground">
              <span className="animate-pulse">{TYPING[persona.id] ?? "생각을 적고 있어요…"}</span>
              <span className="flex gap-1">{[0, 1, 2].map((d) => <span key={d} className="size-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: `${d * 150}ms` }} />)}</span>
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {left > 0 && (
        <p className="mb-1 text-center text-xs text-muted-foreground">남은 대화 {left}회 🍵</p>
      )}
      {locked ? (
        <div className="mb-3 space-y-2 rounded-2xl border bg-card p-4 text-center shadow-warm">
          <p className="font-serif font-bold">준비된 차를 다 마셨어요 ☕</p>
          <p className="text-xs text-muted-foreground">이야기를 더 이어가고 싶다면 차를 한 잔 더 우려볼까요?</p>
          <div className="grid gap-2 pt-1">
            <Button variant={AD_ONLY_MODE ? "default" : "outline"} onClick={openAd}>
              📺 짧은 광고 보고 {AD_TURNS}번 더 대화하기
            </Button>
            {!AD_ONLY_MODE && (
              <Button onClick={() => setBuyLeaf(PACKS[0] ?? null)}>
                🌿 찻잎 충전하고 {LEAF_TURNS}번 더 대화하기
              </Button>
            )}
          </div>
        </div>
      ) : (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mb-3 flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-warm"
      >
        <Textarea
          ref={inputRef}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          onFocus={(e) => {
            const el = e.currentTarget;
            setTimeout(() => el.scrollIntoView({ block: "end", behavior: "smooth" }), 300);
          }}
          placeholder={`${persona.name}에게 이야기하기…`}
          className="max-h-32 min-h-10 resize-none border-none bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button id="chat-send" type="submit" disabled={pending || !text.trim()} className="shrink-0">
          보내기
        </Button>
      </form>
      )}
      <RewardedAdDialog
        open={adOpen}
        onOpenChange={setAdOpen}
        onReward={async () => {
          recordAdWatched();
          let ok = false;
          if (data.isGuest) {
            const res = await grantGuestAdTurn({ data: { turnToken: data.turnToken } }).catch(() => null);
            if (res?.ok) {
              ok = true;
              addExtraTurns(id, AD_TURNS, userTurns);
              localStorage.setItem(
                guestStorageKey(id),
                JSON.stringify({ reading, messages, turnToken: res.turnToken }),
              );
              qc.setQueryData(readingQuery(id).queryKey, (old) =>
                old ? { ...old, turnToken: res.turnToken } : old,
              );
            }
          } else {
            ok = await grantAdTurns(id, userTurns);
          }
          refreshLimits();
          if (ok) toast.success(`대화 ${AD_TURNS}번이 추가됐어요 🍵`);
          else toast.error("오늘 광고로 받을 수 있는 대화를 모두 썼어요.");
        }}
      />

      <CheckoutDialog
        product={buyLeaf}
        onClose={() => setBuyLeaf(null)}
        doneLabel="바로 대화 이어가기"
        onDone={(_p, real) => {
          const m = getMembership();
          if (!real) setMembership({ ...m, leaves: m.leaves + 1 });
          void spendLeaf(id, userTurns).then((ok) => {
            refreshLimits();
            if (ok) toast.success(`찻잎을 우려 대화 ${LEAF_TURNS}번이 추가됐어요 🌿`);
          });
        }}
      />

      <PrescriptionDialog
        open={rxOpen}
        onOpenChange={setRxOpen}
        busy={rxBusy}
        line={prescription}
        personaName={persona.name}
        personaId={persona.id}
        personaEmoji={persona.emoji}
        cards={cards}
      />
    </main>
  );
}

const TYPING: Record<string, string> = {
  sister: "옆집 언니가 따뜻한 차를 우리며 답장을 쓰고 있어",
  fact: "츤데레 오빠가 무심한 척 답장 쓰는 중",
  witch: "달빛 마녀가 별의 속삭임을 받아 적고 있소",
};
// 스토어 출시 후 이 주소만 앱 다운로드 링크로 바꾸면 됩니다.
const APP_URL = "https://teacuptarot.com";
const SNS = [
  { name: "카카오톡", icon: "💬" },
  { name: "인스타그램", icon: "📸" },
  { name: "X", icon: "𝕏" },
  { name: "페이스북", icon: "f" },
  { name: "밴드", icon: "🅑" },
  { name: "문자", icon: "✉️" },
];
const SEAL: Record<string, string> = { sister: "☕", fact: "✔", witch: "☾" };

function PrescriptionDialog({
  open,
  onOpenChange,
  busy,
  line,
  personaName,
  personaEmoji,
  personaId,
  cards,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  busy: boolean;
  line: string | null;
  personaName: string;
  personaEmoji: string;
  personaId: string;
  cards: DrawnCard[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  async function makeImage() {
    if (!ref.current) throw new Error("no card");
    const url = await toPng(ref.current, { pixelRatio: 1080 / ref.current.offsetWidth, cacheBust: true });
    const bin = atob(url.split(",")[1] ?? "");
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { url, file: new File([bytes], "마음처방전.png", { type: "image/png" }) };
  }

  function download(url: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "마음처방전.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const ready = useRef<Promise<{ url: string; file: File }> | null>(null);
  useEffect(() => {
    ready.current = null;
    if (!open || busy || !line) return;
    const t = setTimeout(() => {
      ready.current = makeImage();
      ready.current.catch(() => { ready.current = null; });
    }, 400);
    return () => clearTimeout(t);
  }, [open, busy, line]);

  async function run(kind: "save" | "share") {
    let img: { url: string; file: File };
    try {
      img = await (ready.current ?? makeImage());
    } catch {
      toast.error("이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (kind === "save") {
      download(img.url);
      toast.success("처방전 이미지를 저장했어요.");
      return;
    }
    const text = `오늘의 마음 처방전 🍵\n“${line}”\n나도 찻잔 타로 보러 가기 👉 ${APP_URL}`;
    try {
      if (navigator.canShare?.({ files: [img.file] })) {
        await navigator.share({ files: [img.file], title: "오늘의 마음 처방전", text });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "오늘의 마음 처방전", text, url: APP_URL });
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    try { await navigator.clipboard?.writeText(text); } catch { /* ignore */ }
    download(img.url);
    toast.success("이미지를 저장하고 공유 문구를 복사했어요.");
  }

  async function copyLink(silent = false) {
    try {
      await navigator.clipboard.writeText(APP_URL);
      if (!silent) toast.success("링크를 복사했어요.");
      return true;
    } catch {
      if (!silent) toast.error("복사하지 못했어요. 주소를 길게 눌러 복사해 주세요.");
      return false;
    }
  }

  async function openSns(name: string) {
    const u = encodeURIComponent(APP_URL);
    const t = encodeURIComponent(`오늘의 마음 처방전 🍵 “${line}”`);
    const urls: Record<string, string> = {
      X: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
      페이스북: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      밴드: `https://band.us/plugin/share?body=${t}%0A${u}&route=${u}`,
      문자: `sms:?&body=${t}%20${u}`,
    };
    if (urls[name]) {
      window.open(urls[name], "_blank", "noopener,noreferrer");
      return;
    }
    // 카카오톡·인스타그램은 웹 바로가기가 없어 이미지 공유 창 + 링크 복사로 연결
    await copyLink(true);
    toast.success(`링크를 복사했어요. ${name}에 붙여넣어 주세요.`);
    await run("share");
  }


  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-none bg-background p-4">
        <DialogTitle className="sr-only">마음 처방전</DialogTitle>
        <div
          ref={ref}
          className="rx-paper relative mx-auto flex aspect-[9/16] w-full max-w-[300px] flex-col items-center justify-between overflow-hidden rounded-2xl p-6 text-center text-cocoa"
        >
          <div className="absolute inset-3 rounded-xl border border-gold/70" />
          <div className="absolute inset-[18px] rounded-lg border border-gold/30" />
          <div className="relative pt-5">
            <p className="text-[9px] tracking-[0.4em] text-primary">✦ TODAY'S PRESCRIPTION ✦</p>
            <p className="mt-2 font-serif text-[22px] font-bold">오늘의 마음 처방전</p>
            <p className="mt-1 text-[10px] tracking-widest opacity-70">{today}</p>
          </div>
          <div className="relative flex gap-2">
            {cards.map((c) => {
              const card = cardById(c.id);
              return (
                <div key={c.position} className="flex w-[62px] flex-col items-center rounded-md border border-gold/80 bg-gold/10 px-1 py-2">
                  <span className="text-[8px] tracking-widest text-primary">{c.position}</span>
                  {stampFor(card.id) ? (
                    <img src={stampFor(card.id)} alt={`'${card.name}' 카드`} className="my-1 size-[52px] rounded-full" />
                  ) : (
                    <span className="my-1 text-2xl">{card.symbol}</span>
                  )}
                  <span className="font-serif text-[9px] leading-tight">{card.name}</span>
                </div>
              );
            })}
          </div>
          <div className="relative w-full px-2">
            <div className="mx-auto mb-3 h-px w-16 bg-gold/60" />
            <p className="min-h-20 font-serif text-[17px] font-bold leading-relaxed">
              {busy || !line ? "처방전을 쓰는 중…" : `“${line}”`}
            </p>
            <div className="mx-auto mt-3 h-px w-16 bg-gold/60" />
          </div>
          <div className="relative flex w-full items-end justify-between gap-2 px-3 pb-5">
            <div className="text-left">
              <p className="text-[9px] tracking-widest text-primary">COUNSELOR</p>
              <p className="font-serif text-xs">{personaEmoji} {personaName}</p>
              <p className="mt-2 text-[9px] tracking-[0.3em] text-primary">🍵 찻잔 타로</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="rounded-md bg-card p-1">
                <QRCodeSVG value={APP_URL} size={44} bgColor="transparent" fgColor="currentColor" className="text-cocoa" />
              </div>
              <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="text-[8px] tracking-wider text-primary underline underline-offset-2">찻잔타로 방문하기</a>
            </div>
            <div className="rx-seal flex size-12 rotate-[-12deg] items-center justify-center rounded-full font-serif text-xl text-primary-foreground">
              {SEAL[personaId] ?? "✦"}
            </div>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => void run("save")} disabled={busy || !line}>
            이미지 저장
          </Button>
          <Button onClick={() => void run("share")} disabled={busy || !line}>
            공유하기
          </Button>
        </div>
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <span className="flex-1 truncate text-xs text-muted-foreground">{APP_URL}</span>
          <Button size="sm" variant="secondary" onClick={() => void copyLink()}>복사하기</Button>
        </div>
        <div className="grid grid-cols-6 gap-1 text-center">
          {SNS.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => void openSns(s.name)}
              className="flex flex-col items-center gap-1 rounded-lg py-1 text-[10px] text-foreground hover:bg-muted"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-muted text-lg">{s.icon}</span>
              {s.name}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
