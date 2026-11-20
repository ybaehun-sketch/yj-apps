import { useEffect, useState } from "react";

type Star = { x: number; y: number; s: number; d: number };

export function StarField() {
  const [stars, setStars] = useState<Star[]>([]);
  useEffect(() => {
    setStars(
      Array.from({ length: 70 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 2 + 0.6,
        d: Math.random() * 4,
      })),
    );
  }, []);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      {stars.map((st, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-moon animate-twinkle"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, animationDelay: `${st.d}s` }}
        />
      ))}
      <div className="absolute -top-24 right-[-60px] h-56 w-56 rounded-full bg-moon-gradient opacity-80 blur-[2px] shadow-glow animate-floaty" />
      <div className="absolute top-1/3 left-0 h-40 w-[140%] rounded-full bg-accent/10 blur-3xl animate-drift" />
      <div className="absolute bottom-10 left-0 h-48 w-[140%] rounded-full bg-moon/5 blur-3xl animate-drift" />
    </div>
  );
}
