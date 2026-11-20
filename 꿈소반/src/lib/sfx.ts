let ctx: AudioContext | null = null;
function ac() {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.12) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function buzz(ms = 12) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(ms);
}

export const sfx = {
  tap() {
    tone(660, 0, 0.09, "triangle", 0.08);
    buzz(8);
  },
  chime() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.12, 1.2, "sine", 0.09));
    buzz(20);
  },
  rise(duration = 2) {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    const t = c.currentTime;
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(880, t + duration);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration + 0.3);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + duration + 0.4);
  },
  reward() {
    [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => tone(f, i * 0.08, 0.7, "triangle", 0.08));
    buzz(40);
  },
  scratch() {
    tone(1800 + Math.random() * 600, 0, 0.03, "square", 0.015);
  },
};
