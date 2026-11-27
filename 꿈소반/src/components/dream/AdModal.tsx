import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { sfx } from "@/lib/sfx";

export function AdModal({
  open,
  message,
  seconds = 5,
  onDone,
}: {
  open: boolean;
  message: string;
  seconds?: number;
  onDone: () => void;
}) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!open) return;
    setLeft(seconds);
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(id);
          setTimeout(onDone, 250);
          return 0;
        }
        sfx.tap();
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open}>
      <DialogContent
        className="glass max-w-sm border-border text-foreground [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="text-center text-lg">🌙 꿈의 기운을 모으는 중이에요</DialogTitle>
        <DialogDescription className="text-center text-muted-foreground">{message}</DialogDescription>
        <div className="relative mt-2 flex aspect-video flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-border/60 bg-background/40">
          <span className="text-4xl">✨</span>
          <span className="text-xs text-muted-foreground">잠시만 기다려 주세요 ({left}초)</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-moon-gradient transition-all duration-1000 ease-linear"
            style={{ width: `${((seconds - left) / seconds) * 100}%` }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {left > 0 ? `${left}초 후 자동으로 열립니다` : "준비 완료 ✨"}
        </p>
      </DialogContent>
    </Dialog>
  );
}
