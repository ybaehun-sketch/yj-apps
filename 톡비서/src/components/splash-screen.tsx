import React, { useState, useEffect } from "react";
import jungbiAvatar from "@/assets/jungbi-avatar.png";

export function SplashScreen({
  onFinish,
  duration = 500,
}: {
  onFinish?: () => void;
  duration?: number;
}) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, duration);

    const finishTimer = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, duration + 300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`absolute inset-0 z-100 flex items-center justify-center bg-background transition-opacity duration-300 ease-out ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
        <img
          src={jungbiAvatar}
          alt="톡비서"
          width={84}
          height={84}
          className="size-[84px] rounded-3xl object-cover shadow-lg ring-1 ring-border/40"
        />
      </div>
    </div>
  );
}
