import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckoutDialog, resumePendingPayment, won } from "@/components/CheckoutDialog";
import { getMembership, setMembership, syncWallet } from "@/lib/membership";
import { AD_ONLY_MODE } from "@/lib/access";
import { SUB, SUB_BONUS_LEAVES, PACKS, portoneReady, type Product } from "@/lib/products";

export const Route = createFileRoute("/membership")({
  head: () => ({
    meta: [
      { title: "멤버십 · 찻잎 충전 — 찻잔 타로" },
      { name: "description", content: "매일 찻잎을 채워주는 티룸 멤버십과 찻잎 충전으로 더 깊은 타로 상담을 즐겨보세요." },
      { property: "og:title", content: "멤버십 · 찻잎 충전 — 찻잔 타로" },
      { property: "og:description", content: "매일 찻잎 1개, 티룸 멤버십과 찻잎 충전." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MembershipPage,
});


function MembershipPage() {
  const navigate = useNavigate();
  const [state, setState] = useState({ premium: false, leaves: 0 });
  const [buying, setBuyingRaw] = useState<Product | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    setState(getMembership());
    syncWallet().then(setState);
    const q = new URLSearchParams(window.location.search);
    const pid = q.get("paymentId");
    if (pid) {
      window.history.replaceState(null, "", "/membership");
      resumePendingPayment(pid, q.get("code"))
        .then((r) => {
          if (r) { setState(getMembership()); toast.success("결제가 완료됐어요 🍵"); }
        })
        .catch((e) => toast.error(e instanceof Error ? e.message : "결제 확인에 실패했어요"));
    }
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, []);
  function setBuying(p: Product | null) {
    if (p && !uid) {
      toast("멤버십과 찻잎 충전은 로그인 후 이용할 수 있어요 🍵");
      navigate({ to: "/auth", search: { redirect: "/membership" } });
      return;
    }
    setBuyingRaw(p);
  }

  function complete(p: Product, real?: boolean) {
    const next = real ? getMembership() : p.kind === "sub" ? { ...state, premium: true, leaves: state.leaves + SUB_BONUS_LEAVES } : { ...state, leaves: state.leaves + (p.leaves ?? 0) };
    setMembership(next);
    setState(next);
    toast.success(p.kind === "sub" ? `티룸 멤버십이 시작됐어요 🍵 보너스 찻잎 ${SUB_BONUS_LEAVES}개를 드렸어요` : `찻잎 ${p.leaves}개가 충전됐어요 🌿`);
  }

  if (AD_ONLY_MODE) {
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-12 text-center">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-warm">
          <p className="text-4xl">🍵</p>
          <h1 className="mt-3 font-serif text-2xl font-bold">지금은 모든 상담이 무료예요</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            별도 결제 없이 매일 무료 새 상담과 짧은 광고 보상으로 대화를 이어가실 수 있어요.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate({ to: "/new" })}>새 타로 상담 시작하기</Button>
            <Button variant="outline" onClick={() => navigate({ to: "/" })}>홈으로 돌아가기</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-bold">더 깊은 차 한 잔</h1>
        <p className="mt-2 text-muted-foreground">마음이 필요할 때, 원하는 만큼만.</p>
        <p className="mt-3 inline-block rounded-full bg-secondary px-4 py-1 text-sm">
          {state.premium ? "👑 멤버십 이용 중" : "무료 이용 중"} · 보유 찻잎 🌿 {state.leaves}개
        </p>
      </div>

      <section className="rounded-3xl bg-cocoa p-6 text-cocoa-foreground shadow-warm sm:p-8">
        <p className="text-xs opacity-70">가장 인기</p>
        <h2 className="font-serif text-2xl font-bold">👑 티룸 멤버십</h2>
        <p className="mt-1 text-3xl font-bold">
          {won(SUB.price)}
          <span className="text-base font-normal opacity-70"> / 30일</span>
        </p>
        <ul className="mt-4 space-y-1.5 text-sm">
          <li>✓ 매일 찻잎 1개 충전 (30일간 총 30개)</li>
          <li>✓ 시작하자마자 보너스 찻잎 {SUB_BONUS_LEAVES}개</li>
          <li>✓ 찻잎 1개당 약 240원, 단품보다 78% 알뜰해요</li>
        </ul>
        <Button
          size="lg"
          className="mt-6 w-full"
          disabled={state.premium}
          onClick={() => setBuying(SUB)}
        >
          {state.premium ? "이용 중이에요 · 오늘 찻잎은 받았어요" : "멤버십 시작하기"}
        </Button>
        <p className="mt-2 text-center text-xs opacity-70">자동 결제되지 않아요 · 30일이 지나면 무료 이용으로 돌아가요</p>
      </section>

      <section>
        <h2 className="font-serif text-xl font-bold">🌿 찻잎 충전 (단건 복채)</h2>
        <p className="text-sm text-muted-foreground">상담마다 2번은 무료, 찻잎 1개를 쓰면 그 상담에서 4번 더 대화할 수 있어요.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PACKS.map((p) => (
            <button
              key={p.id}
              onClick={() => setBuying(p)}
              className="rounded-2xl border border-border bg-card p-5 text-left shadow-warm transition hover:-translate-y-0.5"
            >
              <p className="font-serif text-lg font-bold">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
              <p className="mt-3 text-xl font-bold">{won(p.price)}</p>
            </button>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        {portoneReady() ? "※ 멤버십은 30일 이용권이며 자동 갱신되지 않아요." : "※ 현재는 체험용 가상 결제 화면이에요. 실제로 돈이 결제되지 않아요."}
      </p>

      <CheckoutDialog product={buying} onClose={() => setBuying(null)} onDone={complete} />
    </main>
  );
}

