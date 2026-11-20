import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CardBack, FlipCard, PersonaAvatar } from "@/components/TarotCardView";
import { CardSpread } from "@/components/CardSpread";
import { DECK, PERSONAS, POSITIONS, shuffle, type PersonaId } from "@/lib/tarot";
import { DAILY_LIMIT_CODE, getStartStatus, startReading } from "@/lib/tarot.functions";
import { FixedAdBanner, RewardedAdDialog } from "@/components/MockAds";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getMembership, syncWallet } from "@/lib/membership";
import { cn } from "@/lib/utils";
import { sfx } from "@/lib/sound";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({
    meta: [
      { title: "새 상담 — 찻잔 타로" },
      { name: "description", content: "상담사를 고르고 직감으로 3장의 카드를 뽑아보세요." },
      { property: "og:title", content: "새 상담 — 찻잔 타로" },
      { property: "og:description", content: "상담사를 고르고 직감으로 3장의 카드를 뽑아보세요." },
    ],
  }),
  component: NewReading,
});

const SPREAD = DECK.length;

function NewReading() {
  const navigate = useNavigate();
  const [concern, setConcern] = useState("");
  const [step, setStep] = useState<"persona" | "draw">("persona");
  const [persona, setPersona] = useState<PersonaId | null>(null);
  const [deck, setDeck] = useState(() => DECK.slice(0, SPREAD));
  const [shuffling, setShuffling] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ freeLeft: number; adOpensLeft: number } | null>(null);
  const [unlock, setUnlock] = useState<"ad" | "leaf" | undefined>(undefined);
  const [gateOpen, setGateOpen] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const [leaves, setLeaves] = useState(0);
  useEffect(() => {
    getStartStatus().then(setStatus).catch(() => {});
    setLeaves(getMembership().leaves);
    syncWallet().then((w) => setLeaves(w.leaves)).catch(() => {});
  }, []);
  const needsUnlock = !!status && status.freeLeft <= 0 && !unlock;
  function goDraw() {
    setStep("draw");
    window.scrollTo({ top: 0 });
  }

  useEffect(() => {
    setConcern(sessionStorage.getItem("pending-concern") ?? "");
    setDeck(shuffle(DECK).slice(0, SPREAD));
  }, []);

  const pickedCards = useMemo(() => picked.map((i) => deck[i]).filter((c): c is NonNullable<typeof c> => !!c), [picked, deck]);

  function doShuffle() {
    sfx.shuffle();
    setShuffling(true);
    setPicked([]);
    setRevealed(false);
    setTimeout(() => {
      setDeck(shuffle(DECK).slice(0, SPREAD));
      setShuffling(false);
    }, 700);
  }

  function pick(i: number) {
    if (picked.includes(i) || picked.length >= 3 || shuffling) return;
    sfx.pick();
    const next = [...picked, i];
    setPicked(next);
    if (next.length === 3)
      setTimeout(() => {
        setRevealed(true);
        sfx.flip();
      }, 500);
  }

  async function begin() {
    if (!persona || pickedCards.length !== 3 || !concern.trim()) return;
    setBusy(true);
    try {
      const { id } = await startReading({
        data: {
          concern: concern.trim(),
          persona,
          cards: pickedCards.map((c, i) => ({ id: c.id, position: POSITIONS[i] })),
          unlock,
        },
      });
      sessionStorage.removeItem("pending-concern");
      navigate({ to: "/reading/$id", params: { id } });
    } catch (e) {
      if (e instanceof Error && e.message === DAILY_LIMIT_CODE) {
        setStatus((s) => ({ freeLeft: 0, adOpensLeft: s?.adOpensLeft ?? 0 }));
        setStep("persona");
        setBusy(false);
        setGateOpen(true);
        return;
      } else toast.error(e instanceof Error ? e.message : "상담을 시작하지 못했어요.");
      setBusy(false);
    }
  }

  if (step === "persona") {
    return (
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <h1 className="mt-4 font-serif text-3xl font-bold">어떤 상담사와 이야기할까요?</h1>
        <div className="mt-5 rounded-2xl border bg-card/70 p-4">
          <p className="mb-2 text-sm text-muted-foreground">나의 고민</p>
          <Textarea
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="고민을 적어주세요"
            className="bg-card"
          />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Object.values(PERSONAS).map((p) => (
            <button
              key={p.id}
              onClick={() => setPersona(p.id)}
              className={cn(
                "rounded-3xl border-2 bg-card p-5 text-left shadow-warm transition-all hover:-translate-y-1",
                persona === p.id ? "border-primary" : "border-transparent",
              )}
            >
              <PersonaAvatar id={p.id} emoji={p.emoji} className="size-20 text-4xl" />
              <p className="mt-3 font-serif text-xl font-bold">{p.name}</p>
              <p className="text-sm text-primary">{p.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            </button>
          ))}
        </div>
        <Button
          size="lg"
          className="mt-8 w-full"
          onClick={() => {
            if (!persona) { toast.error("상담사를 먼저 골라주세요"); return; }
            if (concern.trim().length < 5) { toast.error("고민을 5자 이상 적어주세요"); return; }
            if (needsUnlock) { setGateOpen(true); return; }
            goDraw();
          }}
        >
          카드 뽑으러 가기
        </Button>
        {status && status.freeLeft <= 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {unlock ? "새 상담이 열렸어요 🍵" : "오늘의 무료 상담은 이미 썼어요 · 광고나 찻잎으로 새 상담을 열 수 있어요"}
          </p>
        )}
        <Dialog open={gateOpen} onOpenChange={setGateOpen}>
          <DialogContent className="max-w-sm">
            <DialogTitle className="font-serif">오늘의 무료 찻잔을 이미 비웠어요 🍵</DialogTitle>
            <p className="text-sm text-muted-foreground">새로운 고민을 더 나누고 싶다면, 차를 한 잔 더 우려볼까요?</p>
            <div className="grid gap-2 pt-2">
              <Button
                onClick={() => {
                  if (leaves < 1) { navigate({ to: "/membership" }); return; }
                  setUnlock("leaf");
                  setGateOpen(false);
                  toast.success("찻잎 1개로 새 상담을 열어요 🌿", { description: "상담이 시작될 때 찻잎이 쓰여요" });
                  if (persona && concern.trim().length >= 5) goDraw();
                }}
              >
                {leaves < 1 ? "🌿 찻잎 충전하러 가기" : `🌿 찻잎 1개로 새 상담 열기 (보유 ${leaves}개)`}
              </Button>
              {(status?.adOpensLeft ?? 0) > 0 && (
                <Button variant="outline" onClick={() => { setGateOpen(false); setAdOpen(true); }}>
                  📺 짧은 광고 보고 새 상담 열기 (오늘 {status?.adOpensLeft}번)
                </Button>
              )}
              <Button variant="ghost" onClick={() => setGateOpen(false)}>내일 다시 올게요</Button>
            </div>
          </DialogContent>
        </Dialog>
        <RewardedAdDialog
          open={adOpen}
          onOpenChange={setAdOpen}
          onReward={() => {
            setUnlock("ad");
            toast.success("새 상담이 열렸어요 🍵");
            if (persona && concern.trim().length >= 5) goDraw();
          }}
        />
        <FixedAdBanner />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16">
      <button onClick={() => setStep("persona")} className="mt-2 text-sm text-muted-foreground hover:text-foreground">
        ← 상담사 다시 고르기
      </button>
      <h1 className="mt-3 font-serif text-3xl font-bold">마음이 끌리는 카드 3장을 골라주세요</h1>
      <p className="mt-1 text-muted-foreground">
        고민을 떠올리며 천천히 숨을 고르고, 직감을 믿어보세요. ({picked.length}/3)
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-6">
        {POSITIONS.map((pos, i) => (
          <div key={pos} className="text-center">
            <div className="mx-auto w-full max-w-[150px]">
              {pickedCards[i] ? (
                <div className="animate-slot-in"><FlipCard card={pickedCards[i]} flipped={revealed} shimmer /></div>
              ) : (
                <div className="aspect-[5/8] rounded-xl border-2 border-dashed border-border" />
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{pos}</p>
          </div>
        ))}
      </div>

      {!revealed && (
        <>
          <p className="mt-8 text-center text-xs text-muted-foreground">22장이 펼쳐져 있어요 · 옆으로 밀며 마음이 가는 카드를 골라주세요</p>
          <CardSpread>
            <div className="flex w-max pr-4">
              {deck.map((c, i) => (
                <button
                  key={`${c.id}-${i}`}
                  onClick={() => pick(i)}
                  disabled={picked.includes(i)}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className={cn(
                    "card-glow relative aspect-[5/8] w-20 shrink-0 rounded-xl transition-all duration-300 hover:z-10 hover:-translate-y-4 sm:w-24",
                    i > 0 && "-ml-11 sm:-ml-12",
                    shuffling ? "scale-75 opacity-0" : "animate-deal",
                    picked.includes(i) && "pointer-events-none -translate-y-5 opacity-20",
                  )}
                  aria-label={`카드 ${i + 1}`}
                >
                  <CardBack />
                </button>
              ))}
            </div>
          </CardSpread>
          <Button variant="outline" className="mt-6 w-full" onClick={doShuffle} disabled={shuffling}>
            🔀 카드 다시 섞기
          </Button>
        </>
      )}

      {revealed && (
        <div className="mt-8 space-y-3">
          <Button size="lg" className="w-full" onClick={begin} disabled={busy}>
            {busy ? `${persona ? PERSONAS[persona].name : "상담사"}가 카드를 읽고 있어요…` : "이 카드로 상담 시작하기"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={doShuffle} disabled={busy}>
            다시 뽑기
          </Button>
        </div>
      )}
      <p className="mt-10 text-center text-xs text-muted-foreground">
        <Link to="/readings" className="underline">
          지난 상담 보기
        </Link>
      </p>
      <FixedAdBanner />
    </main>
  );
}
