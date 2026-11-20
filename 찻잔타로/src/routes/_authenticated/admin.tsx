import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuideEditor } from "@/components/GuideEditor";
import { adminAdjustLeaves, adminLookup, checkAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "찻잔 타로 · 운영자 화면" },
      { name: "description", content: "찻잔 타로 운영자 전용 찻잎 관리 화면" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Found = Extract<Awaited<ReturnType<typeof adminLookup>>, { found: true }>;
const fmt = (s: string) => new Date(s).toLocaleString("ko-KR");

function AdminPage() {
  const check = useServerFn(checkAdmin);
  const lookup = useServerFn(adminLookup);
  const adjust = useServerFn(adminAdjustLeaves);
  const { data: me, isLoading } = useQuery({ queryKey: ["is-admin"], queryFn: () => check() });
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<Found | null>(null);
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"guides" | "members">("guides");

  if (isLoading) return <p className="p-8 text-center text-muted-foreground">확인하는 중…</p>;
  if (!me?.admin)
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="mb-4">운영자만 들어올 수 있는 곳이에요.</p>
        <Link to="/" className="underline">홈으로</Link>
      </div>
    );

  const search = async () => {
    setBusy(true);
    try {
      const r = await lookup({ data: { email } });
      if (!r.found) { setUser(null); toast("해당 이메일의 회원이 없어요."); }
      else setUser(r);
    } catch (e) { toast.error(e instanceof Error ? e.message : "조회 실패"); }
    finally { setBusy(false); }
  };

  const apply = async (sign: 1 | -1) => {
    if (!user) { return; }
    if (!reason.trim()) { toast.error("사유를 적어주세요."); return; }
    const delta = sign * amount;
    if (!confirm(`${user.email} 님에게 찻잎 ${delta > 0 ? "+" : ""}${delta}개를 적용할까요?`)) { return; }
    setBusy(true);
    try {
      await adjust({ data: { userId: user.userId, delta, reason } });
      toast.success("적용했어요.");
      setReason("");
      const r = await lookup({ data: { email: user.email } });
      if (r.found) setUser(r);
    } catch (e) { toast.error(e instanceof Error ? e.message : "적용 실패"); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 p-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl">운영자 화면</h1>
        <Link to="/" className="text-sm text-muted-foreground underline">홈</Link>
      </header>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(["guides", "members"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`rounded-lg py-2 text-sm font-medium ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {t === "guides" ? "글 관리" : "회원·찻잎 관리"}
          </button>
        ))}
      </div>

      {tab === "guides" ? <GuideEditor /> : (<>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); search(); }}>
        <Input type="email" placeholder="회원 이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" disabled={busy || !email}>찾기</Button>
      </form>

      {user && (
        <section className="space-y-5 rounded-2xl border border-border bg-card p-5">
          <div>
            <p className="font-medium">{user.email}</p>
            <p className="text-xs text-muted-foreground">가입 {fmt(user.joinedAt)}</p>
            <p className="mt-2 text-lg">🌿 찻잎 {user.leaves}개</p>
            {user.premiumUntil && <p className="text-sm text-muted-foreground">멤버십 ~ {fmt(user.premiumUntil)}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Input type="number" min={1} max={100} value={amount} className="w-24"
                onChange={(e) => setAmount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} />
              <Input placeholder="사유 (예: 장애 보상)" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" disabled={busy} onClick={() => apply(1)}>찻잎 채워주기</Button>
              <Button className="flex-1" variant="outline" disabled={busy} onClick={() => apply(-1)}>찻잎 회수</Button>
            </div>
            <p className="text-xs text-muted-foreground">돈 환불은 포트원 관리자 화면에서 결제 취소로 따로 해주세요.</p>
          </div>

          <div>
            <h2 className="mb-1 text-sm font-medium">최근 결제</h2>
            {user.payments.length === 0 ? <p className="text-xs text-muted-foreground">없음</p> :
              <ul className="space-y-1 text-xs">{user.payments.map((p) => (
                <li key={p.payment_id}>{fmt(p.created_at)} · {p.product_id} · {p.amount.toLocaleString()}원 · {p.status}<br />
                  <span className="text-muted-foreground">{p.payment_id}</span></li>))}</ul>}
          </div>
          <div>
            <h2 className="mb-1 text-sm font-medium">지급·회수 기록</h2>
            {user.adjustments.length === 0 ? <p className="text-xs text-muted-foreground">없음</p> :
              <ul className="space-y-1 text-xs">{user.adjustments.map((a, i) => (
                <li key={i}>{fmt(a.created_at)} · {a.delta > 0 ? "+" : ""}{a.delta}개 · {a.reason}</li>))}</ul>}
          </div>
        </section>
      )}
      </>)}
    </div>
  );
}
