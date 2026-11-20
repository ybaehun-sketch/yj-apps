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
        <DialogTitle className="text-center text-lg">📺 잠시 광고를 시청해 주세요</DialogTitle>
        <DialogDescription className="text-center text-muted-foreground">{message}</DialogDescription>
        <div className="relative mt-2 flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted">
          <span className="text-xs tracking-widest text-muted-foreground">AD · 광고 영역</span>
          <span className="absolute right-2 top-2 rounded-full bg-background/70 px-2 py-0.5 text-xs">{left}초</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-moon-gradient transition-all duration-1000 ease-linear"
            style={{ width: `${((seconds - left) / seconds) * 100}%` }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {left > 0 ? `${left}초 후 자동으로 잠금이 해제됩니다` : "잠금 해제 완료 ✨"}
        </p>
      </DialogContent>
    </Dialog>
  );
}
