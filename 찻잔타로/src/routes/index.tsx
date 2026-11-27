import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
        <p className="mt-3 text-center text-[11px] leading-relaxed opacity-75">
          ※ AI 타로 상담은 가벼운 성찰과 재미를 위한 참고용이며, 의학·법률·투자 자문을 대신하지 않습니다.
        </p>
      </section>

      <LatestGuides guides={guides} />

      {AD_ONLY_MODE ? (
        <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-warm">
          <h2 className="font-serif text-xl font-bold">🍵 찻잔 타로 이용 안내</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            별도 회원가입이나 결제 없이 누구나 무료로 타로 상담을 이용하실 수 있어요.
          </p>
          <ul className="mt-4 divide-y divide-border/60 text-sm">
            <li className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="font-semibold">1. 고민 적고 카드 3장 뽑기</p>
                <p className="text-xs text-muted-foreground">고민을 적은 뒤 원하는 AI 상담사를 고르고 직감으로 3장의 카드를 선택해요</p>
              </div>
              <p className="shrink-0 font-bold text-primary">무료</p>
            </li>
            <li className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="font-semibold">2. 매일 무료 새 상담</p>
                <p className="text-xs text-muted-foreground">하루 1회 무료 새 상담 + 잠시 차 우리는 휴식 후 하루 3회 추가 상담</p>
              </div>
              <p className="shrink-0 font-bold text-primary">무료</p>
            </li>
            <li className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="font-semibold">3. 대화 이어가기 &amp; 마음 처방전</p>
                <p className="text-xs text-muted-foreground">상담당 2번 무료 대화 후 잠시 기다리면 2번씩 추가 대화 및 한 줄 처방전 발급</p>
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



      <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-warm">
        <h2 className="font-serif text-xl font-bold">자주 묻는 질문</h2>
        <dl className="mt-4 space-y-3 text-sm leading-relaxed">
          <div>
            <dt className="font-semibold">Q. 회원가입이나 로그인이 필요한가요?</dt>
            <dd className="mt-0.5 text-muted-foreground">아니요, 별도의 가입 절차 없이 바로 고민을 적고 카드를 뽑아 상담을 시작할 수 있어요.</dd>
          </div>
          <div>
            <dt className="font-semibold">Q. 상담 내용은 다른 사람에게 공개되나요?</dt>
            <dd className="mt-0.5 text-muted-foreground">모든 상담은 1:1 비공개로 진행되며, 이용자 기기에만 임시 저장되어 언제든 브라우저에서 지울 수 있어요.</dd>
          </div>
          <div>
            <dt className="font-semibold">Q. 타로 결과를 그대로 믿어도 되나요?</dt>
            <dd className="mt-0.5 text-muted-foreground">찻잔 타로는 마음을 정리하고 스스로를 돌아보는 AI 엔터테인먼트 서비스입니다. 중요한 의학·법률·투자 결정은 반드시 전문가와 상의해 주세요.</dd>
          </div>
        </dl>
      </section>

      <FixedAdBanner />
    </main>
    </>
  );
}
