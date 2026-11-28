import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CardBack, FlipCard, PersonaAvatar } from "@/components/TarotCardView";
import { CardSpread } from "@/components/CardSpread";
import { DECK, PERSONAS, POSITIONS, shuffle, type PersonaId } from "@/lib/tarot";
import { DAILY_LIMIT_CODE, getGuestStartStatus, getStartStatus, startGuestReading, startReading } from "@/lib/tarot.functions";
import { supabase } from "@/integrations/supabase/client";
import { FixedAdBanner, RewardedAdDialog, isAppWrapper } from "@/components/MockAds";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getMembership, syncWallet } from "@/lib/membership";
import { AD_ONLY_MODE, ADSENSE_APPROVED } from "@/lib/access";
import { cn } from "@/lib/utils";
import { sfx } from "@/lib/sound";
import { useI18n, usePersonaText } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({
    meta: [
      { title: "새 상담 — 찻잔 타로" },
      { name: "description", content: "상담사를 고르고 직감으로 3장의 카드를 뽑아보세요." },
      { property: "og:title", content: "새 상담 — 찻잔 타로" },
      { property: "og:description", content: "상담사를 고르고 직감으로 3장의 카드를 뽑아보세요." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewReading,
});

const SPREAD = DECK.length;

function NewReading() {
  const { t, lang } = useI18n();
  const personaText = usePersonaText();
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
  const [isGuest, setIsGuest] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsGuest(false);
        getStartStatus().then(setStatus).catch(() => {});
        setLeaves(getMembership().leaves);
        syncWallet().then((w) => setLeaves(w.leaves)).catch(() => {});
      } else {
        setIsGuest(true);
        const dayToken = localStorage.getItem("teacup-guest-day") ?? undefined;
        getGuestStartStatus({ data: { dayToken } })
          .then((res) => {
            localStorage.setItem("teacup-guest-day", res.dayToken);
            setStatus({ freeLeft: res.freeLeft, adOpensLeft: res.adOpensLeft });
          })
          .catch(() => {});
      }
    });
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
      const cards = pickedCards.map((c, i) => ({ id: c.id, position: POSITIONS[i] }));
      if (isGuest) {
        const dayToken = localStorage.getItem("teacup-guest-day") ?? undefined;
        const res = await startGuestReading({
          data: {
            concern: concern.trim(),
            persona,
            cards,
            unlock: unlock === "ad" ? "ad" : undefined,
            dayToken,
            language: lang,
          },
        });
        localStorage.setItem("teacup-guest-day", res.dayToken);
        localStorage.setItem(
          `teacup-guest-reading-${res.id}`,
          JSON.stringify({
            reading: {
              id: res.id,
              concern: concern.trim(),
              persona,
              cards,
              prescription: null,
            },
            messages: [{ id: "m0", role: "assistant", content: res.reply }],
            turnToken: res.turnToken,
          }),
        );
        sessionStorage.removeItem("pending-concern");
        navigate({ to: "/reading/$id", params: { id: res.id } });
        return;
      }
      const { id } = await startReading({
        data: {
          concern: concern.trim(),
          persona,
          cards,
          unlock,
          language: lang,
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
      } else toast.error(e instanceof Error ? e.message : t("startError"));
      setBusy(false);
    }
  }

  const posLabels = [t("posPast"), t("posPresent"), t("posFuture")];

  if (step === "persona") {
    return (
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <h1 className="mt-4 font-serif text-3xl font-bold">{t("newTitle")}</h1>
        <div className="mt-5 rounded-2xl border bg-card/70 p-4">
          <p className="mb-2 text-sm text-muted-foreground">{t("newConcernLabel")}</p>
          <Textarea
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={t("newConcernPlaceholder")}
            className="bg-card"
          />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Object.values(PERSONAS).map((p) => {
            const pt = personaText(p.id);
            return (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={cn(
                  "rounded-3xl border-2 bg-card p-5 text-left shadow-warm transition-all hover:-translate-y-1",
                  persona === p.id ? "border-primary" : "border-transparent",
                )}
              >
                <PersonaAvatar id={p.id} emoji={p.emoji} className="size-20 text-4xl" />
                <p className="mt-3 font-serif text-xl font-bold">{pt.name}</p>
                <p className="text-sm text-primary">{pt.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pt.desc}</p>
              </button>
            );
          })}
        </div>
        <Button
          size="lg"
          className="mt-8 w-full"
          onClick={() => {
            if (!persona) { toast.error(t("toastPickPersona")); return; }
            if (concern.trim().length < 5) { toast.error(t("toastConcernMin")); return; }
            if (needsUnlock) {
              if (!ADSENSE_APPROVED) {
                toast.error(t("freeLimitReached"));
                return;
              }
              setGateOpen(true);
              return;
            }
            goDraw();
          }}
        >
          {t("goDrawButton")}
        </Button>
        {status && status.freeLeft <= 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {!ADSENSE_APPROVED
              ? t("freeLimitReached")
              : unlock
                ? t("unlockOpened")
                : AD_ONLY_MODE
                  ? t(isAppWrapper() ? "freeUsedAd" : "freeUsedWeb")
                  : t("freeUsedLeaf")}
          </p>
        )}
        <Dialog open={gateOpen} onOpenChange={setGateOpen}>
          <DialogContent className="max-w-sm">
            <DialogTitle className="font-serif">{t("gateTitle")}</DialogTitle>
            <p className="text-sm text-muted-foreground">{t("gateDesc")}</p>
            <div className="grid gap-2 pt-2">
              {!AD_ONLY_MODE && (
                <Button
                  onClick={() => {
                    if (leaves < 1) { navigate({ to: "/membership" }); return; }
                    setUnlock("leaf");
                    setGateOpen(false);
                    toast.success(t("toastLeafUnlock"), { description: t("toastLeafUnlockDesc") });
                    if (persona && concern.trim().length >= 5) goDraw();
                  }}
                >
                  {leaves < 1 ? t("gateLeafCharge") : t("gateLeafUse", { n: leaves })}
                </Button>
              )}
              {(status?.adOpensLeft ?? 0) > 0 && (
                <Button variant={AD_ONLY_MODE ? "default" : "outline"} onClick={() => { setGateOpen(false); setAdOpen(true); }}>
                  {t(isAppWrapper() ? "gateAd" : "gateWeb", { n: status?.adOpensLeft ?? 0 })}
                </Button>
              )}
              <Button variant="ghost" onClick={() => setGateOpen(false)}>{t("gateLater")}</Button>
            </div>
          </DialogContent>
        </Dialog>
        <RewardedAdDialog
          open={adOpen}
          onOpenChange={setAdOpen}
          onReward={() => {
            setUnlock("ad");
            toast.success(t("unlockOpened"));
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
        {t("rePickPersona")}
      </button>
      <h1 className="mt-3 font-serif text-3xl font-bold">{t("drawTitle")}</h1>
      <p className="mt-1 text-muted-foreground">
        {t("drawDesc")} ({picked.length}/3)
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
            <p className="mt-2 text-xs text-muted-foreground">{posLabels[i]}</p>
          </div>
        ))}
      </div>

      {!revealed && (
        <>
          <p className="mt-8 text-center text-xs text-muted-foreground">{t("spreadHint")}</p>
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
                  aria-label={t("cardAria", { n: i + 1 })}
                >
                  <CardBack />
                </button>
              ))}
            </div>
          </CardSpread>
          <Button variant="outline" className="mt-6 w-full" onClick={doShuffle} disabled={shuffling}>
            {t("shuffleButton")}
          </Button>
        </>
      )}

      {revealed && (
        <div className="mt-8 space-y-3">
          <Button size="lg" className="w-full" onClick={begin} disabled={busy}>
            {busy ? t("readingBusy", { name: persona ? personaText(persona).name : "" }) : t("startWithCards")}
          </Button>
          <Button variant="ghost" className="w-full" onClick={doShuffle} disabled={busy}>
            {t("redraw")}
          </Button>
        </div>
      )}
      <p className="mt-10 text-center text-xs text-muted-foreground">
        <Link to="/readings" className="underline">
          {t("pastReadings")}
        </Link>
      </p>
      <FixedAdBanner />
    </main>
  );
}
