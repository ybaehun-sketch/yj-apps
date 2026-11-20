import { useEffect, useMemo, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";

function pick6() {
  const s = new Set<number>();
  while (s.size < 6) s.add(1 + Math.floor(Math.random() * 45));
  return [...s].sort((a, b) => a - b);
}

function ballClass(n: number) {
  if (n <= 10) return "bg-moon text-primary-foreground";
  if (n <= 20) return "bg-calm text-primary-foreground";
  if (n <= 30) return "bg-destructive text-destructive-foreground";
  if (n <= 40) return "bg-muted-foreground text-background";
  return "bg-lucky text-primary-foreground";
}

export function LottoScratch() {
  const nums = useMemo(pick6, []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const drawing = useRef(false);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    cv.width = r.width * 2;
    cv.height = r.height * 2;
    const g = cv.getContext("2d")!;
    const css = getComputedStyle(document.documentElement);
    const grad = g.createLinearGradient(0, 0, cv.width, cv.height);
    grad.addColorStop(0, css.getPropertyValue("--muted-foreground"));
    grad.addColorStop(0.5, css.getPropertyValue("--moon"));
    grad.addColorStop(1, css.getPropertyValue("--muted-foreground"));
    g.fillStyle = grad;
    g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = css.getPropertyValue("--primary-foreground");
    g.font = `bold ${cv.height / 6}px "Gowun Dodum", sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("🪙 동전으로 긁어보세요", cv.width / 2, cv.height / 2);
  }, []);

  const scratch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || revealed) return;
    const cv = canvasRef.current!;
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) * 2;
    const y = (e.clientY - r.top) * 2;
    const g = cv.getContext("2d")!;
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.arc(x, y, 34, 0, Math.PI * 2);
    g.fill();
    if (Math.random() < 0.3) sfx.scratch();
    if (Math.random() < 0.1) {
      const d = g.getImageData(0, 0, cv.width, cv.height).data;
      let clear = 0;
      for (let i = 3; i < d.length; i += 64) if (d[i] === 0) clear++;
      if (clear / (d.length / 64) > 0.5) {
        setRevealed(true);
        sfx.reward();
      }
    }
  };

  return (
    <div className="animate-rise flex flex-col items-center gap-3">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-moon/60 bg-secondary p-5">
        <p className="mb-3 text-center font-serif text-base text-moon">🎟️ 이번 주 꿈 행운 번호</p>
        <div className="flex justify-center gap-2">
          {nums.map((n) => (
            <span key={n} className={`flex h-10 w-10 items-center justify-center rounded-full font-bold shadow-glow ${ballClass(n)}`}>
              {n}
            </span>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full touch-none cursor-pointer transition-opacity duration-700 ${revealed ? "pointer-events-none opacity-0" : ""}`}
          onPointerDown={(e) => {
            drawing.current = true;
            scratch(e);
          }}
          onPointerMove={scratch}
          onPointerUp={() => (drawing.current = false)}
          onPointerLeave={() => (drawing.current = false)}
        />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {revealed ? "조상님의 기운이 담긴 번호예요. 재미로만 즐겨주세요 🍀" : "손가락이나 마우스로 은박을 긁어주세요"}
      </p>
    </div>
  );
}
