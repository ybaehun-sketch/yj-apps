// Tiny synthesized sound effects (Web Audio API) — no audio files. Browser-only; call from handlers/effects.
const KEY = "teacup-sound-off";
let ctx: AudioContext | null = null;

export function isSoundOn() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) !== "1";
}
export function setSoundOn(on: boolean) {
  localStorage.setItem(KEY, on ? "0" : "1");
}

function ac() {
  if (!isSoundOn()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, vol = 0.08, type: OscillatorType = "sine") {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(start: number, dur: number, vol = 0.05, cutoff = 2500) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = cutoff;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}

export function haptic(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* unsupported */
  }
}

export const sfx = {
  shuffle() {
    for (let i = 0; i < 6; i++) noise(i * 0.07, 0.08, 0.04, 1800 + i * 200);
    haptic(20);
  },
  pick() {
    noise(0, 0.06, 0.05, 3000);
    tone(880, 0.02, 0.3, 0.04);
    haptic(12);
  },
  flip() {
    [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, i * 0.09, 0.9, 0.035));
    haptic(25);
  },
  // Teacup "clink" for new message / prescription done
  clink() {
    tone(2637, 0, 0.6, 0.03);
    tone(3951, 0.005, 0.4, 0.015);
  },
};
