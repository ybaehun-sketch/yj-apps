import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hubAdjustTarotLeaves, hubLookupTarotMember } from "@/lib/admin-hub.functions";

type FoundMember = {
  connected: true;
  found: true;
  userId: string;
  email: string;
  joinedAt: string;
  leaves: number;
  premiumUntil: string | null;
};

export function TarotMemberBlock({ connected }: { connected: boolean }) {
  const lookupFn = useServerFn(hubLookupTarotMember);
  const adjustFn = useServerFn(hubAdjustTarotLeaves);

  const [email, setEmail] = useState("");
  const [member, setMember] = useState<FoundMember | null>(null);
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSearch = async () => {
    if (!email.trim()) return;
    setBusy(true);
    try {
      const res = await lookupFn({ data: { email } });
      if (!res.connected) {
        toast.error("찻잔타로 연결 열쇠가 아직 설정되지 않았어요.");
        return;
      }
      if (!res.found) {
        setMember(null);
        toast("해당 이메일의 회원을 찾지 못했어요.");
      } else {
        setMember(res);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "회원 조회 실패");
    } finally {
      setBusy(false);
    }
  };

  const handleAdjust = async (sign: 1 | -1) => {
    if (!member) return;
    if (!reason.trim()) {
      toast.error("지급/차감 사유를 적어 주세요.");
      return;
    }
    const delta = sign * amount;
    if (!confirm(`${member.email} 님에게 찻잎 ${delta > 0 ? `+${delta}` : delta}개를 적용할까요?`)) return;
    setBusy(true);
    try {
      const res = await adjustFn({ data: { userId: member.userId, delta, reason } });
      setMember((prev) => (prev ? { ...prev, leaves: res.leaves } : prev));
      setReason("");
      toast.success("찻잎 수량을 적용했어요.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "적용 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">찻잔타로 · 회원 및 찻잎 관리 블록</h3>
          <p className="text-xs text-muted-foreground">특수 운영 기능: 회원 이메일로 보유 찻잎을 조회하고 보상·조정합니다.</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            connected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {connected ? "원격 연결됨" : "열쇠 대기중"}
        </span>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <Input
          type="email"
          placeholder="회원 이메일 입력"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!connected}
        />
        <Button type="submit" disabled={busy || !connected}>
          조회
        </Button>
      </form>

      {member && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{member.email}</span>
            <span className="rounded-md bg-primary/10 px-2.5 py-1 font-semibold text-primary">
              보유 찻잎: {member.leaves}개
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              type="number"
              min={1}
              max={100}
              className="w-24"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
            />
            <Input
              placeholder="지급/차감 사유 (예: 오류 보상)"
              className="flex-1"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button type="button" size="sm" onClick={() => handleAdjust(1)} disabled={busy}>
              지급(+)
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => handleAdjust(-1)} disabled={busy}>
              차감(-)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
