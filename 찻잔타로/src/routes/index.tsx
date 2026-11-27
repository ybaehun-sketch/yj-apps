import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LegalLinks } from "@/components/LegalPage";
import { BUSINESS } from "@/lib/business";
import { Textarea } from "@/components/ui/textarea";
import { FlipCard } from "@/components/TarotCardView";
import { FixedAdBanner } from "@/components/MockAds";
import { DAILY_MESSAGES, cardLabel, dailyCardFor, type TarotCard } from "@/lib/tarot";
import { PRODUCTS } from "@/lib/products";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listGuides } from "@/lib/guides.functions";
import { LatestGuides } from "@/components/HomeExtras";
import { AD_ONLY_MODE } from "@/lib/access";

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
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(guidesQ),
  component: Index,
});

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function DailyTarot() {
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
      toast("로그인하면 매일 1장 무료 행운 타로를 볼 수 있어요 🍵");
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
          aria-label="오늘의 카드 뽑기"
          className="w-32 shrink-0 transition-transform enabled:hover:-translate-y-1 sm:w-36"
        >
          <FlipCard card={card ?? dailyCardFor("x", "x")} flipped={flipped && !!card} />
        </button>
        <div className="text-center sm:text-left">
          <p className="text-xs tracking-widest text-primary">TODAY'S FREE TAROT</p>
          <h2 className="mt-1 font-serif text-2xl font-bold">오늘의 행운 타로</h2>
          {flipped && card ? (
            <>
              <p className="mt-3 font-serif text-lg text-foreground">
                {card.symbol} {cardLabel(card)}{" "}
                <span className="text-sm text-muted-foreground">· {card.keywords}</span>
              </p>
              <p className="mt-2 leading-relaxed text-muted-foreground">{DAILY_MESSAGES[card.id]}</p>
              <p className="mt-3 text-xs text-muted-foreground">내일 또 새로운 카드가 기다리고 있어요 ☕</p>
            </>
          ) : (
            <p className="mt-3 leading-relaxed text-muted-foreground">
              하루에 한 장, 마음을 가다듬고 카드를 눌러 오늘의 메시지를 받아보세요.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Index() {
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
      toast("고민을 조금만 더 자세히 들려주세요 🍵");
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
        <h1 className="font-serif text-3xl font-bold leading-snug sm:text-4xl">
          따뜻한 차 한 잔 앞에서,
          <br />
          오늘의 마음을 꺼내 보세요
        </h1>
        <p className="mt-3 text-muted-foreground">당신의 이야기와 3장의 카드로 나누는 1:1 타로 상담</p>
      </div>

      <DailyTarot />

      <section className="rounded-3xl bg-cocoa p-6 text-cocoa-foreground shadow-warm sm:p-8">
        <h2 className="font-serif text-2xl font-bold">깊은 고민 상담 시작하기</h2>
        <p className="mt-1 text-sm opacity-80">구체적으로 적을수록 카드가 더 또렷하게 이야기해 줘요.</p>
        <Textarea
          value={concern}
          onChange={(e) => setConcern(e.target.value)}
          rows={5}
          maxLength={2000}
          suppressHydrationWarning
          placeholder="예) 3년 다닌 회사를 그만두고 하고 싶던 공부를 시작해도 될지 고민이에요. 모아둔 돈은 조금 있지만 불안해요…"
          className="mt-4 border-none bg-card text-card-foreground"
        />
        <Button onClick={start} size="lg" className="mt-4 w-full">
          상담사 고르러 가기
        </Button>
      </section>

      <LatestGuides guides={guides} />

      {AD_ONLY_MODE ? (
        <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-warm">
          <h2 className="font-serif text-xl font-bold">🍵 무료 이용 안내</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            별도 결제 없이 누구나 무료로 타로 상담을 이용하실 수 있어요.
          </p>
          <ul className="mt-4 divide-y divide-border/60 text-sm">
            <li className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="font-semibold">🌅 매일 무료 새 상담</p>
                <p className="text-xs text-muted-foreground">하루 1회 무료 새 상담 + 짧은 광고 보고 하루 3회 추가 상담</p>
              </div>
              <p className="shrink-0 font-bold text-primary">무료</p>
            </li>
            <li className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="font-semibold">💬 대화 더 이어가기</p>
                <p className="text-xs text-muted-foreground">상담당 2번 무료 대화 후, 짧은 광고를 보면 2번씩 더 대화 가능</p>
              </div>
              <p className="shrink-0 font-bold text-primary">무료</p>
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



      <footer className="mt-10 border-t border-border/60 pt-5 text-[11px] leading-relaxed text-muted-foreground">
        <LegalLinks />
        <div className="mt-3 space-y-0.5">
          <p>{BUSINESS.name} · 문의 {BUSINESS.email}</p>
          <p className="pt-1">© 2026 {BUSINESS.name}. All rights reserved.</p>
        </div>
      </footer>
      <FixedAdBanner />
    </main>
    </>
  );
}
