import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FlipCard } from "@/components/TarotCardView";
import { FixedAdBanner } from "@/components/MockAds";
import { DAILY_MESSAGES, cardLabel, dailyCardFor, type TarotCard } from "@/lib/tarot";
import { cardText } from "@/lib/tarot-i18n";
import { PRODUCTS } from "@/lib/products";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listGuides } from "@/lib/guides.functions";
import { LatestGuides } from "@/components/HomeExtras";
import { AD_ONLY_MODE } from "@/lib/access";
import { useI18n } from "@/lib/i18n";

const guidesQ = queryOptions({ queryKey: ["guides"], queryFn: () => listGuides() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "찻잔 타로 — 오늘의 행운 카드와 따뜻한 고민 상담" },
      { name: "description", content: "매일 1장 무료 행운 타로, 그리고 고민을 들어주는 다정한 AI 타로 상담사와의 1:1 대화." },
      { property: "og:title", content: "찻잔 타로 — 오늘의 행운 카드와 따뜻한 고민 상담" },
      { property: "og:description", content: "매일 1장 무료 행운 타로, 그리고 고민을 들어주는 다정한 AI 타로 상담사와의 1:1 대화." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://teacuptarot.com/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: "https://teacuptarot.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://teacuptarot.com/" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(guidesQ),
  component: Index,
});

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function DailyTarot() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [card, setCard] = useState<TarotCard | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    localStorage.removeItem("daily-tarot");
    const load = (id: string | null) => {
      const targetId = id || (AD_ONLY_MODE ? "guest" : null);
      setUid(targetId);
      setCard(null);
      setFlipped(false);
      if (targetId) {
        const saved = localStorage.getItem(`daily-tarot:${targetId}`);
        if (saved) {
          const { date, seed } = JSON.parse(saved) as { date: string; seed: string };
          if (date === todayKey()) {
            setCard(dailyCardFor(date, seed));
            setFlipped(true);
          }
        }
      }
      setHydrated(true);
    };
    supabase.auth.getUser().then(({ data }) => load(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => load(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  function draw() {
    if (flipped) return;
    if (!uid && !AD_ONLY_MODE) {
      toast(t("toastLoginPrompt"));
      navigate({ to: "/auth", search: { redirect: "/" } });
      return;
    }
    const seed = Math.random().toString(36).slice(2);
    const date = todayKey();
    localStorage.setItem(`daily-tarot:${uid || "guest"}`, JSON.stringify({ date, seed }));
    setCard(dailyCardFor(date, seed));
    requestAnimationFrame(() => setFlipped(true));
  }

  return (
    <section className="rounded-3xl border bg-card/80 p-6 shadow-warm sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <button
          onClick={draw}
          disabled={!hydrated || flipped}
          aria-label={t("dailyAriaLabel")}
          className="w-32 shrink-0 transition-transform enabled:hover:-translate-y-1 sm:w-36"
        >
          <FlipCard card={card ?? dailyCardFor("x", "x")} flipped={flipped && !!card} />
        </button>
        <div className="text-center sm:text-left">
          <p className="text-xs tracking-widest text-primary">{t("dailyBadge")}</p>
          <h2 className="mt-1 font-serif text-2xl font-bold">{t("dailyTitle")}</h2>
          {flipped && card ? (
            (() => {
              const ct = cardText(card, lang);
              return (
                <>
                  <p className="mt-3 font-serif text-lg text-foreground">
                    {card.symbol} {ct.label}{" "}
                    <span className="text-sm text-muted-foreground">· {ct.keywords}</span>
                  </p>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{ct.message}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{t("dailyNextNotice")}</p>
                </>
              );
            })()
          ) : (
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {t("dailyDesc")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Index() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [concern, setConcern] = useState("");
  const { data: guides } = useSuspenseQuery(guidesQ);

  useEffect(() => {
    const after = sessionStorage.getItem("after-login");
    if (!after) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        sessionStorage.removeItem("after-login");
        navigate({ to: after as "/" });
      }
    });
  }, [navigate]);

  async function start() {
    if (concern.trim().length < 5) {
      toast(t("toastShortConcern"));
      return;
    }
    sessionStorage.setItem("pending-concern", concern.trim());
    if (!AD_ONLY_MODE) {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/auth", search: { redirect: "/new" } });
        return;
      }
    }
    navigate({ to: "/new" });
  }

  return (
    <>
    <main className="mx-auto max-w-3xl space-y-8 px-5 pb-16 pt-4">
      <div className="py-6 text-center">
        <h1 className="font-serif text-3xl font-bold leading-snug sm:text-4xl whitespace-pre-line">
          {t("heroTitle1")}
          <br />
          {t("heroTitle2")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("heroSubtitle")}</p>
      </div>

      <DailyTarot />

      <section className="rounded-3xl bg-cocoa p-6 text-cocoa-foreground shadow-warm sm:p-8">
        <h2 className="font-serif text-2xl font-bold">{t("consultTitle")}</h2>
        <p className="mt-1 text-sm opacity-80">{t("consultDesc")}</p>
        <Textarea
          value={concern}
          onChange={(e) => setConcern(e.target.value)}
          rows={5}
          maxLength={2000}
          suppressHydrationWarning
          placeholder={t("consultPlaceholder")}
          className="mt-4 border-none bg-card text-card-foreground"
        />
        <Button onClick={start} size="lg" className="mt-4 w-full">
          {t("consultButton")}
        </Button>
        <p className="mt-3 text-center text-[11px] leading-relaxed opacity-75">
          {t("consultDisclaimer")}
        </p>
      </section>

      <LatestGuides guides={guides} />

      {AD_ONLY_MODE ? (
        <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-warm">
          <h2 className="font-serif text-xl font-bold">{t("infoTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("infoSubtitle")}
          </p>
          <ul className="mt-4 divide-y divide-border/60 text-sm">
            <li className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="font-semibold">{t("infoStep1Title")}</p>
                <p className="text-xs text-muted-foreground">{t("infoStep1Desc")}</p>
              </div>
              <p className="shrink-0 font-bold text-primary">{t("freeBadge")}</p>
            </li>
            <li className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="font-semibold">{t("infoStep2Title")}</p>
                <p className="text-xs text-muted-foreground">{t("infoStep2Desc")}</p>
              </div>
              <p className="shrink-0 font-bold text-primary">{t("freeBadge")}</p>
            </li>
            <li className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="font-semibold">{t("infoStep3Title")}</p>
                <p className="text-xs text-muted-foreground">{t("infoStep3Desc")}</p>
              </div>
              <p className="shrink-0 font-bold text-primary">{t("freeBadge")}</p>
            </li>
          </ul>
        </section>
      ) : (
        <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-warm">
          <h2 className="font-serif text-xl font-bold">🍵 이용 요금 안내</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            매일 1장 행운 카드와 상담마다 2번의 대화는 무료예요. 더 깊이 이야기하고 싶을 때만 결제해요.
          </p>
          <ul className="mt-4 divide-y divide-border/60 text-sm">
            {PRODUCTS.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-semibold">{p.kind === "sub" ? `👑 ${p.name}` : `🌿 ${p.name}`}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.kind === "sub" ? "30일 이용권 · 매일 찻잎 1개 충전 · 자동 결제 없음" : p.desc}
                  </p>
                </div>
                <p className="shrink-0 font-bold">{p.price.toLocaleString("ko-KR")}원</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            찻잎 1개로 한 상담에서 대화를 4번 더 이어갈 수 있어요. 구매 후 7일 이내 미사용 시 전액 환불돼요.
          </p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => navigate({ to: "/membership" })}>
            멤버십 · 찻잎 충전 보러 가기
          </Button>
        </section>
      )}



      <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-warm">
        <h2 className="font-serif text-xl font-bold">{t("faqTitle")}</h2>
        <dl className="mt-4 space-y-3 text-sm leading-relaxed">
          <div>
            <dt className="font-semibold">{t("faqQ1")}</dt>
            <dd className="mt-0.5 text-muted-foreground">{t("faqA1")}</dd>
          </div>
          <div>
            <dt className="font-semibold">{t("faqQ2")}</dt>
            <dd className="mt-0.5 text-muted-foreground">{t("faqA2")}</dd>
          </div>
          <div>
            <dt className="font-semibold">{t("faqQ3")}</dt>
            <dd className="mt-0.5 text-muted-foreground">{t("faqA3")}</dd>
          </div>
        </dl>
      </section>

      <FixedAdBanner />
    </main>
    </>
  );
}
