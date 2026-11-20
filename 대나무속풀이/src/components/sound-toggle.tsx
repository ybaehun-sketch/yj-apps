import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundOn, setSoundOn, sfx } from "@/lib/sound";

export function SoundToggle() {
  const [on, setOn] = useState(true);
  useEffect(() => setOn(isSoundOn()), []);
  return (
    <button
      type="button"
      onClick={() => {
        setSoundOn(!on);
        setOn(!on);
        if (!on) sfx.chime();
      }}
      aria-label={on ? "소리 끄기" : "소리 켜기"}
      title={on ? "소리 끄기" : "소리 켜기"}
      className="flex size-10 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground backdrop-blur transition hover:text-foreground"
    >
      {on ? <Volume2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}
    </button>
  );
}
