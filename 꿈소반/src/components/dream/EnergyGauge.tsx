import { useEffect, useState } from "react";
import { sfx } from "@/lib/sfx";

export function EnergyGauge({ value, onSettled }: { value: number; onSettled?: () => void }) {
  const [shown, setShown] = useState(0);
  const high = value >= 70;
  useEffect(() => {
    sfx.rise(2.2);
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 2200);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(step);
      else onSettled?.();
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <span className="text-base text-muted-foreground">꿈 에너지 게이지</span>
        <span className="font-serif text-3xl text-moon-gradient">{shown}%</span>
      </div>
      <div className="relative h-5 overflow-hidden rounded-full border border-border bg-muted">
        <div
          className={`h-full rounded-full ${high ? "bg-gauge-high shadow-glow" : "bg-gauge-low"}`}
          style={{ width: `${shown}%` }}
        />
        <div className="absolute inset-y-0 left-[40%] w-px bg-foreground/30" />
        <div className="absolute inset-y-0 left-[70%] w-px bg-foreground/30" />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>🌪️ 개꿈</span>
        <span>평범</span>
        <span>🔥 대박 길몽</span>
      </div>
    </div>
  );
}
