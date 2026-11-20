import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** 가상(데모) 네이티브 배너 광고 */
export function AdBanner() {
  return (
    <aside className="relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-warm">
      <span className="absolute right-3 top-2 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">AD · 예시</span>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-3xl">🫖</div>
      <div className="min-w-0 flex-1">
        <p className="font-serif font-bold">달빛 허브티 블렌드</p>
        <p className="text-sm text-muted-foreground">잠들기 전 한 잔, 마음이 차분해지는 캐모마일 · 라벤더</p>
      </div>
      <Link to="/membership" className="shrink-0 text-xs text-muted-foreground underline">
        찻잎 충전하기
      </Link>
    </aside>
  );
}

/** 화면 하단에 고정되는 배너 광고 (홈·상담사 선택·카드 뽑기 공통) */
export function FixedAdBanner() {
  return (
    <>
      <div aria-hidden className="h-24" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <aside className="relative flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-warm">
            <span className="absolute right-2 top-1 rounded bg-muted px-1 text-[9px] text-muted-foreground">AD · 예시</span>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-2xl">🫖</div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-sm font-bold">달빛 허브티 블렌드</p>
              <p className="truncate text-xs text-muted-foreground">잠들기 전 한 잔, 캐모마일 · 라벤더</p>
            </div>
            <Link to="/membership" className="shrink-0 self-end text-[11px] text-muted-foreground underline">
              찻잎 충전
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}

/** 가상 보상형 광고: 카운트다운이 끝나면 onReward 호출 */
export function RewardedAdDialog({
  open,
  onOpenChange,
  onReward,
  seconds = 5,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onReward: () => void;
  seconds?: number;
}) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!open) return;
    setLeft(seconds);
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [open, seconds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-none bg-cocoa p-6 text-cocoa-foreground">
        <DialogTitle className="sr-only">광고 시청</DialogTitle>
        <p className="text-center text-xs opacity-70">AD · 가상 광고 예시</p>
        <div className="my-4 flex aspect-[4/5] flex-col items-center justify-center rounded-2xl bg-card text-card-foreground">
          <span className="animate-steam text-6xl">☕</span>
          <p className="mt-4 font-serif text-xl font-bold">포근 로스터리</p>
          <p className="mt-1 px-6 text-center text-sm text-muted-foreground">오늘 하루 수고한 당신에게, 따뜻한 라떼 한 잔</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-background/20">
          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${((seconds - left) / seconds) * 100}%` }} />
        </div>
        <Button
          className="mt-4 w-full"
          disabled={left > 0}
          onClick={() => {
            onReward();
            onOpenChange(false);
          }}
        >
          {left > 0 ? `차 한 잔 우리는 중… ${left}초` : "보상 받기 🍵"}
        </Button>
        <Link to="/membership" className="mt-2 block text-center text-xs underline opacity-70">
          찻잎 충전하고 바로 대화하기
        </Link>
      </DialogContent>
    </Dialog>
  );
}
